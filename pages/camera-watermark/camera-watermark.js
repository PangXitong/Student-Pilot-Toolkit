// camera-watermark.js
Page({
  // 广告事件监听
  adLoad() {
    console.log('原生模板广告加载成功')
  },
  adError(err) {
    console.error('原生模板广告加载失败', err)
  },
  adClose() {
    console.log('原生模板广告关闭')
  },

  data: {
    photoPath: '',
    watermarkedPath: '',
    showTime: false,
    form: {
      classInfo: '',
      absent: '',
      present: '',
      remark: '',
      dorm: '',
      question: ''
    }
  },

  takePhoto() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera'],
      cameraMode: 'back',
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.setData({
          photoPath: tempFilePath,
          watermarkedPath: '',
          captureTime: this._formatTime(new Date())
        });
      },
      fail: (err) => {
        wx.showToast({ title: '请允许使用相机权限', icon: 'none' });
      }
    });
  },

  importPhoto() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.setData({
          photoPath: tempFilePath,
          watermarkedPath: '',
          captureTime: this._formatTime(new Date())
        });
      },
      fail: () => {
        wx.showToast({ title: '请允许访问相册权限', icon: 'none' });
      }
    });
  },

  // 格式化时间为 YYYY-MM-DD HH:mm
  _formatTime(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d} ${h}:${min}`;
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({
      ['form.' + field]: value
    });
  },

  onToggleTime() {
    this.setData({ showTime: !this.data.showTime });
  },

  generateWatermark() {
    if (!this.data.photoPath) {
      wx.showToast({ title: '请先拍照', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '生成中...' });

    wx.getImageInfo({
      src: this.data.photoPath,
      success: (imgInfo) => {
        const canvasWidth = imgInfo.width;
        const canvasHeight = imgInfo.height;

        const query = wx.createSelectorQuery();
        query.select('#watermark-canvas')
          .fields({ node: true, size: true })
          .exec((res) => {
            if (!res[0] || !res[0].node) {
              wx.hideLoading();
              wx.showToast({ title: '画布初始化失败', icon: 'none' });
              return;
            }

            const canvas = res[0].node;
            const ctx = canvas.getContext('2d');

            canvas.width = canvasWidth;
            canvas.height = canvasHeight;

            const bgImg = canvas.createImage();
            bgImg.onload = () => {
              ctx.drawImage(bgImg, 0, 0, canvasWidth, canvasHeight);

              // 绘制水印文字
              const { classInfo, absent, present, remark, dorm, question } = this.data.form;
              let text = '';
              if (classInfo) text += classInfo + '班';
              if (absent) text += ' 应到' + absent + '人';
              if (present) text += ' 实到' + present + '人';
              if (remark) text += ' ' + remark;
              if (dorm) text += ' ' + dorm;
              if (question) text += ' ' + question;

              // 有水印内容才绘制
              if (text || this.data.showTime) {
                const baseSize = Math.min(canvasWidth, canvasHeight);

                // 左上角拍摄时间
                if (this.data.showTime && this.data.captureTime) {
                  const timeFontSize = Math.max(32, Math.floor(baseSize * 0.04));
                  ctx.font = `bold ${timeFontSize}px sans-serif`;
                  ctx.fillStyle = '#ffffff';
                  ctx.textAlign = 'left';
                  ctx.textBaseline = 'top';
                  const timePadding = Math.floor(baseSize * 0.03);
                  ctx.fillText(this.data.captureTime, timePadding, timePadding);
                }

                // 中间水印文字
                if (text) {
                  const fontSize = Math.max(60, Math.floor(baseSize * 0.10));
                  const lineHeight = Math.floor(fontSize * 1.5);

                  ctx.font = `bold ${fontSize}px sans-serif`;
                  ctx.fillStyle = '#ffffff';
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';

                  // 换行处理
                  const maxWidth = canvasWidth * 0.90;
                  const charWidth = fontSize * 0.65;
                  const charsPerLine = Math.max(1, Math.floor(maxWidth / charWidth));

                  const lines = [];
                  let remaining = text;
                  while (remaining.length > charsPerLine) {
                    lines.push(remaining.substring(0, charsPerLine));
                    remaining = remaining.substring(charsPerLine);
                  }
                  lines.push(remaining);

                  const totalH = lines.length * lineHeight;
                  const startY = canvasHeight / 2 - totalH / 2 + fontSize / 2;

                  lines.forEach((line, i) => {
                    ctx.fillText(line, canvasWidth / 2, startY + i * lineHeight);
                  });
                }
              }

              // 小程序 canvas 2d 必须用全局 API wx.canvasToTempFilePath
              wx.canvasToTempFilePath({
                canvas,
                fileType: 'jpg',
                quality: 0.9,
                success: (res2) => {
                  this.setData({ watermarkedPath: res2.tempFilePath });
                  wx.hideLoading();
                },
                fail: () => {
                  wx.hideLoading();
                  wx.showToast({ title: '水印生成失败', icon: 'none' });
                }
              });
            };

            bgImg.onerror = () => {
              wx.hideLoading();
              wx.showToast({ title: '图片加载失败', icon: 'none' });
            };
            bgImg.src = this.data.photoPath;
          });
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '图片信息获取失败', icon: 'none' });
      }
    });
  },

  resetAll() {
    this.setData({
      watermarkedPath: ''
    });
  },

  clearForm() {
    this.setData({
      showTime: false,
      form: {
        classInfo: '',
        absent: '',
        present: '',
        remark: '',
        dorm: '',
        question: ''
      }
    });
  },

  saveToAlbum() {
    if (!this.data.watermarkedPath) {
      wx.showToast({ title: '请先生成水印', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '保存中...' });

    wx.saveImageToPhotosAlbum({
      filePath: this.data.watermarkedPath,
      success: () => {
        wx.hideLoading();
        wx.showToast({ title: '已保存到相册', icon: 'success' });
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '保存失败，请检查权限', icon: 'none' });
      }
    });
  }
});