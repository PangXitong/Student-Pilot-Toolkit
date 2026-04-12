// webview.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    url: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    if (options.url) {
      this.setData({
        url: decodeURIComponent(options.url)
      })
    }
  },

  /**
   * 接收来自web-view的消息
   */
  onMessage: function (e) {
    console.log('收到来自web-view的消息:', e.detail)
  },

  // ---------- 分享功能 ----------
  onShareAppMessage() {
    return {
      title: '网页浏览',
      path: '/pages/webview/webview',
      imageUrl: '',
    };
  },

  onShareTimeline() {
    return {
      title: '网页浏览',
      query: '',
      imageUrl: '',
    };
  },
})