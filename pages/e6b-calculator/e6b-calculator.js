// e6b-calculator.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    question: '点击屏幕生成题目',
    answer: '',
    helpSteps: [],
    showAnswer: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.generateQuestion();
  },

  /**
   * 生成题目
   */
  generateQuestion: function () {
    // 随机选择生成不同类型的题目
    var types = ['wind', 'calc', 'gradient', 'altitude', 'airspeed', 'windCalculate', 'safeReturn'];
    var type = types[Math.floor(Math.random() * types.length)];
    var problem = this.generateProblem(type);
    
    this.setData({
      question: problem[0],
      answer: problem[1],
      helpSteps: problem[2],
      showAnswer: false
    });
  },

  /**
   * 显示答案
   */
  showAnswer: function () {
    this.setData({
      showAnswer: true
    });
  },

  /**
   * 生成随机数
   */
  rand: function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  /**
   * 风速侧基础题目：计算修正风后的航向
   */
  wind_basic_heading: function () {
    var course = this.rand(1, 360);
    var tas = this.rand(60, 180);
    var wdir = this.rand(1, 36) * 10;
    var wspeed = this.rand(5, 40);
    
    // 计算逆风分量
    const headwind = this.calculateHeadwind(course, wdir, wspeed);
    
    // 计算侧风分量
    const crosswind = this.calculateCrosswind(course, wdir, wspeed);
    
    // 计算有效速度
    const effectiveSpeed = this.calculateEffectiveSpeed(tas, crosswind);
    
    // 计算地速
    const groundSpeed = effectiveSpeed - headwind;
    
    // 计算风修正角
    const windCorrectionAngle = this.calculateWindCorrectionAngle(tas, crosswind);
    
    // 计算应飞航向
    const heading = (course + windCorrectionAngle + 360) % 360;
    
    return [
      '航向计算：风向 ' + wdir + '° 风速 ' + wspeed + ' 节，航线 ' + course + '°，真空速 ' + tas + ' 节',
      '应飞航向 ' + heading.toFixed(1) + '°，地速 ' + groundSpeed.toFixed(1) + ' 节',
      [
        '将风向 ' + wdir + '° 对准"true index"指针',
        '从中心 grommet 向上标记风速 ' + wspeed + ' 节',
        '旋转将航线 ' + course + '° 对准"true index"指针',
        '滑动卡片直到标记点位于真空速 ' + tas + ' 节上',
        '在标记点下方读取风修正角',
        '计算得到航向：航线 + 风修正角'
      ]
    ];
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
   * 计算器侧基础题目：从距离和时间计算速度
   */
  calc_basic_speed: function () {
    var speed = this.rand(60, 300);
    var time = this.rand(5, 180);
    var dist = Math.round((speed / 60.0) * time);
    
    return [
      '地速（节）：在时间 ' + Math.floor(time/60) + ':' + (time%60 < 10 ? '0' : '') + (time%60) + ' 内飞行 ' + dist + ' 海里',
      '地速 ' + speed + ' 节',
      [
        '旋转内轮直到内 scale 上的时间位于外 scale 上的海里下方',
        '在外 scale 上内 scale 速率指针（60）上方读取地速'
      ]
    ];
  },

  /**
   * 生成随机题目
   */
  generateProblem: function (type) {
    var problems = [];
    
    if (type === 'wind' || type === undefined) {
      problems.push(this.wind_basic_heading);
    }
    
    if (type === 'calc' || type === undefined) {
      problems.push(this.calc_basic_speed);
    }
    
    if (type === 'gradient' || type === undefined) {
      problems.push(this.gradient_basic);
    }
    
    if (type === 'altitude' || type === undefined) {
      problems.push(this.altitude_basic);
    }
    
    if (type === 'airspeed' || type === undefined) {
      problems.push(this.airspeed_basic);
    }
    
    if (type === 'windCalculate' || type === undefined) {
      problems.push(this.wind_calculate_basic);
    }
    
    if (type === 'safeReturn' || type === undefined) {
      problems.push(this.safe_return_basic);
    }
    
    var randomIndex = Math.floor(Math.random() * problems.length);
    var randomProblem = problems[randomIndex];
    return randomProblem.call(this);
  },

  /**
   * 梯度与上升/下降率基础题目
   */
  gradient_basic: function () {
    var gradient = this.rand(1, 30);
    var groundSpeed = this.rand(60, 200);
    
    // 计算上升/下降率
    // 正确算法：上升/下降率 (ft/min) = 梯度 (%) × 5/3 × 地速 (kt)
    var climbRate = gradient * (5/3) * groundSpeed;
    
    // 计算高度变化和水平距离（用于题目描述）
    var horizontalDistance = this.rand(1, 20);
    var horizontalDistanceFeet = horizontalDistance * 6076.12;
    var altitudeChange = (gradient / 100) * horizontalDistanceFeet;
    
    return [
      '梯度计算：高度变化 ' + Math.round(altitudeChange) + ' 英尺，水平距离 ' + horizontalDistance + ' 海里，地速 ' + groundSpeed + ' 节',
      '梯度 ' + gradient.toFixed(2) + ' %，上升/下降率 ' + climbRate.toFixed(1) + ' 英尺/分钟',
      [
        '梯度计算：(高度变化 / 水平距离（英尺）) * 100%',
        '上升/下降率计算：梯度 (%) × 5/3 × 地速 (kt)',
        '其中 5/3 是 100/60 的简化形式，用于单位转换'
      ]
    ];
  },

  /**
   * 绝对高度修正基础题目
   */
  altitude_basic: function () {
    var indicatedAltitude = this.rand(1000, 30000);
    var standardPressureAltitude = this.rand(1000, 30000);
    var outsideTemp = this.rand(-50, 40);
    
    // 计算绝对高度
    // 使用正确的公式：Absolute Altitude = Indicated Altitude × (OAT (K) / ISA Temperature (K) at Pressure Altitude)
    // 1. 计算ISA温度：15 - (标准气压高度 ÷ 1000) × 2
    var isaTemp = 15 - (standardPressureAltitude / 1000) * 2;
    
    // 2. 计算实际绝对温度（K）
    var actualTempK = outsideTemp + 273.15;
    
    // 3. 计算ISA绝对温度（K）
    var isaTempK = isaTemp + 273.15;
    
    // 4. 计算绝对高度
    var absoluteAltitude = indicatedAltitude * (actualTempK / isaTempK);
    
    return [
      '绝对高度修正：仪表指示高度 ' + indicatedAltitude + ' 英尺，标准气压高度 ' + standardPressureAltitude + ' 英尺，外界温度 ' + outsideTemp + ' °C',
      '绝对高度 ' + absoluteAltitude.toFixed(1) + ' 英尺',
      [
        '计算ISA温度：15 - (标准气压高度 ÷ 1000) × 2',
        '计算实际绝对温度（K）：外界温度 + 273.15',
        '计算ISA绝对温度（K）：ISA温度 + 273.15',
        '计算绝对高度：仪表指示高度 × (实际绝对温度 / ISA绝对温度)'
      ]
    ];
  },

  /**
   * 空速换算基础题目
   */
  airspeed_basic: function () {
    var indicatedAirspeed = this.rand(60, 300);
    var altitude = this.rand(0, 30000);
    var outsideTemp = this.rand(-50, 30);
    
    // 计算真空速
    // 使用与计算器相同的算法
    var altitudeKm = altitude * 0.0003048; // 转换为公里
    var isaTemp = 15 - altitudeKm * 6.5; // ISA温度
    var altitudeFactor = 1 + altitudeKm * 0.05; // 高度修正因子
    var tempFactor = 1 + ((outsideTemp - isaTemp) / 5) * 0.01; // 温度修正因子
    var totalFactor = altitudeFactor * tempFactor;
    var trueAirspeed = indicatedAirspeed * totalFactor;
    
    return [
      '空速换算：指示空速 ' + indicatedAirspeed + ' 节，高度 ' + altitude + ' 英尺，外界温度 ' + outsideTemp + ' °C',
      '真空速 ' + trueAirspeed.toFixed(1) + ' 节',
      [
        '计算ISA温度：15 - (高度 ÷ 3280.84) × 6.5',
        '计算高度修正因子：1 + (高度(公里) × 5%)',
        '计算温度修正因子：1 + ((外界温度 - ISA温度) ÷ 5) × 1%',
        '计算真空速：指示空速 × 高度修正因子 × 温度修正因子'
      ]
    ];
  },

  /**
   * 空中风向风速计算基础题目
   */
  wind_calculate_basic: function () {
    var heading = this.rand(0, 359);
    var groundSpeed = this.rand(60, 200);
    var course = (heading + this.rand(-30, 30) + 360) % 360;
    var tas = this.rand(60, 200);
    
    // 将角度转换为弧度
    var headingRad = heading * Math.PI / 180;
    var courseRad = course * Math.PI / 180;
    
    // 计算真空速向量
    var tasX = tas * Math.cos(headingRad);
    var tasY = tas * Math.sin(headingRad);
    
    // 计算地速向量
    var gsX = groundSpeed * Math.cos(courseRad);
    var gsY = groundSpeed * Math.sin(courseRad);
    
    // 计算风向量 (风向量 = 地速向量 - 真空速向量)
    var windX = gsX - tasX;
    var windY = gsY - tasY;
    
    // 计算风速
    var windSpeed = Math.sqrt(windX * windX + windY * windY);
    
    // 计算风向
    var windDirection = Math.atan2(windY, windX) * 180 / Math.PI;
    
    // 调整风向为标准格式 (0-360度)
    if (windDirection < 0) {
      windDirection += 360;
    }
    
    // 风向是风的来向，所以需要加上180度
    windDirection = (windDirection + 180) % 360;
    
    return [
      '风向风速计算：航向 ' + heading + '°，地速 ' + groundSpeed + ' 节，航线 ' + course + '°，真空速 ' + tas + ' 节',
      '风向 ' + windDirection.toFixed(1) + '°，风速 ' + windSpeed.toFixed(1) + ' 节',
      [
        '计算真空速向量：真空速 × cos(航向)，真空速 × sin(航向)',
        '计算地速向量：地速 × cos(航线)，地速 × sin(航线)',
        '计算风向量：地速向量 - 真空速向量',
        '计算风速：风向量的模',
        '计算风向：风向量的方向 + 180度（风的来向）'
      ]
    ];
  },

  /**
   * 安全返航点基础题目
   */
  safe_return_basic: function () {
    var outboundSpeed = this.rand(60, 200);
    var inboundSpeed = this.rand(60, 200);
    var totalFuel = this.rand(50, 500);
    var fuelFlowRate = this.rand(10, 100);
    
    // 计算可用飞行时间
    var availableTime = totalFuel / fuelFlowRate;
    
    // 计算安全返航点距离
    var safeReturnDistance = (availableTime * outboundSpeed * inboundSpeed) / (outboundSpeed + inboundSpeed);
    
    // 计算安全飞行时间
    var safeFlightTime = safeReturnDistance / outboundSpeed;
    
    return [
      '安全返航点计算：去程地速 ' + outboundSpeed + ' 节，返程地速 ' + inboundSpeed + ' 节，总燃油 ' + totalFuel + ' 加仑，燃油流量 ' + fuelFlowRate + ' 加仑/小时',
      '安全返航点距离 ' + safeReturnDistance.toFixed(1) + ' 海里，安全飞行时间 ' + safeFlightTime.toFixed(2) + ' 小时',
      [
        '计算可用飞行时间：总燃油 / 燃油流量',
        '计算安全返航点距离：(可用时间 * 去程地速 * 返程地速) / (去程地速 + 返程地速)',
        '计算安全飞行时间：安全返航点距离 / 去程地速'
      ]
    ];
  },

  // 分享给朋友
  onShareAppMessage() {
    return {
      title: '领航计算尺练习题',
      path: '/pages/e6b-calculator/e6b-calculator'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '领航计算尺练习题',
      path: '/pages/e6b-calculator/e6b-calculator',
      imageUrl: ''
    }
  }
});