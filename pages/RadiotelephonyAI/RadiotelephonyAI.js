// RadiotelephonyAI.js - 云塔智联 · PEPEC 陆空通话情景训练
//
// 复刻自 https://www.oldsai.cn/PEPEC_Learning/api/index.html
// 与网页版的差异：小程序 wx.request 不支持流式读取，
// 改为非流式一次性返回 + 前端打字机模拟。

// ================================================================
// 接口配置（按需直接修改以下常量）
// ================================================================
const CONFIG = {
  // 聊天模型：Radiotelephony1.0-Pilots-64M 自建服务（OpenAI 兼容）
  // 鉴权：接口按白名单校验访问代码（请求体 access_code 字段），
  //      代码清单在模型目录的 whitelist.txt，由用户在页面上输入。
  // 注意：该模型未经 system 角色训练，发 system 会让输出明显跑偏，
  //      所以这里不配 systemPrompt，首条指令就是一句纯文本。
  baseUrl: 'https://aiapi.oldsai.cn/v1',
  model: 'Radiotelephony1.0-Pilots-64M',
  temperature: 0.7,
  // wx.request 无法读取流式响应，这里固定非流式；
  // 打字机效果由前端定时器逐字模拟（见 TYPE_STEP / TYPE_INTERVAL）。
  stream: false
};

// 打字机输出速度：每帧字符数 / 帧间隔(ms)
const TYPE_STEP = 2;
const TYPE_INTERVAL = 24;

// 访问代码在本机的存储键：验证通过后记住，重进页面免再验证
const STORAGE_CODE = 'radiotelephony_access_code';

Page({
  data: {
    // ---------- 访问代码认证 ----------
    // 白名单由接口强制校验：未验证也能浏览页面、选模式、点发送，
    // 只是请求会被接口拒绝（401），页面把接口给的说明原样显示出来。
    verified: false,        // 访问代码是否已通过验证
    codeInput: '',          // 用户输入的访问代码
    verifying: false,       // 验证请求中
    authTip: '未验证：接口将拒绝返回结果',
    authTipBad: false,      // 上面的提示是否为错误态

    // ---------- 模型信息 ----------
    modelName: CONFIG.model,
    modelUrl: 'https://www.modelscope.cn/models/PangXitong/Radiotelephony1.0-Pilots-64M/',

    // ---------- 对话 ----------
    started: false,         // 首条消息是否已发送
    messages: [],           // 渲染用的气泡列表 { role, text, reason, typing }
    inputValue: '',
    generating: false,
    chatTip: '首次使用请点击下方「开始」按钮发送首条指令，即可开始对话。',
    scrollIntoView: '',

    // ---------- 派生的发送权限（已开始训练 + 不在生成中） ----------
    canInput: false,
    canSend: false
  },

  // 非渲染状态
  history: [],              // OpenAI messages 数组（只有 user / assistant）
  accessCode: '',           // 已通过验证的访问代码（只放在内存里，退出页面即失效）
  typeTimer: null,
  msgSeq: 0,

  onLoad() {
    // 开启「分享给朋友」与「分享到朋友圈」两个入口
    if (wx.showShareMenu) {
      wx.showShareMenu({
        withShareTicket: true,
        menus: ['shareAppMessage', 'shareTimeline']
      });
    }

    // 先用本机记住的访问代码恢复验证态，再静默复核
    this.restoreAuth();
    this.syncSendState();
  },

  onShow() {
    // 部分低版本基础库需要每次显示页面时重新开启朋友圈分享入口
    if (wx.showShareMenu) {
      wx.showShareMenu({
        withShareTicket: true,
        menus: ['shareAppMessage', 'shareTimeline']
      });
    }
  },

  onUnload() {
    this.clearTypeTimer();
  },

  onHide() {
    this.clearTypeTimer();
  },

  /**
   * 统一刷新「能否输入 / 能否发送」派生状态。
   * 开始按钮/发送按钮在未生成时始终可点（首次「开始」不受 started 限制），
   * 输入框则要在首条指令发出（started）后才能真正输入。
   */
  syncSendState() {
    const { started, generating } = this.data;
    this.setData({
      canInput: started && !generating,
      canSend: !generating
    });
  },

  // ================================================================
  //  1. 访问代码（白名单认证）
  //     白名单由接口强制校验：没有验证也能浏览整个页面、选模式、点发送，
  //     只是请求会被接口拒绝（401），页面把接口给的说明原样显示出来。
  // ================================================================

  /** 从接口返回体里取出可读的错误说明 */
  apiError(data, status) {
    if (data && data.error && data.error.message) return data.error.message;
    if (data && typeof data.detail === 'string') return data.detail;
    if (data && data.detail) return JSON.stringify(data.detail);
    return 'HTTP ' + status;
  },

  /** 刷新认证区的提示文案与样式 */
  renderAuth(msg, bad) {
    const verified = this.data.verified;
    this.setData({
      authTip: msg || (verified ? '已验证：接口将正常返回结果' : '未验证：接口将拒绝返回结果'),
      authTipBad: !!bad
    });
  },

  /**
   * 读出本机记住的访问代码并静默复核。
   * 记下来只是为了免去重复输入，最终仍以接口白名单为准：
   * 复核失败（代码被移除、服务端换了白名单）就清掉记录，回到未验证态。
   */
  restoreAuth() {
    let cached = '';
    try {
      cached = wx.getStorageSync(STORAGE_CODE) || '';
    } catch (e) {
      console.error('读取访问代码失败', e);
    }
    if (!cached) return;

    // 先把代码用起来，界面立即呈现已记住的状态，不等复核结果
    this.accessCode = cached;
    this.setData({ verified: true, codeInput: cached });
    this.renderAuth('已记住本机验证，正在复核…', false);

    wx.request({
      url: CONFIG.baseUrl + '/auth/verify',
      method: 'POST',
      timeout: 30000,
      header: { 'Content-Type': 'application/json' },
      data: { code: cached },
      success: (res) => {
        if (res.statusCode === 200) {
          this.renderAuth('已验证：接口将正常返回结果', false);
          return;
        }
        // 复核未通过：代码已失效，清掉记录并说明原因
        this.forgetCode();
        this.renderAuth('验证已失效，请重新输入访问代码：'
          + this.apiError(res.data || {}, res.statusCode), true);
      },
      fail: () => {
        // 网络异常不代表代码失效，保留记录，等下次发送时由接口判定
        this.renderAuth('已记住本机验证（暂未连上服务器，发送时将复核）', false);
      }
    });
  },

  /** 把访问代码记到本机，重进页面免再验证 */
  rememberCode(code) {
    try {
      wx.setStorageSync(STORAGE_CODE, code);
    } catch (e) {
      console.error('保存访问代码失败', e);
    }
  },

  /** 清除本机记住的访问代码 */
  forgetCode() {
    this.accessCode = '';
    this.setData({ verified: false, codeInput: '' });
    try {
      wx.removeStorageSync(STORAGE_CODE);
    } catch (e) {
      console.error('清除访问代码失败', e);
    }
  },

  /** 清空验证态（同时忘掉本机记录） */
  clearAuth() {
    this.forgetCode();
  },

  onCodeInput(e) {
    this.setData({ codeInput: e.detail.value });
  },

  /** 验证访问代码：调用接口的 /auth/verify，不产生任何模型推理 */
  onVerifyTap() {
    const code = String(this.data.codeInput || '').trim();
    if (!code) {
      this.clearAuth();
      this.renderAuth('请先输入访问代码', true);
      return;
    }
    if (this.data.verifying) return;

    this.setData({ verifying: true });
    this.renderAuth('验证中…', false);

    wx.request({
      url: CONFIG.baseUrl + '/auth/verify',
      method: 'POST',
      timeout: 30000,
      header: { 'Content-Type': 'application/json' },
      data: { code: code },
      success: (res) => {
        const data = res.data || {};
        if (res.statusCode !== 200) {
          this.clearAuth();
          this.setData({ verifying: false });
          this.renderAuth('验证失败：' + this.apiError(data, res.statusCode), true);
          return;
        }
        // 验证通过：记到本机（重进免再验证），并留在内存里随聊天请求一起发
        this.accessCode = code;
        this.rememberCode(code);
        this.setData({ verified: true, verifying: false });
        this.renderAuth('验证通过：' + (data.message || '该代码在白名单内') + '（已记住本机）', false);
        wx.showToast({ title: '验证通过', icon: 'success' });
      },
      fail: (err) => {
        this.clearAuth();
        this.setData({ verifying: false });
        const msg = (err && err.errMsg) ? err.errMsg : '请求失败';
        this.renderAuth('验证失败：' + msg + '（' + CONFIG.baseUrl + ' 是否可以访问？）', true);
      }
    });
  },

  // 主动清除已验证状态，便于换码；清除后仅接口会拒绝，页面照常可看
  onLogout() {
    wx.showModal({
      title: '退出验证',
      content: '确定要清除本机记住的访问代码吗？',
      success: (res) => {
        if (!res.confirm) return;
        this.clearAuth();
        this.renderAuth('未验证：接口将拒绝返回结果', false);
        wx.showToast({ title: '已清除验证', icon: 'none' });
      }
    });
  },

  // ================================================================
  //  3. 对话渲染
  // ================================================================
  /**
   * 追加一条气泡，返回其在 messages 中的索引
   * @param {boolean} pending - 是否处于等待模型返回的状态（显示转圈）
   */
  pushBubble(role, text, reason, pending) {
    const messages = this.data.messages.concat([{
      id: ++this.msgSeq,
      role: role,
      text: text || '',
      reason: reason || '',
      typing: false,
      pending: !!pending,
      showReason: false
    }]);
    this.setData({ messages: messages, chatTip: '' });
    this.scrollToBottom(messages);
    return messages.length - 1;
  },

  /** 更新指定气泡内容 */
  updateBubble(index, patch) {
    const key = 'messages[' + index + ']';
    const data = {};
    Object.keys(patch).forEach((k) => {
      data[key + '.' + k] = patch[k];
    });
    this.setData(data);
  },

  scrollToBottom(list) {
    const arr = list || this.data.messages;
    if (!arr.length) return;
    // 借用最后一条消息的 id 作为锚点
    this.setData({ scrollIntoView: 'msg-' + arr[arr.length - 1].id });
  },

  onToggleReason(e) {
    const index = parseInt(e.currentTarget.dataset.index, 10);
    if (isNaN(index)) return;
    this.updateBubble(index, { showReason: !this.data.messages[index].showReason });
  },

  // ================================================================
  //  4. 调用模型（OpenAI 兼容 Chat Completions，非流式）
  // ================================================================
  requestChat(messages, onDone, onFail) {
    const data = {
      model: CONFIG.model,
      messages: messages,
      temperature: CONFIG.temperature,
      stream: false
    };
    // 白名单访问代码随请求一起发（识别放在请求体里，不额外加请求头）；
    // 没通过验证就不带，由接口拒绝（401）并返回说明。
    if (this.accessCode) data.access_code = this.accessCode;

    wx.request({
      url: CONFIG.baseUrl + '/chat/completions',
      method: 'POST',
      timeout: 60000,
      header: { 'Content-Type': 'application/json' },
      data: data,
      success: (res) => {
        if (res.statusCode !== 200) {
          // 把状态码一并交给上层，便于区分「白名单拒绝」与其它错误
          onFail(this.apiError(res.data, res.statusCode), res.statusCode);
          return;
        }

        const body = res.data || {};
        const msg = body.choices && body.choices[0] && body.choices[0].message;
        if (!msg) {
          onFail('返回格式异常，未找到 choices[0].message', 0);
          return;
        }
        onDone(msg.content || '', msg.reasoning_content || '');
      },
      fail: (err) => {
        onFail((err && err.errMsg) ? err.errMsg : '网络请求失败', 0);
      }
    });
  },

  // ================================================================
  //  5. 发送流程
  // ================================================================
  onInputChange(e) {
    this.setData({ inputValue: e.detail.value });
  },

  onSendTap() {
    if (!this.data.started) {
      // 首次开始：点击「开始」按钮发送固定的首条指令
      this.start();
      return;
    }
    this.send(this.data.inputValue, false);
  },

  // 首次开始：清空会话后，发送固定的首条指令「Start ICAO test.」
  start() {
    if (this.data.started || this.data.generating) return;
    this.history = [];
    this.setData({ messages: [], started: true, chatTip: '', inputValue: '' });
    this.syncSendState();
    this.send('Start ICAO test.', true);
  },

  onStopTap() {
    // 非流式请求无法中途中断，这里只停止打字机动画并保留已到达的文本
    this.stopTypingKeepText();
  },

  send(text, isFirst) {
    // 白名单由接口强制校验，这里不做前置拦截：
    // 未验证也能发送，接口会拒绝并在下方把说明显示出来。
    const content = String(text || '').trim();
    if (!content) return;

    if (!CONFIG.model) {
      this.pushBubble('system', '尚未配置模型名称，请在 RadiotelephonyAI.js 顶部的 CONFIG.model 中填写。');
      return;
    }
    if (this.data.generating) return;

    if (isFirst) {
      // 不发 system：该模型未经 system 角色训练，加 system 会让首条指令失效、输出跑偏
      this.history = [];
      this.setData({ messages: [], started: true, chatTip: '' });
    }

    this.pushBubble('user', content);
    this.history.push({ role: 'user', content: content });
    this.setData({ inputValue: '', generating: true });
    this.syncSendState();

    // 先放一个空气泡并显示转圈，等模型返回后逐字打出
    const aiIndex = this.pushBubble('assistant', '', '', true);

    this.requestChat(
      this.history,
      (answer, reason) => {
        const text = answer || '(无返回内容)';
        this.history.push({ role: 'assistant', content: answer || '' });
        // 内容已到，撤掉转圈再开始打字
        this.updateBubble(aiIndex, { pending: false });
        this.typeOut(aiIndex, text, reason);
      },
      (errMsg, status) => {
        // 失败时移除空气泡，并撤销最后一条 user 消息，便于重试
        const messages = this.data.messages.slice(0, aiIndex);
        this.history.pop();
        this.setData({ messages: messages, generating: false });
        if (isFirst) {
          // 首条指令失败后复位回未开始状态，按钮可直接重试
          this.setData({ started: false });
        }
        this.syncSendState();

        let tip = '请检查模型名称、Base URL，或该接口是否允许小程序域名调用（需在微信后台配置 request 合法域名）。';
        if (status === 401 || status === 503) {
          // 接口按白名单拒绝：同步页面的验证状态，并说清怎么处理
          const noCode = status === 401;
          this.clearAuth();
          this.renderAuth(noCode
            ? '未验证：接口已拒绝返回结果，请在上方输入有效的访问代码'
            : '接口未配置白名单，请联系管理员', noCode);
          tip = noCode
            ? '接口拒绝：请在上方「访问代码」处填入管理员发放的代码并点「验证」，通过后再发送。'
            : '接口拒绝：服务端白名单文件（whitelist.txt）不存在或没有任何代码，请联系管理员。';
        }

        this.pushBubble('system', '请求失败：' + errMsg + '\n' + tip);
      }
    );
  },

  /** 打字机效果：逐字显示模型返回内容 */
  typeOut(index, fullText, reason) {
    this.clearTypeTimer();

    if (reason) {
      this.updateBubble(index, { reason: reason });
    }

    let pos = 0;
    const step = () => {
      pos = Math.min(pos + TYPE_STEP, fullText.length);
      this.updateBubble(index, { text: fullText.slice(0, pos), typing: pos < fullText.length });
      if (pos >= fullText.length) {
        this.clearTypeTimer();
        this.setData({ generating: false });
        this.syncSendState();
        return;
      }
      this.scrollToBottom();
    };

    this.typeTimer = setInterval(step, TYPE_INTERVAL);
    step();
  },

  /** 停止：生成中显示的内容立即定格（非流式请求无法中断，故只停前端动画） */
  stopTypingKeepText() {
    if (!this.data.generating) return;

    this.clearTypeTimer();
    const last = this.data.messages.length - 1;
    if (last >= 0) {
      const msg = this.data.messages[last];
      // 等待中的转圈也要一并撤掉，否则会一直转
      if (msg.typing || msg.pending) {
        const patch = {};
        if (msg.typing) patch.typing = false;
        if (msg.pending) patch.pending = false;
        this.updateBubble(last, patch);
      }
    }
    this.setData({ generating: false });
    this.syncSendState();
    wx.showToast({ title: '已停止显示', icon: 'none' });
  },

  clearTypeTimer() {
    if (this.typeTimer) {
      clearInterval(this.typeTimer);
      this.typeTimer = null;
    }
  },

  // ================================================================
  //  6. 重置会话
  // ================================================================
  /** 清空当前会话，回到「未开始」状态 */
  resetConversation() {
    this.clearTypeTimer();
    this.history = [];
    this.setData({
      started: false,
      messages: [],
      inputValue: '',
      generating: false,
      chatTip: '首次使用请点击下方「开始」按钮发送首条指令，即可开始对话。',
      scrollIntoView: ''
    });
    this.syncSendState();
  },

  // ================================================================
  //  7. 其它
  // ================================================================
  onCopyModelLink() {
    wx.setClipboardData({
      data: this.data.modelUrl,
      success: () => {
        wx.showToast({ title: '模型链接已复制，请在浏览器中打开', icon: 'none', duration: 2500 });
      }
    });
  },

  noop() {},

  // ---------- 分享功能 ----------
  // 分享给朋友
  onShareAppMessage() {
    return {
      title: '云塔智联 · PEPEC 陆空通话情景训练',
      path: '/pages/RadiotelephonyAI/RadiotelephonyAI'
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '云塔智联 · PEPEC 陆空通话情景训练',
      query: ''
    };
  }
});
