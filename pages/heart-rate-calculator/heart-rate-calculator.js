Page({
  data: {
    age: '',
    maxHeartRate: '',
    heartRateZones: [],
    showResult: false,
    history: []
  },

  onLoad() {
    this.loadHistory();
  },

  onAgeInput(e) {
    this.setData({
      age: e.detail.value
    });
  },

  calculateHeartRate() {
    const { age } = this.data;

    if (!age) {
      wx.showToast({
        title: '请输入年龄',
        icon: 'none'
      });
      return;
    }

    if (age <= 0 || age > 120) {
      wx.showToast({
        title: '请输入有效的年龄',
        icon: 'none'
      });
      return;
    }

    const maxHR = 220 - parseInt(age);

    const zones = [
      {
        name: '恢复/放松',
        min: Math.round(maxHR * 0.5),
        max: Math.round(maxHR * 0.6),
        color: '#52c41a',
        description: '非常轻松的运动强度，用于热身和恢复，促进血液循环和放松肌肉。'
      },
      {
        name: '燃烧脂肪',
        min: Math.round(maxHR * 0.6),
        max: Math.round(maxHR * 0.7),
        color: '#faad14',
        description: '中等强度，脂肪燃烧效率最高，适合长时间有氧运动，如慢跑、快走。'
      },
      {
        name: '有氧耐力',
        min: Math.round(maxHR * 0.7),
        max: Math.round(maxHR * 0.8),
        color: '#1890ff',
        description: '提高心肺功能和有氧耐力，增强心脏泵血能力，适合持续中等强度运动。'
      },
      {
        name: '无氧阈值',
        min: Math.round(maxHR * 0.8),
        max: Math.round(maxHR * 0.9),
        color: '#722ed1',
        description: '高强度训练，提高乳酸阈值，增强速度和耐力，适合间歇训练。'
      },
      {
        name: '极限强度',
        min: Math.round(maxHR * 0.9),
        max: maxHR,
        color: '#ff4d4f',
        description: '最大强度训练，提升爆发力和最大摄氧量，仅适合短时间间歇训练。'
      }
    ];

    this.setData({
      maxHeartRate: maxHR,
      heartRateZones: zones,
      showResult: true
    });

    this.saveToHistory(age, maxHR, zones);
  },

  saveToHistory(age, maxHR, zones) {
    const now = new Date();
    const record = {
      id: Date.now(),
      time: this.formatTime(now),
      age: age,
      maxHeartRate: maxHR,
      zones: zones
    };

    const history = this.data.history;
    history.unshift(record);

    if (history.length > 50) {
      history.pop();
    }

    this.setData({ history });
    this.saveHistoryToStorage();
  },

  loadHistory() {
    try {
      const history = wx.getStorageSync('heart_rate_history') || [];
      this.setData({ history });
    } catch (e) {
      console.error('加载历史记录失败', e);
    }
  },

  saveHistoryToStorage() {
    try {
      wx.setStorageSync('heart_rate_history', this.data.history);
    } catch (e) {
      console.error('保存历史记录失败', e);
    }
  },

  deleteHistoryItem(e) {
    const id = e.currentTarget.dataset.id;
    const history = this.data.history.filter(item => item.id !== id);
    this.setData({ history });
    this.saveHistoryToStorage();
    wx.showToast({
      title: '已删除',
      icon: 'success'
    });
  },

  clearAllHistory() {
    if (this.data.history.length === 0) {
      wx.showToast({
        title: '暂无历史记录',
        icon: 'none'
      });
      return;
    }

    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有历史记录吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({ history: [] });
          this.saveHistoryToStorage();
          wx.showToast({
            title: '已清空',
            icon: 'success'
          });
        }
      }
    });
  },

  formatTime(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  },

  goBack() {
    wx.navigateBack({
      delta: 1
    });
  },

  onShareAppMessage() {
    return {
      title: '心率计算器',
      path: '/pages/heart-rate-calculator/heart-rate-calculator'
    };
  },

  onShareTimeline() {
    return {
      title: '心率计算器',
      query: '',
      imageUrl: ''
    };
  }
})
