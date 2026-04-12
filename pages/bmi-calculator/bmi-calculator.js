// bmi-calculator.js
Page({
  data: {
    height: '', // 身高(cm)
    weight: '', // 体重(kg)
    remark: '', // 备注
    bmiValue: '', // BMI值
    bmiCategory: '', // BMI分类
    bmiDescription: '', // BMI描述
    showResult: false, // 是否显示结果
    history: [] // 历史记录
  },

  onLoad() {
    this.loadHistory();
  },

  /**
   * 身高输入事件处理
   */
  onHeightInput(e) {
    this.setData({
      height: e.detail.value
    })
  },

  /**
   * 体重输入事件处理
   */
  onWeightInput(e) {
    this.setData({
      weight: e.detail.value
    })
  },

  /**
   * 备注输入事件处理
   */
  onRemarkInput(e) {
    this.setData({
      remark: e.detail.value
    })
  },

  /**
   * 计算BMI
   */
  calculateBMI() {
    const { height, weight } = this.data
    
    // 验证输入
    if (!height || !weight) {
      wx.showToast({
        title: '请输入身高和体重',
        icon: 'none'
      })
      return
    }
    
    if (height <= 0 || weight <= 0) {
      wx.showToast({
        title: '请输入有效的身高和体重',
        icon: 'none'
      })
      return
    }
    
    // 计算BMI值（公式：体重kg / (身高m)^2）
    const heightInMeters = height / 100
    const bmi = weight / (heightInMeters * heightInMeters)
    const bmiRounded = bmi.toFixed(1)
    
    // 确定BMI分类和描述
    let category, description
    if (bmi < 18.5) {
      category = '体重过轻'
      description = '您的体重低于正常范围，建议适当增加营养摄入，保持健康饮食。'
    } else if (bmi >= 18.5 && bmi < 24) {
      category = '体重正常'
      description = '您的体重在正常范围内，继续保持健康的生活方式和饮食习惯。'
    } else if (bmi >= 24 && bmi < 28) {
      category = '超重'
      description = '您的体重略高于正常范围，建议适当控制饮食，增加运动量。'
    } else {
      category = '肥胖'
      description = '您的体重明显高于正常范围，建议咨询医生或营养师，制定合理的减重计划。'
    }
    
    // 更新数据
    this.setData({
      bmiValue: bmiRounded,
      bmiCategory: category,
      bmiDescription: description,
      showResult: true
    })

    // 保存到历史记录
    this.saveToHistory(height, weight, bmiRounded, category, this.data.remark);
  },

  /**
   * 保存到历史记录
   */
  saveToHistory(height, weight, bmi, category, remark) {
    const now = new Date();
    const record = {
      id: Date.now(),
      time: this.formatTime(now),
      height: height,
      weight: weight,
      bmi: bmi,
      category: category,
      remark: remark || ''
    };

    const history = this.data.history;
    history.unshift(record);
    
    // 最多保存50条记录
    if (history.length > 50) {
      history.pop();
    }

    this.setData({ history });
    this.saveHistoryToStorage();
  },

  /**
   * 加载历史记录
   */
  loadHistory() {
    try {
      const history = wx.getStorageSync('bmi_history') || [];
      this.setData({ history });
    } catch (e) {
      console.error('加载历史记录失败', e);
    }
  },

  /**
   * 保存历史记录到本地存储
   */
  saveHistoryToStorage() {
    try {
      wx.setStorageSync('bmi_history', this.data.history);
    } catch (e) {
      console.error('保存历史记录失败', e);
    }
  },

  /**
   * 删除单条历史记录
   */
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

  /**
   * 清空所有历史记录
   */
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

  /**
   * 格式化时间
   */
  formatTime(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  },

  /**
   * 返回首页
   */
  goBack() {
    wx.navigateBack({
      delta: 1
    })
  },

  // 分享给朋友
  onShareAppMessage() {
    return {
      title: '体质指数BMI计算器',
      path: '/pages/bmi-calculator/bmi-calculator'
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '体质指数BMI计算器',
      query: '',
      imageUrl: ''
    };
  }
})
