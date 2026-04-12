// app.js
App({
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
  globalData: {
    userInfo: null
  }
})
