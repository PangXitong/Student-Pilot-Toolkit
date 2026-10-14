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

// 训练阶段（顺序即训练流程顺序）
const PHASES = [
  'clearance', 'apron', 'taxi out', 'line up', 'take off', 'departure',
  'cruising', 'descend', 'approaching', 'landing', 'taxi back'
];

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

    // ---------- 训练模式 ----------
    mode: 'from',           // single | from | range
    picks: [],              // 按点击先后排序（初始为空，不替用户预选阶段）
    phases: PHASES,
    previewHtml: '',        // 句子预览（富文本，含高亮槽位）
    canStart: false,        // 首条指令是否可发送
    startTip: '',

    // ---------- 对话 ----------
    started: false,         // 首条消息是否已发送
    messages: [],           // 渲染用的气泡列表 { role, text, reason, typing }
    inputValue: '',
    generating: false,
    chatTip: '选择训练模式并发送首条指令，开始新的对话。',
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
    // 先用本机记住的访问代码恢复验证态，再静默复核
    this.restoreAuth();
    this.syncSendState();
    this.renderSetup();
  },

  onUnload() {
    this.clearTypeTimer();
  },

  onHide() {
    this.clearTypeTimer();
  },

  /**
   * 统一刷新「能否输入 / 能否发送」派生状态。
   * 首条指令、生成中任一变化都要重新计算，避免各处重复判断。
   */
  syncSendState() {
    const { started, generating } = this.data;
    const can = started && !generating;
    this.setData({
      canInput: can,
      canSend: can
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
  //  2. 训练模式 / 阶段选择
  // ================================================================
  slotsFor(mode) {
    return mode === 'range' ? 2 : 1;
  },

  onModeTap(e) {
    if (this.data.generating) return;
    const mode = e.currentTarget.dataset.mode;
    if (mode === this.data.mode) return;
    this.setData({ mode: mode, picks: [] });
    this.renderSetup();
  },

  onChipTap(e) {
    if (this.data.generating) return;
    const phase = e.currentTarget.dataset.phase;
    const picks = this.data.picks.slice();
    const i = picks.indexOf(phase);

    if (i >= 0) {
      picks.splice(i, 1);
    } else if (picks.length >= this.slotsFor(this.data.mode)) {
      return;
    } else {
      picks.push(phase);   // 先点的进前一个格子
    }

    this.setData({ picks: picks });
    this.renderSetup();
  },

  /** 当前模式下每个阶段的选中/禁用状态，供 WXML 渲染 chip 样式 */
  buildChips() {
    const picks = this.data.picks;
    const max = this.slotsFor(this.data.mode);
    return PHASES.map((p) => {
      const selected = picks.indexOf(p) >= 0;
      return {
        name: p,
        selected: selected,
        disabled: !selected && picks.length >= max
      };
    });
  },

  firstMessage() {
    const a = this.data.picks[0] || '';
    const b = this.data.picks[1] || '';
    if (this.data.mode === 'single') return 'Start training ' + a;
    if (this.data.mode === 'from') return 'Start training from ' + a;
    return 'Start training from ' + a + ' to ' + b;
  },

  /** 生成句子预览的富文本（槽位高亮） */
  renderPreview() {
    const mode = this.data.mode;
    const picks = this.data.picks;
    const slot = (i) => {
      const v = picks[i] || '';
      const label = v || (i === 0 ? '阶段一' : '阶段二');
      return '<span class="slot' + (v ? ' filled' : '') + '">' + label + '</span>';
    };

    let html;
    if (mode === 'single') html = 'Start training ' + slot(0);
    else if (mode === 'from') html = 'Start training from ' + slot(0);
    else html = 'Start training from ' + slot(0) + ' to ' + slot(1);

    this.setData({ previewHtml: html });
  },

  renderSetup() {
    const max = this.slotsFor(this.data.mode);
    const ready = this.data.picks.length === max;

    this.setData({
      chips: this.buildChips(),
      canStart: ready && !this.data.generating,
      startTip: ready ? '' : '请选择阶段（' + this.data.picks.length + '/' + max + '）'
    });
    this.renderPreview();
  },

  // ================================================================
  //  3. 对话渲染
  // ================================================================
  /** 追加一条气泡，返回其在 messages 中的索引 */
  pushBubble(role, text, reason) {
    const messages = this.data.messages.concat([{
      id: ++this.msgSeq,
      role: role,
      text: text || '',
      reason: reason || '',
      typing: false,
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
    this.send(this.data.inputValue, false);
  },

  onStartTap() {
    if (this.data.picks.length !== this.slotsFor(this.data.mode)) return;
    if (this.data.started) {
      // 训练已开始：改选模式/阶段即视为换一个情景重新开始，先清空当前会话
      this.resetConversation();
    }
    this.send(this.firstMessage(), true);
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

    // 先放一个空气泡，等模型返回后逐字打出
    const aiIndex = this.pushBubble('assistant', '');

    this.requestChat(
      this.history,
      (answer, reason) => {
        const text = answer || '(无返回内容)';
        this.history.push({ role: 'assistant', content: answer || '' });
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
        this.renderSetup();

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
        this.renderSetup();
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
    if (last >= 0 && this.data.messages[last].typing) {
      this.updateBubble(last, { typing: false });
    }
    this.setData({ generating: false });
    this.syncSendState();
    this.renderSetup();
    wx.showToast({ title: '已停止显示', icon: 'none' });
  },

  clearTypeTimer() {
    if (this.typeTimer) {
      clearInterval(this.typeTimer);
      this.typeTimer = null;
    }
  },

  // ================================================================
  //  6. 开始新对话
  // ================================================================
  newConversation() {
    this.resetConversation();
    wx.showToast({ title: '已开始新对话', icon: 'none' });
  },

  resetConversation() {
    this.clearTypeTimer();
    this.history = [];
    this.setData({
      started: false,
      messages: [],
      inputValue: '',
      generating: false,
      mode: 'from',
      picks: [],
      chatTip: '选择训练模式并发送首条指令，开始新的对话。',
      scrollIntoView: ''
    });
    this.syncSendState();
    this.renderSetup();
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

  onShareAppMessage() {
    return {
      title: '云塔智联 · PEPEC 陆空通话情景训练',
      path: '/pages/RadiotelephonyAI/RadiotelephonyAI'
    };
  },

  onShareTimeline() {
    return {
      title: '云塔智联 · PEPEC 陆空通话情景训练',
      query: ''
    };
  }
});
