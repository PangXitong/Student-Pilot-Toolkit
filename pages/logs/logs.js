// logs.js
const util = require('../../utils/util.js')

Page({
  data: {
    logs: []
  },
  onLoad() {
    this.setData({
      logs: (wx.getStorageSync('logs') || []).map(log => {
        return {
          date: util.formatTime(new Date(log)),
          timeStamp: log
        }
      })
    })
  },

  // ---------- 分享功能 ----------
  onShareAppMessage() {
    return {
      title: '访问日志',
      path: '/pages/logs/logs',
      imageUrl: '',
    };
  },

  onShareTimeline() {
    return {
      title: '访问日志',
      query: '',
      imageUrl: '',
    };
  },
})
