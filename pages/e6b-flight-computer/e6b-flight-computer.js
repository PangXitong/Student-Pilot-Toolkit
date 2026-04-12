// e6b-flight-computer.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    selectedType: 'navigation',
    inputs: {
      course: '',
      tas: '',
      windDir: '',
      windSpeed: '',
      fuelFlow: '',
      flightTime: '',
      speed: '',
      time: '',
      altitudeChange: '',
      horizontalDistance: '',
      gradient: '',
      groundSpeed: '',
      climbRate: '',
      indicatedAltitude: '',
      standardPressureAltitude: '',
      airportElevation: '',
      airportPressure: '',
      standardPressure: '',
      indicatedAirspeed: '',
      trueAirspeed: '',
      altitude: '',
      outsideTemp: '',
      heading: '',
      groundSpeedWind: '',
      courseWind: '',
      tasWind: '',
      outboundSpeed: '',
      inboundSpeed: '',
      totalFuel: '',
      fuelFlowRate: ''
    },
    results: {
      groundSpeed: '',
      windCorrectionAngle: '',
      heading: '',
      fuelConsumption: '',
      distance: '',
      gradient: '',
      climbRate: '',
      trueAltitude: '',
      trueAirspeed: '',
      windDirection: '',
      windSpeed: '',
      safeReturnDistance: '',
      safeFlightTime: ''
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
  },

  /**
   * 选择计算类型
   */
  selectCalculatorType: function (e) {
    this.setData({
      selectedType: e.currentTarget.dataset.type
    });
  },

  /**
   * 输入事件处理
   */
  onInput: function (e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    
    this.setData({
      [`inputs.${field}`]: value
    });
  },

  /**
   * 计算导航相关数据
   */
  calculateNavigation: function () {
    const { course, tas, windDir, windSpeed } = this.data.inputs;
    
    if (!course || !tas || !windDir || !windSpeed) {
      wx.showToast({
        title: '请输入所有参数',
        icon: 'none'
      });
      return;
    }
    
    // 转换为数值
    const courseNum = parseFloat(course);
    const tasNum = parseFloat(tas);
    const windDirNum = parseFloat(windDir);
    const windSpeedNum = parseFloat(windSpeed);
    
    // 计算逆风分量
    const headwind = this.calculateHeadwind(courseNum, windDirNum, windSpeedNum);
    
    // 计算侧风分量
    const crosswind = this.calculateCrosswind(courseNum, windDirNum, windSpeedNum);
    
    // 计算有效速度
    const effectiveSpeed = this.calculateEffectiveSpeed(tasNum, crosswind);
    
    // 计算地速
    const groundSpeed = effectiveSpeed - headwind;
    
    // 计算风修正角
    const windCorrectionAngle = this.calculateWindCorrectionAngle(tasNum, crosswind);
    
    // 计算应飞航向
    const heading = (courseNum + windCorrectionAngle + 360) % 360;
    
    this.setData({
      results: {
        groundSpeed: groundSpeed.toFixed(1),
        windCorrectionAngle: windCorrectionAngle.toFixed(1),
        heading: heading.toFixed(1),
        fuelConsumption: '',
        distance: '',
        gradient: '',
        climbRate: '',
        trueAltitude: '',
        trueAirspeed: '',
        windDirection: '',
        windSpeed: '',
        safeReturnDistance: '',
        safeFlightTime: ''
      }
    });
  },

  /**
   * 计算燃油消耗
   */
  calculateFuel: function () {
    const { fuelFlow, flightTime } = this.data.inputs;
    
    if (!fuelFlow || !flightTime) {
      wx.showToast({
        title: '请输入所有参数',
        icon: 'none'
      });
      return;
    }
    
    // 转换为数值
    const fuelFlowNum = parseFloat(fuelFlow);
    const flightTimeNum = parseFloat(flightTime);
    
    // 计算燃油消耗
    const fuelConsumption = fuelFlowNum * flightTimeNum;
    
    this.setData({
      results: {
        groundSpeed: '',
        windCorrectionAngle: '',
        heading: '',
        fuelConsumption: fuelConsumption.toFixed(1),
        distance: '',
        gradient: '',
        climbRate: '',
        trueAltitude: '',
        trueAirspeed: '',
        windDirection: '',
        windSpeed: '',
        safeReturnDistance: '',
        safeFlightTime: ''
      }
    });
  },

  /**
   * 计算时间距离
   */
  calculateTimeDistance: function () {
    const { speed, time } = this.data.inputs;
    
    if (!speed || !time) {
      wx.showToast({
        title: '请输入所有参数',
        icon: 'none'
      });
      return;
    }
    
    // 转换为数值
    const speedNum = parseFloat(speed);
    const timeNum = parseFloat(time);
    
    // 计算距离
    const distance = speedNum * timeNum;
    
    this.setData({
      results: {
        groundSpeed: '',
        windCorrectionAngle: '',
        heading: '',
        fuelConsumption: '',
        distance: distance.toFixed(1),
        gradient: '',
        climbRate: '',
        trueAltitude: '',
        trueAirspeed: '',
        windDirection: '',
        windSpeed: '',
        safeReturnDistance: '',
        safeFlightTime: ''
      }
    });
  },

  /**
   * 计算逆风分量
   */
  calculateHeadwind: function (course, windDir, windSpeed) {
    const angle = (windDir - course) * Math.PI / 180;
    return windSpeed * Math.cos(angle);
  },

  /**
   * 计算侧风分量
   */
  calculateCrosswind: function (course, windDir, windSpeed) {
    const angle = (windDir - course) * Math.PI / 180;
    return windSpeed * Math.sin(angle);
  },

  /**
   * 计算有效速度
   */
  calculateEffectiveSpeed: function (tas, crosswind) {
    return Math.sqrt(tas * tas - crosswind * crosswind);
  },

  /**
   * 计算风修正角
   */
  calculateWindCorrectionAngle: function (tas, crosswind) {
    if (tas === 0) return 0;
    return Math.asin(crosswind / tas) * 180 / Math.PI;
  },

  /**
   * 计算梯度与上升/下降率
   */
  calculateGradient: function () {
    const { gradient, groundSpeed, climbRate } = this.data.inputs;
    
    // 检查输入参数
    if (!groundSpeed) {
      wx.showToast({
        title: '请输入地速',
        icon: 'none'
      });
      return;
    }
    
    // 转换为数值
    const groundSpeedNum = parseFloat(groundSpeed);
    
    let gradientNum, climbRateNum;
    
    // 根据输入参数计算缺失值
    if (gradient && !climbRate) {
      // 输入了梯度，计算上升/下降率
      gradientNum = parseFloat(gradient);
      
      // 正确算法：上升/下降率 (ft/min) = 梯度 (%) × 5/3 × 地速 (kt)
      // 物理意义：
      // 1. 梯度(%)表示每100英尺水平距离的垂直变化，即1% = 100ft/nm
      // 2. 地速(kt)表示每小时飞行的海里数，即1kt = 1nm/h
      // 3. 将单位转换为每分钟的英尺数：100ft/nm × 1nm/h × 1h/60min = 100/60 ft/min = 5/3 ft/min
      // 4. 因此，上升/下降率 = 梯度(%) × 5/3 × 地速(kt)
      climbRateNum = gradientNum * (5/3) * groundSpeedNum;
      
      // 示例验证：地速70kt，梯度10%
      // 上升/下降率 = 10 × 5/3 × 70 = 10 × 116.666... = 1166.67 ft/min
    } else if (climbRate && !gradient) {
      // 输入了上升/下降率，计算梯度
      climbRateNum = parseFloat(climbRate);
      
      // 正确算法：梯度 (%) = (上升/下降率 (ft/min) × 3) / (5 × 地速 (kt))
      // 物理意义：
      // 1. 这是上述公式的逆运算
      // 2. 为了从上升/下降率和地速计算梯度，需要将公式变形
      // 3. 梯度(%) = 上升/下降率(ft/min) / (5/3 × 地速(kt)) = 上升/下降率(ft/min) × 3/(5 × 地速(kt))
      gradientNum = (climbRateNum * 3) / (5 * groundSpeedNum);
      
      // 示例验证：地速70kt，上升/下降率1166.67ft/min
      // 梯度 = (1166.67 × 3) / (5 × 70) = 3500.01 / 350 = 10%
    } else {
      wx.showToast({
        title: '请输入地速和梯度或上升/下降率中的一个',
        icon: 'none'
      });
      return;
    }
    
    // 更新inputs和results
    var newInputs = Object.assign({}, this.data.inputs);
    newInputs.gradient = gradientNum.toFixed(2);
    newInputs.climbRate = climbRateNum.toFixed(1);
    
    var newResults = Object.assign({}, this.data.results);
    newResults.gradient = gradientNum.toFixed(2);
    newResults.climbRate = climbRateNum.toFixed(1);
    
    this.setData({
      inputs: newInputs,
      results: newResults
    });
  },

  /**
   * 计算绝对高度修正
   */
  calculateTrueAltitude: function () {
    const { indicatedAltitude, standardPressureAltitude, outsideTemp } = this.data.inputs;
    
    if (!indicatedAltitude || !standardPressureAltitude || !outsideTemp) {
      wx.showToast({
        title: '请输入所有参数',
        icon: 'none'
      });
      return;
    }
    
    // 转换为数值
    const indicatedAltitudeNum = parseFloat(indicatedAltitude);
    const standardPressureAltitudeNum = parseFloat(standardPressureAltitude);
    const outsideTempNum = parseFloat(outsideTemp);
    
    // 计算绝对高度
    // 使用正确的公式：Absolute Altitude = Indicated Altitude × (OAT (K) / ISA Temperature (K) at Pressure Altitude)
    // 1. 计算ISA温度：15 - (标准气压高度 ÷ 1000) × 2
    const isaTemp = 15 - (standardPressureAltitudeNum / 1000) * 2;
    
    // 2. 计算实际绝对温度（K）
    const actualTempK = outsideTempNum + 273.15;
    
    // 3. 计算ISA绝对温度（K）
    const isaTempK = isaTemp + 273.15;
    
    // 4. 计算绝对高度
    const absoluteAltitude = indicatedAltitudeNum * (actualTempK / isaTempK);
    
    this.setData({
      results: {
        groundSpeed: '',
        windCorrectionAngle: '',
        heading: '',
        fuelConsumption: '',
        distance: '',
        gradient: '',
        climbRate: '',
        trueAltitude: absoluteAltitude.toFixed(1),
        trueAirspeed: '',
        windDirection: '',
        windSpeed: '',
        safeReturnDistance: '',
        safeFlightTime: ''
      }
    });
  },

  /**
   * 计算真空速
   */
  calculateTrueAirspeed: function () {
    const { indicatedAirspeed, trueAirspeed, altitude, outsideTemp } = this.data.inputs;
    
    // 检查输入参数
    if (!altitude || !outsideTemp) {
      wx.showToast({
        title: '请输入高度和外界温度',
        icon: 'none'
      });
      return;
    }
    
    // 转换为数值
    const altitudeNum = parseFloat(altitude);
    const outsideTempNum = parseFloat(outsideTemp);
    
    // 计算修正因子
    const altitudeKm = altitudeNum * 0.0003048; // 转换为公里
    const isaTemp = 15 - altitudeKm * 6.5; // ISA温度
    const altitudeFactor = 1 + altitudeKm * 0.05; // 高度修正因子
    const tempFactor = 1 + ((outsideTempNum - isaTemp) / 5) * 0.01; // 温度修正因子
    const totalFactor = altitudeFactor * tempFactor;
    
    let indicatedAirspeedNum, trueAirspeedNum;
    
    // 根据输入参数计算缺失值
    if (indicatedAirspeed && !trueAirspeed) {
      // 输入了指示空速，计算真空速
      indicatedAirspeedNum = parseFloat(indicatedAirspeed);
      trueAirspeedNum = indicatedAirspeedNum * totalFactor;
    } else if (trueAirspeed && !indicatedAirspeed) {
      // 输入了真空速，计算指示空速
      trueAirspeedNum = parseFloat(trueAirspeed);
      indicatedAirspeedNum = trueAirspeedNum / totalFactor;
    } else {
      wx.showToast({
        title: '请输入高度、外界温度和指示空速或真空速中的一个',
        icon: 'none'
      });
      return;
    }
    
    // 更新inputs和results
    var newInputs = Object.assign({}, this.data.inputs);
    newInputs.indicatedAirspeed = indicatedAirspeedNum.toFixed(1);
    newInputs.trueAirspeed = trueAirspeedNum.toFixed(1);
    
    var newResults = Object.assign({}, this.data.results);
    newResults.trueAirspeed = trueAirspeedNum.toFixed(1);
    
    this.setData({
      inputs: newInputs,
      results: newResults
    });
  },

  /**
   * 计算空中风向风速
   */
  calculateWind: function () {
    const { heading, groundSpeedWind, courseWind, tasWind } = this.data.inputs;
    
    if (!heading || !groundSpeedWind || !courseWind || !tasWind) {
      wx.showToast({
        title: '请输入所有参数',
        icon: 'none'
      });
      return;
    }
    
    // 转换为数值
    const headingNum = parseFloat(heading);
    const groundSpeedWindNum = parseFloat(groundSpeedWind);
    const courseWindNum = parseFloat(courseWind);
    const tasWindNum = parseFloat(tasWind);
    
    // 将角度转换为弧度
    const headingRad = headingNum * Math.PI / 180;
    const courseRad = courseWindNum * Math.PI / 180;
    
    // 计算真空速向量
    const tasX = tasWindNum * Math.cos(headingRad);
    const tasY = tasWindNum * Math.sin(headingRad);
    
    // 计算地速向量
    const gsX = groundSpeedWindNum * Math.cos(courseRad);
    const gsY = groundSpeedWindNum * Math.sin(courseRad);
    
    // 计算风向量 (风向量 = 地速向量 - 真空速向量)
    const windX = gsX - tasX;
    const windY = gsY - tasY;
    
    // 计算风速
    const windSpeed = Math.sqrt(windX * windX + windY * windY);
    
    // 计算风向
    // 使用反正切函数计算风向，范围为 -180° 到 180°
    let windDirection = Math.atan2(windY, windX) * 180 / Math.PI;
    
    // 调整风向为标准格式 (0-360度)
    if (windDirection < 0) {
      windDirection += 360;
    }
    
    // 风向是风的来向，所以需要加上180度
    windDirection = (windDirection + 180) % 360;
    
    this.setData({
      results: {
        groundSpeed: '',
        windCorrectionAngle: '',
        heading: '',
        fuelConsumption: '',
        distance: '',
        gradient: '',
        climbRate: '',
        trueAltitude: '',
        trueAirspeed: '',
        windDirection: windDirection.toFixed(1),
        windSpeed: windSpeed.toFixed(1),
        safeReturnDistance: '',
        safeFlightTime: ''
      }
    });
  },

  /**
   * 计算安全返航点
   */
  calculateSafeReturn: function () {
    const { outboundSpeed, inboundSpeed, totalFuel, fuelFlowRate } = this.data.inputs;
    
    if (!outboundSpeed || !inboundSpeed || !totalFuel || !fuelFlowRate) {
      wx.showToast({
        title: '请输入所有参数',
        icon: 'none'
      });
      return;
    }
    
    // 转换为数值
    const outboundSpeedNum = parseFloat(outboundSpeed);
    const inboundSpeedNum = parseFloat(inboundSpeed);
    const totalFuelNum = parseFloat(totalFuel);
    const fuelFlowRateNum = parseFloat(fuelFlowRate);
    
    // 计算可用飞行时间
    const availableTime = totalFuelNum / fuelFlowRateNum;
    
    // 计算安全返航点距离
    // 公式: 安全返航点距离 = (可用时间 * 去程地速 * 返程地速) / (去程地速 + 返程地速)
    const safeReturnDistance = (availableTime * outboundSpeedNum * inboundSpeedNum) / (outboundSpeedNum + inboundSpeedNum);
    
    // 计算安全飞行时间
    const safeFlightTime = safeReturnDistance / outboundSpeedNum;
    
    this.setData({
      results: {
        groundSpeed: '',
        windCorrectionAngle: '',
        heading: '',
        fuelConsumption: '',
        distance: '',
        gradient: '',
        climbRate: '',
        trueAltitude: '',
        trueAirspeed: '',
        windDirection: '',
        windSpeed: '',
        safeReturnDistance: safeReturnDistance.toFixed(1),
        safeFlightTime: safeFlightTime.toFixed(2)
      }
    });
  },

  // 分享给朋友
  onShareAppMessage() {
    return {
      title: 'E6B领航计算器',
      path: '/pages/e6b-flight-computer/e6b-flight-computer'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: 'E6B领航计算器',
      path: '/pages/e6b-flight-computer/e6b-flight-computer',
      imageUrl: ''
    }
  }
});