// time-calculator.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    currentUTC: '',
    utcDate: '',
    utcTime: '',
    localDate: '',
    localTime: '',
    timezones: [],
    utcOffsetIndex: 12, // 默认UTC+0
    localOffsetIndex: 12, // 默认UTC+0
    localTimeResult: '',
    utcTimeResult: '',
    longitude: '',
    utcOffsetFromLongitude: '',
    timezoneFromLongitude: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.initTimezones();
    this.updateCurrentUTC();
    this.initDateTime();
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.updateCurrentUTC();
  },

  /**
   * 初始化时区选项
   */
  initTimezones: function () {
    const timezones = [];
    for (let i = -12; i <= 12; i++) {
      const label = i >= 0 ? `UTC+${i}` : `UTC${i}`;
      timezones.push({ label, value: i });
    }
    this.setData({ timezones });
  },

  /**
   * 更新当前UTC时间
   */
  updateCurrentUTC: function () {
    const now = new Date();
    const utcString = now.toISOString().replace('T', ' ').substring(0, 19);
    this.setData({ currentUTC: utcString });
  },

  /**
   * 初始化日期时间
   */
  initDateTime: function () {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    const dateStr = `${year}-${month}-${day}`;
    const timeStr = `${hours}:${minutes}`;
    
    this.setData({
      utcDate: dateStr,
      utcTime: timeStr,
      localDate: dateStr,
      localTime: timeStr
    });
  },

  /**
   * UTC日期变化
   */
  onUTCDateChange: function (e) {
    this.setData({ utcDate: e.detail.value });
  },

  /**
   * UTC时间变化
   */
  onUTCTimeChange: function (e) {
    this.setData({ utcTime: e.detail.value });
  },

  /**
   * 当地日期变化
   */
  onLocalDateChange: function (e) {
    this.setData({ localDate: e.detail.value });
  },

  /**
   * 当地时间变化
   */
  onLocalTimeChange: function (e) {
    this.setData({ localTime: e.detail.value });
  },

  /**
   * UTC时区偏移变化
   */
  onUTCOffsetChange: function (e) {
    this.setData({ utcOffsetIndex: e.detail.value });
  },

  /**
   * 当地时区偏移变化
   */
  onLocalOffsetChange: function (e) {
    this.setData({ localOffsetIndex: e.detail.value });
  },

  /**
   * 计算当地时间
   */
  calculateLocalTime: function () {
    const { utcDate, utcTime, timezones, utcOffsetIndex } = this.data;
    const offset = timezones[utcOffsetIndex].value;
    
    // 解析UTC时间
    const [year, month, day] = utcDate.split('-').map(Number);
    const [hours, minutes] = utcTime.split(':').map(Number);
    
    // 创建UTC日期对象并应用时区偏移
    const localDateObj = new Date(Date.UTC(year, month - 1, day, hours, minutes) + offset * 60 * 60 * 1000);
    
    // 格式化结果
    const localTimeResult = this.formatDate(localDateObj);
    this.setData({ localTimeResult });
  },

  /**
   * 计算UTC时间
   */
  calculateUTCTime: function () {
    const { localDate, localTime, timezones, localOffsetIndex } = this.data;
    const offset = timezones[localOffsetIndex].value;
    
    // 解析当地时间
    const [year, month, day] = localDate.split('-').map(Number);
    const [hours, minutes] = localTime.split(':').map(Number);
    
    // 创建UTC日期对象（将输入的当地时间视为UTC时间，然后减去偏移）
    const utcDateObj = new Date(Date.UTC(year, month - 1, day, hours, minutes) - offset * 60 * 60 * 1000);
    
    // 格式化结果
    const utcTimeResult = this.formatDate(utcDateObj);
    this.setData({ utcTimeResult });
  },

  /**
   * 格式化日期时间
   */
  formatDate: function (date) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  },

  /**
   * 经度输入变化
   */
  onLongitudeInput: function (e) {
    this.setData({ longitude: e.detail.value });
  },

  /**
   * 从经度计算UTC偏移
   */
  calculateUTCOffsetFromLongitude: function () {
    const { longitude } = this.data;
    
    if (!longitude) {
      wx.showToast({
        title: '请输入经度',
        icon: 'none'
      });
      return;
    }
    
    const longitudeNum = parseFloat(longitude);
    
    // 经度每15度对应一个时区，计算小时和分钟
    const totalHours = longitudeNum / 15;
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);
    
    // 确保UTC偏移在-12到+12之间
    const clampedHours = Math.max(-12, Math.min(12, hours));
    
    // 格式化UTC偏移（包含分钟）
    const sign = clampedHours >= 0 ? '+' : '';
    const offsetString = minutes > 0 ? `${sign}${Math.abs(clampedHours)}:${minutes.toString().padStart(2, '0')}` : `${sign}${clampedHours}`;
    
    // 格式化时区（只包含小时）
    const timezoneSign = clampedHours >= 0 ? '+' : '';
    const timezoneString = `UTC${timezoneSign}${Math.abs(clampedHours)}`;
    
    this.setData({
      utcOffsetFromLongitude: offsetString,
      timezoneFromLongitude: timezoneString
    });
  },

  // 分享给朋友
  onShareAppMessage() {
    return {
      title: '时间计算器',
      path: '/pages/time-calculator/time-calculator'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '时间计算器',
      path: '/pages/time-calculator/time-calculator',
      imageUrl: ''
    }
  }
});