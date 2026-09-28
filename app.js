// app.js
App({
  globalData: {
    userInfo: null,
    isMember: false,
    memberExpireTime: 0
  },

  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })
    
    // 检查会员状态
    this.checkGlobalMemberStatus();
    
    // 引入JSZip库
    const JSZip = require('./utils/jszip-wrapper.js');
    if (typeof JSZip !== 'undefined') {
      global.JSZip = JSZip;
    }
    
    // polyfill setImmediate for JSZip (必须在引入JSZip之后)
    if (typeof setImmediate === 'undefined') {
      setImmediate = function(fn, ...args) {
        return setTimeout(() => fn(...args), 0);
      };
    }
  },

  checkGlobalMemberStatus() {
    try {
      const expireTime = wx.getStorageSync('memberExpireTime');
      if (expireTime && Date.now() < parseInt(expireTime)) {
        this.globalData.isMember = true;
        this.globalData.memberExpireTime = parseInt(expireTime);
      } else {
        this.globalData.isMember = false;
        this.globalData.memberExpireTime = 0;
      }
    } catch (e) {
      console.error('获取会员状态失败', e);
    }
  },

  updateMemberStatus(expireTime) {
    try {
      wx.setStorageSync('memberExpireTime', expireTime.toString());
      this.globalData.isMember = true;
      this.globalData.memberExpireTime = expireTime;
    } catch (e) {
      console.error('保存会员信息失败', e);
    }
  },

  extendMembership() {
    try {
      const now = Date.now();
      const existingExpireTime = wx.getStorageSync('memberExpireTime');
      let expireTime;
      if (existingExpireTime && parseInt(existingExpireTime) > now) {
        // 已有会员，延长3天
        expireTime = parseInt(existingExpireTime) + 3 * 24 * 60 * 60 * 1000;
      } else {
        // 无会员，新获得3天
        expireTime = now + 3 * 24 * 60 * 60 * 1000;
      }
      wx.setStorageSync('memberExpireTime', expireTime.toString());
      this.globalData.isMember = true;
      this.globalData.memberExpireTime = expireTime;
      return expireTime;
    } catch (e) {
      console.error('延长会员失败', e);
      return null;
    }
  }
})
