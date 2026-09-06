Page({
  data: {
    activeTab: 0,
    searchValue: '',
    allTools: [
      { id: 'pepec', name: 'ICAO英语练习', image: '../images/ICAO.png', url: '../PEPEC/PEPEC', isLink: false },
      { id: 'e6b-exercise', name: '领航计算尺练习题', image: '../images/e6b.jpg', url: '../e6b-calculator/e6b-calculator', isLink: false },
      { id: 'e6b-calculator', name: 'E6B领航计算器', image: '../images/e6b.jpg', url: '../e6b-flight-computer/e6b-flight-computer', isLink: false },
      { id: 'e6b-link', name: 'E6B领航计算尺链接', image: '../images/e6b.jpg', url: 'https://mediafiles.aero.und.edu/aero.und.edu/aviation/trainers/e6b/', isLink: true },
      { id: 'flight-student', name: '学员训练时间计算器', image: '../images/FLT.png', url: '../flight-time-calculator/flight-time-calculator', isLink: false },
      { id: 'camera-watermark', name: '查人报班水印相机', image: '../images/camera.png', url: '../camera-watermark/camera-watermark', isLink: false },
      { id: 'flight-teacher', name: '教员训练时间计算器', image: '../images/FLT.png', url: '../flight-time-calculator-teacher/flight-time-calculator-teacher', isLink: false },
      { id: 'bmi', name: 'BMI计算器', image: '../images/BMI.png', url: '../bmi-calculator/bmi-calculator', isLink: false },
      { id: 'bmr', name: 'BMR计算器', image: '../images/BMR.png', url: '../bmr-calculator/bmr-calculator', isLink: false },
      { id: 'heart-rate', name: '心率计算器', image: '../images/HR.png', url: '../heart-rate-calculator/heart-rate-calculator', isLink: false },
      { id: 'unit-converter', name: '单位换算器', image: '../images/unit-converter.png', url: '../unit-converter/unit-converter', isLink: false },
      { id: 'time-calculator', name: '时间计算器', image: '../images/time.png', url: '../time-calculator/time-calculator', isLink: false },
      { id: 'download-calculator', name: '下载计算器', image: '../images/random.png', url: '../download-calculator/download-calculator', isLink: false },
      { id: 'random-number', name: '随机数生成器', image: '../images/random.png', url: '../random-number/random-number', isLink: false }
    ],
    filteredTools: [],
    theoryTools: [],
    schoolTools: [],
    utilityTools: [],
    calculatorTools: []
  },

  onLoad() {
    this.initTools();
  },

  initTools() {
    const allTools = this.data.allTools;
    this.setData({
      theoryTools: allTools.filter(t => ['pepec', 'e6b-exercise', 'e6b-calculator', 'e6b-link'].includes(t.id)),
      schoolTools: allTools.filter(t => ['flight-student', 'camera-watermark', 'flight-teacher'].includes(t.id)),
      utilityTools: allTools.filter(t => ['bmi', 'bmr', 'heart-rate'].includes(t.id)),
      calculatorTools: allTools.filter(t => ['unit-converter', 'time-calculator', 'download-calculator', 'random-number'].includes(t.id)),
      filteredTools: allTools
    });
  },

  switchTab(e) {
    const index = parseInt(e.currentTarget.dataset.index);
    this.setData({ activeTab: index });
  },

  onSearchInput(e) {
    const value = e.detail.value;
    this.setData({ searchValue: value });
    this.filterTools(value);
  },

  filterTools(keyword) {
    if (!keyword) {
      this.setData({ filteredTools: this.data.allTools });
      return;
    }
    const filtered = this.data.allTools.filter(tool => 
      tool.name.includes(keyword)
    );
    this.setData({ filteredTools: filtered });
  },

  openTool(e) {
    const tool = e.currentTarget.dataset.tool;
    if (tool.isLink) {
      wx.setClipboardData({
        data: tool.url,
        success: () => {
          wx.showToast({ title: '已复制链接，请在浏览器中打开', icon: 'none' });
        }
      });
    } else {
      wx.navigateTo({ url: tool.url });
    }
  },

  openLink(e) {
    const url = e.currentTarget.dataset.url;
    if (url.startsWith('../')) {
      wx.navigateTo({ url: url });
    } else {
      wx.setClipboardData({
        data: url,
        success: () => {
          wx.showToast({ title: '已复制链接，请在浏览器中打开', icon: 'none' });
        }
      });
    }
  },

  copyBeianLink() {
    const beianLink = 'https://beian.miit.gov.cn/#/home';
    wx.setClipboardData({
      data: beianLink,
      success: () => {
        wx.showToast({ title: '工信部校验链接已复制，在浏览器打开链接。', icon: 'none', duration: 3000 });
      }
    });
  },

  openMP() {
    wx.showModal({
      title: '关注公众号',
      content: '请在微信中搜索公众号"六里路"并关注',
      showCancel: false,
      confirmText: '好的',
      success: (res) => {
        if (res.confirm) {
          console.log('用户点击确定');
        }
      }
    });
  },

  onShareAppMessage() {
    return {
      title: '飞行学员工具箱',
      path: '/pages/index/index',
      imageUrl: '/pages/index/images/ICAO.png'
    };
  },

  onShareTimeline() {
    return {
      title: '飞行学员工具箱',
      query: '',
      imageUrl: '/pages/index/images/ICAO.png'
    };
  },

  adLoad() {
    console.log('原生模板广告加载成功')
  },

  adError(err) {
    console.error('原生模板广告加载失败', err)
  },

  adClose() {
    console.log('原生模板广告关闭')
  }
});
  