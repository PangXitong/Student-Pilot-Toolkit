// flight-time-calculator-teacher.js
Page({
  data: {
    startTime: {
      date: '2024-01-01',
      time: '00:00'
    },
    endTime: {
      date: '2024-01-01',
      time: '00:00'
    },
    nextPlanDate: '',
    nextPlanTime: '',
    nextPlanFlightTypeIndex: 0,
    plannedRemainingTime: 0,
    hourOptions: [],
    minuteOptions: [],
    nextFlightHourIndex: 0,
    nextFlightMinuteIndex: 0,
    nextFlightFlightTypeIndex: 0,
    nextAvailableTimeText: '请在上一行输入信息',
    flightTypes: [
      { label: '飞行训练', max24h: 8, max168h: 40 },
      { label: '飞行经历', max24h: 10, max168h: 40 }
    ],
    flightTypeIndex: 0,
    history: [],
    totalHours168: 0,
    nextAvailableTime: '随时可飞！',
    remainingTime: 0,
    totalHours: 0
  },

  onLoad() {
    this.initDefaultTime();
    this.loadHistory();
    this.updateStats();
    this.calculateRemainingTime();
    this.initDurationOptions();
  },

  // 获取7个日历日的开始时间（包含今天）
  get7CalendarDaysStart(nowTimestamp) {
    const now = new Date(nowTimestamp);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    return todayStart - 6 * 24 * 60 * 60 * 1000;
  },

  // 初始化小时和分钟选项
  initDurationOptions() {
    const hourOptions = [];
    const minuteOptions = [];
    
    for (let i = 0; i <= 24; i++) {
      hourOptions.push(i);
    }
    
    for (let i = 0; i < 60; i++) {
      minuteOptions.push(i);
    }
    
    this.setData({
      hourOptions,
      minuteOptions
    });
  },

  // 初始化默认时间为当前时间
  initDefaultTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    this.setData({
      'startTime.date': `${year}-${month}-${day}`,
      'startTime.time': `${hours}:${minutes}`,
      'endTime.date': `${year}-${month}-${day}`,
      'endTime.time': `${hours}:${minutes}`,
      'nextPlanDate': `${year}-${month}-${day}`,
      'nextPlanTime': `${hours}:${minutes}`
    });
  },

  // 日期和时间选择器事件
  onStartDateChange(e) {
    this.setData({ 'startTime.date': e.detail.value });
  },

  onStartTimeChange(e) {
    this.setData({ 'startTime.time': e.detail.value });
  },

  onEndDateChange(e) {
    this.setData({ 'endTime.date': e.detail.value });
  },

  onEndTimeChange(e) {
    this.setData({ 'endTime.time': e.detail.value });
  },

  onNextPlanDateChange(e) {
    this.setData({ 'nextPlanDate': e.detail.value });
    this.calculateRemainingTime();
  },

  onNextPlanTimeChange(e) {
    this.setData({ 'nextPlanTime': e.detail.value });
    this.calculateRemainingTime();
  },

  onNextPlanFlightTypeChange(e) {
    this.setData({ 'nextPlanFlightTypeIndex': e.detail.value });
    this.calculateRemainingTime();
  },

  onNextFlightHourChange(e) {
    this.setData({ 'nextFlightHourIndex': e.detail.value });
  },

  onNextFlightMinuteChange(e) {
    this.setData({ 'nextFlightMinuteIndex': e.detail.value });
  },

  onNextFlightFlightTypeChange(e) {
    this.setData({ 'nextFlightFlightTypeIndex': e.detail.value });
  },

  onFlightTypeChange(e) {
    this.setData({ flightTypeIndex: e.detail.value });
  },

  // 添加飞行记录
  addFlightRecord() {
    const { startTime, endTime, flightTypes, flightTypeIndex, history } = this.data;
    const flightType = flightTypes[flightTypeIndex];

    const start = new Date(`${startTime.date}T${startTime.time}`).getTime();
    const end = new Date(`${endTime.date}T${endTime.time}`).getTime();

    if (start >= end) {
      wx.showToast({
        title: '结束时间必须晚于开始时间',
        icon: 'none'
      });
      return;
    }

    // 检查是否有时间重叠
    for (const record of history) {
      const recordStart = record.timestamp;
      const recordEnd = record.timestamp + record.duration * 60 * 60 * 1000;
      
      // 判断两个时间段是否有重叠
      if (start < recordEnd && end > recordStart) {
        wx.showToast({
          title: '时间与已有记录重叠',
          icon: 'none'
        });
        return;
      }
    }

    const durationMs = end - start;
    const durationHours = (durationMs / (1000 * 60 * 60)).toFixed(2);

    const record = {
      id: Date.now(),
      startTime: `${startTime.date} ${startTime.time}`,
      endTime: `${endTime.date} ${endTime.time}`,
      flightType: flightType.label,
      duration: parseFloat(durationHours),
      durationText: this.formatHoursToTime(parseFloat(durationHours)),
      timestamp: start
    };

    const newHistory = [record, ...history];
    this.setData({ history: newHistory });
    this.saveHistory();
    this.updateStats();
    this.calculateRemainingTime();

    wx.showToast({
      title: '添加成功',
      icon: 'success'
    });
  },

  // 更新统计信息
  updateStats() {
    const { history, flightTypes, flightTypeIndex } = this.data;
    const flightType = flightTypes[flightTypeIndex];
    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
    const sevenCalendarDaysAgo = this.get7CalendarDaysStart(now);

    // 计算最近24小时的总飞行时间（计算重叠部分）
    const totalHours24 = this.calculateFlightHoursInRange(history, twentyFourHoursAgo, now);
    
    // 计算最近7个日历日的总飞行时间（计算重叠部分）
    const totalHours168 = this.calculateFlightHoursInRange(history, sevenCalendarDaysAgo, now);
    
    // 计算还能飞多久（同时考虑24小时和168小时限制）
    const remaining24h = Math.max(0, flightType.max24h - totalHours24);
    const remaining168h = Math.max(0, flightType.max168h - totalHours168);
    const remainingTime = Math.min(remaining24h, remaining168h).toFixed(2);
    
    // 计算下一次可飞时间（同时考虑24小时和168小时限制）
    let nextAvailableTime = '随时可飞！';
    let nextAvailable24h = null;
    let nextAvailable168h = null;
    let nextAvailableTimeTimestamp = null;
    
    // 使用精确的方法计算下次可飞时间
    let availableTime = now;
    let found = false;
    const maxSearchTime = now + 365 * 24 * 60 * 60 * 1000;
    const step = 60 * 1000;
    
    // 测试一段小的飞行时长（0.1小时）来检查是否可以飞
    const testDuration = 0.1;
    
    for (let testTime = now; testTime < maxSearchTime; testTime += step) {
      const planEndTime = testTime + testDuration * 60 * 60 * 1000;
      let isValid = true;
      
      for (let checkTime = testTime; checkTime <= planEndTime; checkTime += 5 * 60 * 1000) {
        const window24Start = checkTime - 24 * 60 * 60 * 1000;
        const window7DaysStart = this.get7CalendarDaysStart(checkTime);
        
        const history24 = this.calculateFlightHoursInRange(history, window24Start, checkTime);
        const history168 = this.calculateFlightHoursInRange(history, window7DaysStart, checkTime);
        
        const planned24 = this.calculateFlightHoursInRange(
          [{ timestamp: testTime, duration: testDuration }], 
          window24Start, 
          checkTime
        );
        
        const planned168 = this.calculateFlightHoursInRange(
          [{ timestamp: testTime, duration: testDuration }], 
          window7DaysStart, 
          checkTime
        );
        
        if (history24 + planned24 > flightType.max24h || 
            history168 + planned168 > flightType.max168h) {
          isValid = false;
          break;
        }
      }
      
      if (isValid) {
        availableTime = testTime;
        found = true;
        break;
      }
    }
    
    if (found && availableTime > now) {
      nextAvailableTimeTimestamp = availableTime;
      nextAvailableTime = this.formatDateTime(nextAvailableTimeTimestamp);
      
      // 同时找出两个限制的解除时间用于计算剩余时间
      nextAvailable24h = nextAvailableTimeTimestamp;
      nextAvailable168h = nextAvailableTimeTimestamp;
    }

    // 计算总飞行时间
    const totalHours = history.reduce((sum, record) => sum + record.duration, 0);
    
    // 计算颜色状态
    // 根据当前选择的飞行类型设置24小时颜色
    let color24h = 'normal';
    if (totalHours24 >= flightType.max24h) {
      color24h = 'danger';
    } else if (totalHours24 > flightType.max24h - 1) {
      color24h = 'warning';
    }
    
    // 7个日历日限制：超过39小时橙色，达到或超过40小时红色
    let color168h = 'normal';
    if (totalHours168 >= 40) {
      color168h = 'danger';
    } else if (totalHours168 > 39) {
      color168h = 'warning';
    }
    
    this.setData({
      totalHours24: this.formatHoursToTime(totalHours24),
      totalHours168: this.formatHoursToTime(totalHours168),
      remainingTime: this.formatHoursToTime(parseFloat(remainingTime)),
      nextAvailableTime: nextAvailableTime,
      nextAvailableTimeTimestamp: nextAvailableTimeTimestamp,
      totalHours: this.formatHoursToTime(totalHours),
      color24h: color24h,
      color168h: color168h,
      nextAvailableRemainingTime: this.formatHoursToTime(parseFloat(this.calculateNextAvailableRemainingTime(history, flightType, nextAvailable24h, nextAvailable168h)))
    });
  },

  // 计算下次可飞时间还能飞多久
  calculateNextAvailableRemainingTime(history, flightType, nextAvailable24h, nextAvailable168h) {
    if (!nextAvailable24h && !nextAvailable168h) {
      return flightType.max24h.toFixed(2);
    }
    
    const planStartTime = Math.max(nextAvailable24h || 0, nextAvailable168h || 0);
    
    let low = 0;
    let high = 24;
    let maxPossibleDuration = 0;
    
    for (let i = 0; i < 200; i++) {
      const mid = (low + high) / 2;
      if (this.isDurationValid(history, flightType, planStartTime, mid)) {
        maxPossibleDuration = mid;
        low = mid;
      } else {
        high = mid;
      }
    }
    
    let adjustedDuration = maxPossibleDuration;
    for (let testDuration = maxPossibleDuration; testDuration >= 0; testDuration -= 0.01) {
      if (this.isDurationValid(history, flightType, planStartTime, testDuration)) {
        adjustedDuration = testDuration;
        break;
      }
    }
    
    return Math.floor(adjustedDuration * 60) / 60;
  },

  // 计算给定时间段内的总飞行时间（只计算重叠部分）
  calculateFlightHoursInRange(history, rangeStart, rangeEnd) {
    const recordsInRange = history.filter(record => {
      const recordEnd = record.timestamp + record.duration * 60 * 60 * 1000;
      return record.timestamp < rangeEnd && recordEnd > rangeStart;
    });

    const totalHours = recordsInRange.reduce((sum, record) => {
      const recordStart = record.timestamp;
      const recordEnd = record.timestamp + record.duration * 60 * 60 * 1000;
      const overlapStart = Math.max(recordStart, rangeStart);
      const overlapEnd = Math.min(recordEnd, rangeEnd);
      const overlapDuration = Math.max(0, (overlapEnd - overlapStart) / (1000 * 60 * 60));
      return sum + overlapDuration;
    }, 0);

    return Math.round(totalHours * 10000) / 10000;
  },

  // 检查某个飞行时长是否可行
  isDurationValid(history, flightType, planStartTime, testDuration) {
    const planEndTime = planStartTime + testDuration * 60 * 60 * 1000;
    
    for (let checkTime = planStartTime; checkTime <= planEndTime; checkTime += 1 * 60 * 1000) {
      const window24Start = checkTime - 24 * 60 * 60 * 1000;
      const window7DaysStart = this.get7CalendarDaysStart(checkTime);
      
      const history24 = this.calculateFlightHoursInRange(history, window24Start, checkTime);
      const history168 = this.calculateFlightHoursInRange(history, window7DaysStart, checkTime);
      
      const planned24 = this.calculateFlightHoursInRange(
        [{ timestamp: planStartTime, duration: testDuration }], 
        window24Start, 
        checkTime
      );
      
      const planned168 = this.calculateFlightHoursInRange(
        [{ timestamp: planStartTime, duration: testDuration }], 
        window7DaysStart, 
        checkTime
      );
      
      const total24 = Math.round((history24 + planned24) * 10000) / 10000;
      const total168 = Math.round((history168 + planned168) * 10000) / 10000;
      
      if (total24 > flightType.max24h || 
          total168 > flightType.max168h) {
        return false;
      }
    }
    return true;
  },

  // 计划剩余飞行时间：根据开飞时间计算能飞多久
  calculateRemainingTime() {
    const { history, flightTypes, nextPlanDate, nextPlanTime, nextPlanFlightTypeIndex } = this.data;
    const flightType = flightTypes[nextPlanFlightTypeIndex];
    
    const planStartTime = new Date(`${nextPlanDate}T${nextPlanTime}`).getTime();
    const now = Date.now();
    
    if (planStartTime <= now) {
      wx.showToast({
        title: '计划时间不能早于当前时间',
        icon: 'none'
      });
      return;
    }
    
    let low = 0;
    let high = 24;
    let maxPossibleDuration = 0;
    
    for (let i = 0; i < 200; i++) {
      const mid = (low + high) / 2;
      if (this.isDurationValid(history, flightType, planStartTime, mid)) {
        maxPossibleDuration = mid;
        low = mid;
      } else {
        high = mid;
      }
    }
    
    let adjustedDuration = maxPossibleDuration;
    for (let testDuration = maxPossibleDuration; testDuration >= 0; testDuration -= 0.01) {
      if (this.isDurationValid(history, flightType, planStartTime, testDuration)) {
        adjustedDuration = testDuration;
        break;
      }
    }
    
    this.setData({
      plannedRemainingTime: this.formatHoursToTime(adjustedDuration)
    });
  },

  // 计算可以开始飞行的时间：根据想飞的时长计算什么时候能起飞
  calculateNextAvailableTime() {
    const { hourOptions, minuteOptions, nextFlightHourIndex, nextFlightMinuteIndex, nextFlightFlightTypeIndex, history } = this.data;
    
    const hours = hourOptions[nextFlightHourIndex] || 0;
    const minutes = minuteOptions[nextFlightMinuteIndex] || 0;
    
    if (hours === 0 && minutes === 0) {
      this.setData({
        nextAvailableTimeText: '请在上一行输入信息'
      });
      return;
    }
    
    const flightDurationMs = (hours * 60 + minutes) * 60 * 60 * 1000;
    const flightDurationHours = hours + minutes / 60;
    const flightType = this.data.flightTypes[nextFlightFlightTypeIndex];
    const now = Date.now();
    
    let availableTime = now;
    let found = false;
    
    const maxSearchTime = now + 365 * 24 * 60 * 60 * 1000;
    
    const step = 60 * 1000;
    
    for (let testTime = now; testTime < maxSearchTime; testTime += step) {
      const planEndTime = testTime + flightDurationMs;
      let isValid = true;
      
      for (let checkTime = testTime; checkTime <= planEndTime; checkTime += 5 * 60 * 1000) {
        const window24Start = checkTime - 24 * 60 * 60 * 1000;
        const window7DaysStart = this.get7CalendarDaysStart(checkTime);
        
        const history24 = this.calculateFlightHoursInRange(history, window24Start, checkTime);
        const history168 = this.calculateFlightHoursInRange(history, window7DaysStart, checkTime);
        
        const planned24 = this.calculateFlightHoursInRange(
          [{ timestamp: testTime, duration: flightDurationHours }], 
          window24Start, 
          checkTime
        );
        
        const planned168 = this.calculateFlightHoursInRange(
          [{ timestamp: testTime, duration: flightDurationHours }], 
          window7DaysStart, 
          checkTime
        );
        
        if (history24 + planned24 > flightType.max24h || 
            history168 + planned168 > flightType.max168h) {
          isValid = false;
          break;
        }
      }
      
      if (isValid) {
        availableTime = testTime;
        found = true;
        break;
      }
    }
    
    if (!found) {
      wx.showToast({
        title: '一年内无法安排此次飞行',
        icon: 'none'
      });
      return;
    }
    
    this.setData({
      nextAvailableTimeText: this.formatDateTime(availableTime)
    });
  },

  // 保存历史记录
  saveHistory() {
    const { history } = this.data;
    wx.setStorageSync('flightHistoryTeacher', history);
  },

  // 加载历史记录
  loadHistory() {
    try {
      const history = wx.getStorageSync('flightHistoryTeacher') || [];
      const historyWithText = history.map(record => ({
        ...record,
        durationText: record.durationText || this.formatHoursToTime(record.duration)
      }));
      this.setData({ history: historyWithText });
    } catch (e) {
      console.error('加载历史记录失败', e);
    }
  },

  // 删除历史记录
  deleteHistoryItem(e) {
    const index = e.currentTarget.dataset.index;
    const { history } = this.data;
    const newHistory = history.filter((item, i) => i !== index);
    this.setData({ history: newHistory });
    this.saveHistory();
    this.updateStats();
  },

  // 全部清除
  clearAllHistory() {
    wx.showModal({
      title: '确认清除',
      content: '确定要清除所有历史记录吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({ history: [] });
          this.saveHistory();
          this.updateStats();
          wx.showToast({
            title: '已清除所有记录',
            icon: 'success'
          });
        }
      }
    });
  },

  // 导出历史记录
  exportHistory() {
    const { history } = this.data;
    const dataStr = JSON.stringify(history, null, 2);
    
    wx.setClipboardData({
      data: dataStr,
      success: () => {
        wx.showToast({
          title: '已复制到剪切板',
          icon: 'success'
        });
      },
      fail: () => {
        wx.showToast({
          title: '复制失败',
          icon: 'none'
        });
      }
    });
  },

  // 导入历史记录
  importHistory() {
    wx.getClipboardData({
      success: (res) => {
        try {
          const importedHistory = JSON.parse(res.data);
          if (Array.isArray(importedHistory)) {
            this.setData({ history: importedHistory });
            this.saveHistory();
            this.updateStats();
            wx.showToast({
              title: '导入成功',
              icon: 'success'
            });
          } else {
            wx.showToast({
              title: '数据格式错误',
              icon: 'none'
            });
          }
        } catch (e) {
          wx.showToast({
            title: '解析失败',
            icon: 'none'
          });
        }
      },
      fail: () => {
        wx.showToast({
          title: '获取失败',
          icon: 'none'
        });
      }
    });
  },

  // 复制到剪切板
  copyToClipboard() {
    const { history } = this.data;
    const dataStr = JSON.stringify(history, null, 2);
    
    wx.setClipboardData({
      data: dataStr,
      success: () => {
        wx.showToast({
          title: '已复制到剪切板',
          icon: 'success'
        });
      },
      fail: () => {
        wx.showToast({
          title: '复制失败',
          icon: 'none'
        });
      }
    });
  },

  // 从剪切板获取
  pasteFromClipboard() {
    wx.getClipboardData({
      success: (res) => {
        try {
          const importedHistory = JSON.parse(res.data);
          if (Array.isArray(importedHistory)) {
            this.setData({ history: importedHistory });
            this.saveHistory();
            this.updateStats();
            wx.showToast({
              title: '导入成功',
              icon: 'success'
            });
          } else {
            wx.showToast({
              title: '数据格式错误',
              icon: 'none'
            });
          }
        } catch (e) {
          wx.showToast({
            title: '解析失败',
            icon: 'none'
          });
        }
      },
      fail: () => {
        wx.showToast({
          title: '获取失败',
          icon: 'none'
        });
      }
    });
  },

  // 格式化日期时间
  formatDateTime(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  },

  // 格式化小时为时分格式
  formatHoursToTime(hours) {
    const totalMinutes = Math.floor(hours * 60 * 10000) / 10000;
    const h = Math.floor(totalMinutes / 60);
    const m = Math.floor(totalMinutes % 60);
    if (m === 0) {
      return `${h}时`;
    }
    return `${h}时${m}分`;
  },

  // 分享给朋友
  onShareAppMessage() {
    return {
      title: '教员飞行时间计算器',
      path: '/pages/flight-time-calculator-teacher/flight-time-calculator-teacher'
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '教员飞行时间计算器',
      query: '',
      imageUrl: ''
    };
  },

  // 跳转到学员版本
  goToStudent() {
    wx.navigateTo({
      url: '/pages/flight-time-calculator/flight-time-calculator'
    });
  }
});