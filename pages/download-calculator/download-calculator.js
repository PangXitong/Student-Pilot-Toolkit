// download-calculator.js
Page({
  data: {
    fileSize: '',
    fileSizeUnit: 'MB',
    fileSizeUnitIndex: 1,
    downloadSpeed: '',
    downloadSpeedUnit: 'MB/s',
    downloadSpeedUnitIndex: 1,
    days: '',
    hours: '',
    minutes: '',
    seconds: '',
    fileSizeUnits: ['KB', 'MB', 'GB', 'TB', 'KiB', 'MiB', 'GiB', 'TiB'],
    speedUnits: ['KB/s', 'MB/s', 'Mbps'],
    result: ''
  },

  onLoad: function (options) {
    this.setData({
      fileSizeUnitIndex: 1,
      downloadSpeedUnitIndex: 1
    });
  },

  onFileSizeInput: function (e) {
    this.setData({ fileSize: e.detail.value });
  },

  onDownloadSpeedInput: function (e) {
    this.setData({ downloadSpeed: e.detail.value });
  },

  onDaysInput: function (e) {
    this.setData({ days: e.detail.value });
  },

  onHoursInput: function (e) {
    this.setData({ hours: e.detail.value });
  },

  onMinutesInput: function (e) {
    this.setData({ minutes: e.detail.value });
  },

  onSecondsInput: function (e) {
    this.setData({ seconds: e.detail.value });
  },

  onFileSizeUnitChange: function (e) {
    this.setData({
      fileSizeUnitIndex: parseInt(e.detail.value),
      fileSizeUnit: this.data.fileSizeUnits[e.detail.value]
    });
  },

  onSpeedUnitChange: function (e) {
    this.setData({
      downloadSpeedUnitIndex: parseInt(e.detail.value),
      downloadSpeedUnit: this.data.speedUnits[e.detail.value]
    });
  },

  resetForm: function () {
    this.setData({
      fileSize: '',
      downloadSpeed: '',
      days: '',
      hours: '',
      minutes: '',
      seconds: '',
      result: ''
    });
  },

  convertToBytes: function (value, unit) {
    const multipliers = {
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024,
      'TB': 1024 * 1024 * 1024 * 1024,
      'KiB': 1024,
      'MiB': 1024 * 1024,
      'GiB': 1024 * 1024 * 1024,
      'TiB': 1024 * 1024 * 1024 * 1024
    };
    return value * (multipliers[unit] || 1);
  },

  convertSpeedToBytesPerSecond: function (value, unit) {
    if (unit === 'Mbps') {
      return value * 1000000 / 8;
    }
    const multipliers = {
      'KB/s': 1024,
      'MB/s': 1024 * 1024
    };
    return value * (multipliers[unit] || 1);
  },

  formatTime: function (totalSeconds) {
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    let result = '';
    if (days > 0) result += days + '天';
    if (hours > 0) result += hours + '时';
    if (minutes > 0) result += minutes + '分';
    if (seconds > 0 || result === '') result += seconds + '秒';
    
    return result;
  },

  calculateMissing: function () {
    const fileSize = parseFloat(this.data.fileSize);
    const speed = parseFloat(this.data.downloadSpeed);
    const days = this.data.days ? parseFloat(this.data.days) : 0;
    const hours = this.data.hours ? parseFloat(this.data.hours) : 0;
    const minutes = this.data.minutes ? parseFloat(this.data.minutes) : 0;
    const seconds = this.data.seconds ? parseFloat(this.data.seconds) : 0;

    const hasFileSize = fileSize > 0;
    const hasSpeed = speed > 0;
    const hasTime = days > 0 || hours > 0 || minutes > 0 || seconds > 0;

    const filledCount = (hasFileSize ? 1 : 0) + (hasSpeed ? 1 : 0) + (hasTime ? 1 : 0);

    if (filledCount < 2) {
      this.setData({ result: '请至少填写两个值' });
      return;
    }

    if (filledCount === 3) {
      this.setData({ result: '已填写三个值，无需计算' });
      return;
    }

    const fileSizeBytes = this.convertToBytes(fileSize, this.data.fileSizeUnit);
    const speedBytesPerSec = this.convertSpeedToBytesPerSecond(speed, this.data.downloadSpeedUnit);
    const totalTimeSeconds = days * 86400 + hours * 3600 + minutes * 60 + seconds;

    const multipliers = {
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024,
      'TB': 1024 * 1024 * 1024 * 1024,
      'KiB': 1024,
      'MiB': 1024 * 1024,
      'GiB': 1024 * 1024 * 1024,
      'TiB': 1024 * 1024 * 1024 * 1024
    };

    if (!hasFileSize && hasSpeed && hasTime) {
      const calculatedSize = speedBytesPerSec * totalTimeSeconds;
      const currentUnit = this.data.fileSizeUnit;
      let resultSize = calculatedSize / (multipliers[currentUnit] || (1024 * 1024));
      let resultUnit = currentUnit;
      
      if (resultSize >= 1024 && (currentUnit === 'GB' || currentUnit === 'GiB')) {
        resultSize = resultSize / 1024;
        resultUnit = currentUnit === 'GB' ? 'TB' : 'TiB';
      }
      
      this.setData({ result: '文件大小: ' + resultSize.toFixed(2) + ' ' + resultUnit });
    } else if (hasFileSize && !hasSpeed && hasTime) {
      const requiredSpeed = fileSizeBytes / totalTimeSeconds;
      const currentUnit = this.data.downloadSpeedUnit;
      let resultSpeed, resultUnit;
      
      if (currentUnit === 'Mbps') {
        resultSpeed = (requiredSpeed * 8) / 1000000;
        resultUnit = 'Mbps';
      } else if (currentUnit === 'MB/s') {
        resultSpeed = requiredSpeed / 1024 / 1024;
        resultUnit = 'MB/s';
      } else {
        resultSpeed = requiredSpeed / 1024;
        resultUnit = 'KB/s';
      }
      
      this.setData({ result: '下载速度: ' + resultSpeed.toFixed(2) + ' ' + resultUnit });
    } else if (hasFileSize && hasSpeed && !hasTime) {
      const totalSeconds = fileSizeBytes / speedBytesPerSec;
      this.setData({ result: '下载时间: ' + this.formatTime(totalSeconds) });
    }
  }
});
