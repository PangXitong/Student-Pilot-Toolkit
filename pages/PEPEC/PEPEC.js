// PEPEC.js - ICAO英语音频练习页面

// ================================================================
// JSZip 引入（依赖 utils/jszip.min.js）
// ================================================================
var JSZip = require('../../utils/jszip-wrapper.js');


// ================================================================
// 页面逻辑
// ================================================================
Page({
  data: {
    audioList: [],
    currentIndex: -1,
    currentFileName: '暂无文件',
    isPlaying: false,
    progress: 0,
    currentTime: 0,
    duration: 0,
    currentTimeText: '00:00',
    durationText: '00:00',
    playMode: 'sequence',
    autoPlayNext: false,
    playModeText: '顺序练习',
    showInputModal: false,
    // studentIdInput: '',
    playbackRate: 1.0,
    showSpeedPicker: false,
    speedIndex: 3,
    speedOptions: [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0],
    isCurrentFavorite: false,
  },

  audioContext: null,

  onLoad() {
    this.audioContext = wx.createInnerAudioContext();
    this.audioContext.autoplay = false;
    this.audioContext.playbackRate = 1.0;
    // iOS需要设置这些属性
    this.audioContext.obeyMuteSwitch = false; // 忽略静音开关
    this.audioContext.volume = 1.0; // 设置最大音量
    
    // 加载本地存储的文件列表
    this.loadAudioList();
    
    this.audioContext.onEnded(() => {
      if (this.data.autoPlayNext) {
        this.playNext();
      } else {
        this.setData({ isPlaying: false, progress: 100 });
      }
    });
    this.audioContext.onTimeUpdate(() => {
      const ct = this.audioContext.currentTime;
      const dur = this.audioContext.duration;
      if (dur > 0) {
        this.setData({ 
          currentTime: ct, 
          duration: dur, 
          progress: (ct / dur) * 100,
          currentTimeText: this._formatTime(ct),
          durationText: this._formatTime(dur)
        });
      }
    });
    this.audioContext.onError((e) => {
      console.error('音频错误', e);
      this.setData({ isPlaying: false });
    });
    this.audioContext.onPlay(() => {
      console.log('音频开始播放');
      this.setData({ isPlaying: true });
    });
    this.audioContext.onPause(() => {
      console.log('音频暂停');
      this.setData({ isPlaying: false });
    });
    this.audioContext.onWaiting(() => {
      console.log('音频加载中...');
    });
    this.audioContext.onCanplay(() => {
      console.log('音频可以播放了');
    });
  },

  onUnload() {
    if (this.audioContext) {
      this.audioContext.stop();
      this.audioContext.destroy();
    }
  },

  // ---------- 导入 ZIP ----------
  onChooseFromChat() {
    wx.chooseMessageFile({
      count: 100,
      type: 'file',
      extension: ['mp3'],
      success: (res) => {
        console.log('选择的文件:', res.tempFiles);
        this._processMp3Files(res.tempFiles);
      },
      fail: (err) => {
        console.error('选择文件失败:', err);
        if (err.errMsg && !err.errMsg.includes('cancel')) {
          wx.showToast({ title: '选择失败，请重试', icon: 'none' });
        }
      },
    });
  },

  _processMp3Files(files) {
    if (!files || files.length === 0) {
      wx.showToast({ title: '未选择文件', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '正在导入…' });

    const fs = wx.getFileSystemManager();
    const newFiles = [];
    let processedCount = 0;
    const userDataPath = wx.env.USER_DATA_PATH;

    files.forEach((file, index) => {
      const filePath = file.tempFilePath || file.path;
      const fileName = file.name || filePath.split('/').pop();
      
      // 生成唯一的临时文件路径
      const uniqueFileName = `audio_${Date.now()}_${index}_${fileName}`;
      const targetPath = `${userDataPath}/${uniqueFileName}`;

      // 直接使用原始临时文件路径，不复制
      // 微信小程序的临时文件可以直接用于播放
      processedCount++;
      newFiles.push({
        name: fileName,
        audioSrc: filePath  // 使用原始临时文件路径
      });

      if (processedCount === files.length) {
        this._finishImport(newFiles);
      }
    });
  },

  _finishImport(newFiles) {
    wx.hideLoading();

    if (newFiles.length === 0) {
      wx.showToast({ title: '没有成功导入的文件', icon: 'none', duration: 3000 });
      return;
    }

    // 对新文件进行排序
    newFiles.sort((a, b) => {
      const nameA = a.name.replace(/\.[^.]+$/, ''); // 去掉扩展名
      const nameB = b.name.replace(/\.[^.]+$/, ''); // 去掉扩展名
      return nameA.localeCompare(nameB, 'zh-CN', { numeric: true });
    });
    
    const existingNames = new Set(this.data.audioList.map(x => x.name));
    const uniqueNewFiles = newFiles.filter(f => !existingNames.has(f.name));
    
    // 合并并排序
    const merged = [...this.data.audioList, ...uniqueNewFiles];
    merged.sort((a, b) => {
      const nameA = a.name.replace(/\.[^.]+$/, ''); // 去掉扩展名
      const nameB = b.name.replace(/\.[^.]+$/, ''); // 去掉扩展名
      return nameA.localeCompare(nameB, 'zh-CN', { numeric: true });
    });

    this.setData({ audioList: merged });
    wx.showToast({ title: `导入成功，共${merged.length}个文件`, icon: 'success' });

    if (this.data.currentIndex === -1 && merged.length > 0) {
      this.playFileByIndex(0);
    }
    
    // 保存到本地存储
    this.saveAudioList();
  },

  // 保存音频列表到本地存储
  saveAudioList() {
    try {
      wx.setStorageSync('PEPEC_audioList', this.data.audioList);
    } catch (e) {
      console.error('保存音频列表失败', e);
    }
  },

  // 从本地存储加载音频列表
  loadAudioList() {
    try {
      const audioList = wx.getStorageSync('PEPEC_audioList');
      if (audioList && Array.isArray(audioList)) {
        this.setData({ audioList });
      }
    } catch (e) {
      console.error('加载音频列表失败', e);
    }
  },

  _strToBase64(str) {
    const b64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let result = '';
    let i = 0;
    const len = str.length;
    while (i < len) {
      const b1 = str.charCodeAt(i++) & 0xff;
      const b2 = i < len ? str.charCodeAt(i++) & 0xff : 0;
      const b3 = i < len ? str.charCodeAt(i++) & 0xff : 0;
      result += b64chars[b1 >> 2];
      result += b64chars[((b1 & 3) << 4) | (b2 >> 4)];
      result += i - 1 < len ? b64chars[((b2 & 15) << 2) | (b3 >> 6)] : '=';
      result += i < len ? b64chars[b3 & 63] : '=';
    }
    return result;
  },

  // ---------- 播放控制 ----------
  playFileByIndex(index) {
    const list = this.data.audioList;
    if (index < 0 || index >= list.length) return;
    const file = list[index];
    
    console.log('准备播放文件:', file.name, '路径:', file.audioSrc);
    
    // 先停止当前播放
    try {
      this.audioContext.stop();
    } catch (e) {
      console.log('停止音频失败:', e);
    }
    
    // 设置新的音频源
    this.audioContext.src = file.audioSrc;
    
    // 延迟一点再播放，确保iOS能正确加载
    setTimeout(() => {
      console.log('开始播放...');
      try {
        this.audioContext.play();
      } catch (e) {
        console.error('播放音频失败:', e);
      }
    }, 100);
    
    this.setData({
      currentIndex: index, currentFileName: file.name,
      isPlaying: true, progress: 0, currentTime: 0, duration: 0,
      currentTimeText: '00:00', durationText: '00:00',
      isCurrentFavorite: file.isFavorite || false,
    });
  },

  // ---------- 收藏功能 ----------
  onToggleFavorite() {
    if (this.data.currentIndex === -1 || this.data.audioList.length === 0) {
      wx.showToast({ title: '请先选择一个文件', icon: 'none' });
      return;
    }
    
    const index = this.data.currentIndex;
    const audioList = [...this.data.audioList];
    audioList[index] = {
      ...audioList[index],
      isFavorite: !audioList[index].isFavorite
    };
    
    this.setData({
      audioList: audioList,
      isCurrentFavorite: audioList[index].isFavorite
    });
    
    this.saveAudioList();
    
    wx.showToast({
      title: audioList[index].isFavorite ? '已收藏' : '已取消收藏',
      icon: 'success'
    });
  },

  onPlayPause() {
    if (!this.data.audioList.length) { wx.showToast({ title: '请先导入音频', icon: 'none' }); return; }
    if (this.data.currentIndex === -1) { this.playFileByIndex(0); return; }
    if (this.data.isPlaying) {
      this.audioContext.pause();
    } else {
      const task = this.audioContext.play();
      if (task && task.catch) task.catch(() => this.setData({ isPlaying: false }));
    }
  },

  onPrev() {
    if (!this.data.audioList.length) return;
    const next = this.data.playMode === 'random'
      ? Math.floor(Math.random() * this.data.audioList.length)
      : (this.data.currentIndex - 1 + this.data.audioList.length) % this.data.audioList.length;
    this.playFileByIndex(next);
  },

  playNext() {
    if (!this.data.audioList.length) return;
    const next = this.data.playMode === 'random'
      ? Math.floor(Math.random() * this.data.audioList.length)
      : (this.data.currentIndex + 1) % this.data.audioList.length;
    this.playFileByIndex(next);
  },

  onNext() { this.playNext(); },
  onFileItemTap(e) { this.playFileByIndex(e.currentTarget.dataset.index); },

  // ---------- 练习模式 ----------
  onToggleMode() {
    const m = this.data.playMode === 'sequence' ? 'random' : 'sequence';
    this.setData({ playMode: m, playModeText: m === 'sequence' ? '顺序练习' : '随机练习' });
  },
  onToggleAutoPlay() { this.setData({ autoPlayNext: !this.data.autoPlayNext }); },

  // ---------- 进度 ----------
  onProgressChange(e) {
    if (!this.data.audioList.length || !this.data.duration) return;
    this.audioContext.seek((e.detail.value / 100) * this.data.duration);
  },

  // ---------- 清空 ----------
  onClearAll() {
    if (!this.data.audioList.length) return;
    wx.showModal({
      title: '确认清空', content: '确定要清空所有文件吗？',
      success: (res) => {
        if (!res.confirm) return;
        this.audioContext.stop();
        this.setData({ audioList: [], currentIndex: -1, currentFileName: '暂无文件', isPlaying: false, progress: 0, currentTime: 0, duration: 0, currentTimeText: '00:00', durationText: '00:00' });
        // 清除本地存储
        try {
          wx.removeStorageSync('PEPEC_audioList');
        } catch (e) {
          console.error('清除本地存储失败', e);
        }
      },
    });
  },

  // ---------- 工具 ----------
  _formatTime(s) {
    if (!s || isNaN(s)) return '00:00';
    const m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  },

  // ---------- 分享功能 ----------
  onShareAppMessage() {
    return {
      title: 'ICAO英语音频练习工具',
      path: '/pages/PEPEC/PEPEC',
      imageUrl: '',
    };
  },

  onShareTimeline() {
    return {
      title: 'ICAO英语音频练习工具',
      query: '',
      imageUrl: '',
    };
  },

  // 从线上导入全部文件
  onImportOnline() {
    this.setData({ showInputModal: true });
  },

  onCloseModal() {
    this.setData({ showInputModal: false });
  },

  // onStudentIdInput(e) {
  //   this.setData({ studentIdInput: e.detail.value });
  // },

  onModalTap(e) {
    if (e.currentTarget.dataset.index === 'overlay') {
      this.onCloseModal();
    }
  },

  onConfirmImport() {
    // 学号验证逻辑（已注释）
    // const studentId = this.data.studentIdInput.trim();
    // if (!studentId) {
    //   wx.showToast({ title: '请输入学号', icon: 'none' });
    //   return;
    // }
    // 
    // // 检查学号必须是9位数字
    // if (!/^\d{9}$/.test(studentId)) {
    //   wx.showToast({ title: '学号无效', icon: 'none' });
    //   return;
    // }
    // 
    // // 检查学号第三位到第五位是否为134或044
    // const checkCode = studentId.substring(2, 5);
    // if (checkCode !== '134' && checkCode !== '044') {
    //   wx.showToast({ title: '学号无效', icon: 'none' });
    //   return;
    // }
    
    this.onCloseModal();
    // 开始导入
    this._importOnlineFiles();
  },

  _importOnlineFiles() {
    wx.showLoading({ title: '正在获取文件列表...' });
    
    const baseUrl = 'https://icao.oldsai.cn';
    const fileListUrl = `${baseUrl}/files.json`;
    const newFiles = [];
    
    // 先获取文件列表
    wx.request({
      url: fileListUrl,
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.files) {
          const files = res.data.files;
          console.log('获取文件列表成功，共', files.length, '个文件');
          
          // 使用循环方式处理文件，避免递归导致栈溢出
          let index = 0;
          const processNext = () => {
            if (index >= files.length) {
              wx.hideLoading();
              if (newFiles.length === 0) {
                wx.showToast({ title: '未下载到任何文件', icon: 'none' });
              } else {
                wx.showToast({ title: `导入成功，共${newFiles.length}个文件`, icon: 'success' });
                this._finishImport(newFiles);
              }
              return;
            }
            
            const fileName = files[index];
            const fileUrl = `${baseUrl}/${fileName}`;
            
            // 直接使用网络 URL 播放，不下载到本地
            newFiles.push({ name: fileName, audioSrc: fileUrl });
            console.log(`添加文件: ${fileName}`);
            index++;
            
            // 使用 setTimeout 避免同步调用导致栈溢出
            setTimeout(processNext, 0);
          };
          
          processNext();
        } else {
          wx.hideLoading();
          wx.showToast({ title: '获取文件列表失败', icon: 'none' });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('获取文件列表失败', err);
        wx.showToast({ title: '获取文件列表失败', icon: 'none' });
      },
    });
  },

  // ---------- ZIP 文件导入 ----------
  onChooseZipFile() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['zip'],
      success: (res) => {
        console.log('选择的ZIP文件:', res.tempFiles);
        this._processZipFile(res.tempFiles[0]);
      },
      fail: (err) => {
        console.error('选择ZIP文件失败:', err);
        if (err.errMsg && !err.errMsg.includes('cancel')) {
          wx.showToast({ title: '选择失败，请重试', icon: 'none' });
        }
      },
    });
  },

  _processZipFile(file) {
    if (!JSZip || typeof JSZip.loadAsync !== 'function') {
      wx.hideLoading();
      console.error('[PEPEC] JSZip 未正确加载，当前 JSZip:', JSZip);
      wx.showToast({ title: 'JSZip加载失败，请在控制台查看日志', icon: 'none', duration: 5000 });
      return;
    }

    console.log('开始处理ZIP文件:', file);

    wx.showLoading({ title: '正在解压...' });

    const filePath = file.tempFilePath || file.path;
    const fs = wx.getFileSystemManager();

    fs.readFile({
      filePath: filePath,
      encoding: 'binary',
      success: async (res) => {
        console.log('读取ZIP文件成功');

        // 将 binary 字符串转为 Uint8Array
        const binary = res.data;
        const len = binary.length;
        const uint8Array = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          uint8Array[i] = binary.charCodeAt(i) & 0xff;
        }
        console.log('转换为 Uint8Array 成功，长度:', uint8Array.length);

        let zip;
        try {
          zip = await JSZip.loadAsync(uint8Array);
          console.log('JSZip.loadAsync 成功，文件列表:', Object.keys(zip.files));
        } catch (err) {
          console.error('JSZip.loadAsync 失败:', err);
          wx.hideLoading();
          wx.showToast({ title: 'ZIP解析失败: ' + (err.message || JSON.stringify(err)), icon: 'none', duration: 3000 });
          return;
        }

        const mp3Files = Object.values(zip.files).filter(
          (f) => !f.dir && f.name.replace(/\\/g, '/').toLowerCase().endsWith('.mp3')
        );

        console.log('找到的MP3文件:', mp3Files.map((f) => f.name));

        if (mp3Files.length === 0) {
          wx.hideLoading();
          wx.showToast({ title: 'ZIP中未找到MP3文件', icon: 'none', duration: 5000 });
          return;
        }

        const userDataPath = wx.env.USER_DATA_PATH;
        const newFiles = [];
        let completed = 0;
        let hasError = false;

        const checkDone = () => {
          if (completed === mp3Files.length) {
            wx.hideLoading();
            if (newFiles.length === 0) {
              wx.showToast({ title: '解压/写入失败', icon: 'none', duration: 3000 });
            } else {
              this._finishImport(newFiles);
            }
          }
        };

        for (let i = 0; i < mp3Files.length; i++) {
          const f = mp3Files[i];
          const fileName = f.name.replace(/\\/g, '/').split('/').pop();
          const safeName = fileName.replace(/[^a-zA-Z0-9_\u4e00-\u9fff.\-]/g, '_');
          const targetPath = `${userDataPath}/zip_audio_${Date.now()}_${i}_${safeName}`;

          try {
            const data = await f.async('uint8array');
            console.log('解压成功:', fileName, '大小:', data.length, '类型:', Object.prototype.toString.call(data));
            console.log('data.constructor.name:', data.constructor.name);
            console.log('data instanceof Uint8Array:', data instanceof Uint8Array);
            
            // 将 Uint8Array 转换为 ArrayBuffer
            const buffer = data.buffer;
            console.log('ArrayBuffer 大小:', buffer.byteLength);

            await new Promise((resolve, reject) => {
              fs.writeFile({
                filePath: targetPath,
                data: buffer,
                encoding: 'binary',
                success: () => {
                  console.log('写入成功:', targetPath);
                  newFiles.push({ name: fileName, audioSrc: targetPath });
                  completed++;
                  checkDone();
                  resolve();
                },
                fail: (err) => {
                  console.error('写入失败:', fileName, JSON.stringify(err));
                  hasError = true;
                  completed++;
                  checkDone();
                  reject(err);
                },
              });
            });
          } catch (err) {
            console.error('解压失败:', f.name, err);
            hasError = true;
            completed++;
            checkDone();
          }
        }
      },
      fail: (err) => {
        console.error('读取ZIP文件失败:', err);
        wx.hideLoading();
        wx.showToast({ title: '读取文件失败: ' + JSON.stringify(err), icon: 'none' });
      },
    });
  },

  // ---------- 倍速控制 ----------
  onToggleSpeedPicker() {
    if (!this.data.showSpeedPicker) {
      const currentIndex = this.data.speedOptions.indexOf(this.data.playbackRate);
      this.setData({ 
        showSpeedPicker: true, 
        speedIndex: currentIndex >= 0 ? currentIndex : 3 
      });
    } else {
      this.setData({ showSpeedPicker: false });
    }
  },

  onCloseSpeedPicker() {
    this.setData({ showSpeedPicker: false });
  },

  stopPropagation() {
    // 阻止事件冒泡
  },

  onSpeedPickerChange(e) {
    const index = e.detail.value[0];
    const rate = this.data.speedOptions[index];
    this.setData({ 
      playbackRate: rate, 
      speedIndex: index 
    });
    this.audioContext.playbackRate = rate;
  },
});
