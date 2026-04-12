// bmr-calculator.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    gender: 'male', // 默认性别为男性
    weight: '', // 体重(kg)
    height: '', // 身高(cm)
    age: '', // 年龄(周岁)
    bmrValue: '', // 基础代谢率值
    bmrDescription: '', // 基础代谢率描述
    showResult: false // 是否显示结果
  },

  /**
   * 性别选择
   */
  onGenderSelect(e) {
    this.setData({
      gender: e.currentTarget.dataset.gender
    });
  },

  /**
   * 体重输入
   */
  onWeightInput(e) {
    this.setData({
      weight: e.detail.value
    });
  },

  /**
   * 身高输入
   */
  onHeightInput(e) {
    this.setData({
      height: e.detail.value
    });
  },

  /**
   * 年龄输入
   */
  onAgeInput(e) {
    this.setData({
      age: e.detail.value
    });
  },

  /**
   * 计算基础代谢率
   */
  calculateBMR() {
    const { gender, weight, height, age } = this.data;

    // 验证输入
    if (!weight || !height || !age) {
      wx.showToast({
        title: '请输入完整信息',
        icon: 'none'
      });
      return;
    }

    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height);
    const ageNum = parseInt(age);

    // 验证输入值的有效性
    if (isNaN(weightNum) || isNaN(heightNum) || isNaN(ageNum)) {
      wx.showToast({
        title: '请输入有效的数值',
        icon: 'none'
      });
      return;
    }

    if (weightNum <= 0 || heightNum <= 0 || ageNum <= 0) {
      wx.showToast({
        title: '请输入大于0的数值',
        icon: 'none'
      });
      return;
    }

    // 使用Mifhin-StJeor公式计算基础代谢率
    let bmr = 0;
    if (gender === 'male') {
      // 男性：BMR=10*体重（kg）+6.25*身高（cm）-5* 年龄（周岁）+5
      bmr = 10 * weightNum + 6.25 * heightNum - 5 * ageNum + 5;
    } else {
      // 女性：BMR=10*体重（kg）+6.25*身高（cm）-5* 年龄（周岁）-161
      bmr = 10 * weightNum + 6.25 * heightNum - 5 * ageNum - 161;
    }

    // 计算结果保留一位小数
    const bmrRounded = bmr.toFixed(1);

    // 生成基础代谢率描述
    let description = '';
    if (gender === 'male') {
      if (bmr < 1200) {
        description = '您的基础代谢率较低，可能需要适当增加运动量和饮食营养。';
      } else if (bmr < 1800) {
        description = '您的基础代谢率处于正常范围。';
      } else {
        description = '您的基础代谢率较高，需要注意保持充足的营养摄入。';
      }
    } else {
      if (bmr < 1000) {
        description = '您的基础代谢率较低，可能需要适当增加运动量和饮食营养。';
      } else if (bmr < 1600) {
        description = '您的基础代谢率处于正常范围。';
      } else {
        description = '您的基础代谢率较高，需要注意保持充足的营养摄入。';
      }
    }

    this.setData({
      bmrValue: bmrRounded,
      bmrDescription: description,
      showResult: true
    });
  },

  /**
   * 返回首页
   */
  goBack() {
    wx.navigateBack({
      delta: 1
    });
  },

  // 分享给朋友
  onShareAppMessage() {
    return {
      title: '基础代谢率计算器',
      path: '/pages/bmr-calculator/bmr-calculator'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '基础代谢率计算器',
      path: '/pages/bmr-calculator/bmr-calculator',
      imageUrl: ''
    }
  }
});