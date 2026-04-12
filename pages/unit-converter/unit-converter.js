// unit-converter.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    // 当前选中的分类
    currentCategory: 'speed',
    // 当前物理量名称
    currentCategoryName: '速度',
    // 弹窗显示控制
    showCategoryModal: false,
    
    // 角度单位
    angleUnits: [
      { unit: 'deg', name: '度', symbol: 'deg', value: '' },
      { unit: 'rad', name: '弧度', symbol: 'rad', value: '' },
      { unit: 'mrad', name: '毫弧度', symbol: 'mrad', value: '' },
      { unit: 'μrad', name: '微弧度', symbol: 'μrad', value: '' },
      { unit: 'amin', name: '角分', symbol: 'amin', value: '' },
      { unit: 'asec', name: '角秒', symbol: 'asec', value: '' },
      { unit: 'masec', name: '毫角秒', symbol: 'masec', value: '' },
      { unit: 'μasec', name: '微角秒', symbol: 'μasec', value: '' }
    ],
    
    // 长度单位
    lengthUnits: [
      { unit: 'm', name: '米', symbol: 'm', value: '' },
      { unit: 'km', name: '千米', symbol: 'km', value: '' },
      { unit: 'cm', name: '厘米', symbol: 'cm', value: '' },
      { unit: 'mm', name: '毫米', symbol: 'mm', value: '' },
      { unit: 'μm', name: '微米', symbol: 'μm', value: '' },
      { unit: 'nm', name: '纳米', symbol: 'nm', value: '' },
      { unit: 'in', name: '英寸', symbol: 'in', value: '' },
      { unit: 'ft', name: '英尺', symbol: 'ft', value: '' },
      { unit: 'yd', name: '码', symbol: 'yd', value: '' },
      { unit: 'mi', name: '英里', symbol: 'mi', value: '' },
      { unit: 'nmi', name: '海里', symbol: 'nmi', value: '' },
      { unit: 'AU', name: '天文单位', symbol: 'AU', value: '' },
      { unit: 'ly', name: '光年', symbol: 'ly', value: '' },
      { unit: 'pc', name: '秒差距', symbol: 'pc', value: '' }
    ],
    
    // 面积单位
    areaUnits: [
      { unit: 'm2', name: '平方米', symbol: 'm²', value: '' },
      { unit: 'km2', name: '平方千米', symbol: 'km²', value: '' },
      { unit: 'mm2', name: '平方毫米', symbol: 'mm²', value: '' },
      { unit: 'in2', name: '平方英寸', symbol: 'in²', value: '' },
      { unit: 'ft2', name: '平方英尺', symbol: 'ft²', value: '' },
      { unit: 'yd2', name: '平方码', symbol: 'yd²', value: '' },
      { unit: 'mi2', name: '平方英里', symbol: 'mi²', value: '' },
      { unit: 'daa', name: '公亩', symbol: 'daa', value: '' },
      { unit: 'ha', name: '公顷', symbol: 'ha', value: '' },
      { unit: 'acre', name: '英亩', symbol: 'acre', value: '' }
    ],
    
    // 数据存储单位
    dataUnits: [
      { unit: 'bit', name: '位', symbol: 'bit', value: '' },
      { unit: 'byte', name: '字节', symbol: 'byte', value: '' },
      { unit: 'KB', name: 'KB', symbol: 'KB', value: '' },
      { unit: 'MB', name: 'MB', symbol: 'MB', value: '' },
      { unit: 'GB', name: 'GB', symbol: 'GB', value: '' },
      { unit: 'TB', name: 'TB', symbol: 'TB', value: '' },
      { unit: 'PB', name: 'PB', symbol: 'PB', value: '' },
      { unit: 'KiB', name: 'KiB', symbol: 'KiB', value: '' },
      { unit: 'MiB', name: 'MiB', symbol: 'MiB', value: '' },
      { unit: 'GiB', name: 'GiB', symbol: 'GiB', value: '' },
      { unit: 'TiB', name: 'TiB', symbol: 'TiB', value: '' },
      { unit: 'PiB', name: 'PiB', symbol: 'PiB', value: '' }
    ],
    
    // 能量单位
    energyUnits: [
      { unit: 'J', name: '焦耳', symbol: 'J', value: '' },
      { unit: 'kJ', name: '千焦', symbol: 'kJ', value: '' },
      { unit: 'Nm', name: '牛顿米', symbol: 'N·m', value: '' },
      { unit: 'cal', name: '卡路里', symbol: 'cal', value: '' },
      { unit: 'kcal', name: '千卡', symbol: 'kcal', value: '' },
      { unit: 'kWh', name: '千瓦时', symbol: 'kWh', value: '' },
      { unit: 'ftlb', name: '英尺磅', symbol: 'ft·lb', value: '' },
      { unit: 'erg', name: '尔格', symbol: 'erg', value: '' }
    ],
    
    // 力单位
    forceUnits: [
      { unit: 'N', name: '牛顿', symbol: 'N', value: '' },
      { unit: 'kN', name: '千牛', symbol: 'kN', value: '' },
      { unit: 'lbf', name: '磅力', symbol: 'lbf', value: '' },
      { unit: 'dyn', name: '达因', symbol: 'dyn', value: '' },
      { unit: 'pdl', name: '磅达', symbol: 'pdl', value: '' },
      { unit: 'kp', name: '千磅', symbol: 'kp', value: '' }
    ],
    
    // 燃料效率单位
    fuelUnits: [
      { unit: 'L100km', name: 'L/100km', symbol: 'L/100km', value: '' },
      { unit: 'kmL', name: 'km/L', symbol: 'km/L', value: '' },
      { unit: 'mpgUS', name: '加仑（美制）', symbol: 'mpg (US)', value: '' },
      { unit: 'mpgUK', name: '加仑（英制）', symbol: 'mpg (UK)', value: '' },
      { unit: 'miL', name: '英里/升', symbol: 'mi/L', value: '' },
      { unit: 'Lmi', name: '升/英里', symbol: 'L/mi', value: '' }
    ],
    
    // 功率单位
    powerUnits: [
      { unit: 'W', name: '瓦', symbol: 'W', value: '' },
      { unit: 'kW', name: '千瓦', symbol: 'kW', value: '' },
      { unit: 'MW', name: '兆瓦', symbol: 'MW', value: '' },
      { unit: 'hp', name: '英制马力', symbol: 'hp', value: '' },
      { unit: 'PS', name: '公制马力', symbol: 'PS', value: '' },
      { unit: 'ftlbmin', name: '英尺磅/分钟', symbol: 'ft·lb/min', value: '' },
      { unit: 'BTUhr', name: '英国热量单位/小时', symbol: 'BTU/hr', value: '' }
    ],
    
    // 压力单位
    pressureUnits: [
      { unit: 'Pa', name: '帕斯卡', symbol: 'Pa', value: '' },
      { unit: 'kPa', name: '千帕', symbol: 'kPa', value: '' },
      { unit: 'MPa', name: '兆帕', symbol: 'MPa', value: '' },
      { unit: 'bar', name: '巴', symbol: 'bar', value: '' },
      { unit: 'mbar', name: '毫巴', symbol: 'mbar', value: '' },
      { unit: 'atm', name: '标准大气压', symbol: 'atm', value: '' },
      { unit: 'psi', name: 'PSI', symbol: 'PSI', value: '' },
      { unit: 'torr', name: '托', symbol: 'torr', value: '' },
      { unit: 'inHg', name: '英寸汞柱', symbol: 'inHg', value: '' }
    ],
    
    // 速度单位
    speedUnits: [
      { unit: 'ms', name: 'm/s', symbol: 'm/s', value: '' },
      { unit: 'kmh', name: 'km/h', symbol: 'km/h', value: '' },
      { unit: 'fts', name: 'ft/s', symbol: 'ft/s', value: '' },
      { unit: 'mph', name: 'mph', symbol: 'mph', value: '' },
      { unit: 'knot', name: '节', symbol: 'knot', value: '' }
    ],
    
    // 温度单位
    temperatureUnits: [
      { unit: 'C', name: '摄氏度', symbol: '℃', value: '' },
      { unit: 'F', name: '华氏度', symbol: '℉', value: '' },
      { unit: 'K', name: '开尔文', symbol: 'K', value: '' },
      { unit: 'R', name: '兰金度', symbol: '°R', value: '' }
    ],
    
    // 时间单位
    timeUnits: [
      { unit: 'ns', name: '纳秒', symbol: 'ns', value: '' },
      { unit: 'μs', name: '微秒', symbol: 'μs', value: '' },
      { unit: 'ms', name: '毫秒', symbol: 'ms', value: '' },
      { unit: 's', name: '秒', symbol: 's', value: '' },
      { unit: 'min', name: '分', symbol: 'min', value: '' },
      { unit: 'h', name: '时', symbol: 'h', value: '' },
      { unit: 'day', name: '天', symbol: 'day', value: '' },
      { unit: 'week', name: '周', symbol: 'week', value: '' },
      { unit: 'yr', name: '年', symbol: 'yr', value: '' }
    ],
    
    // 体积单位
    volumeUnits: [
      { unit: 'm3', name: '立方米', symbol: 'm³', value: '' },
      { unit: 'L', name: '升', symbol: 'L', value: '' },
      { unit: 'mL', name: '毫升', symbol: 'mL', value: '' },
      { unit: 'in3', name: '立方英寸', symbol: 'in³', value: '' },
      { unit: 'ft3', name: '立方英尺', symbol: 'ft³', value: '' },
      { unit: 'galUS', name: '美制加仑', symbol: 'gal (US)', value: '' },
      { unit: 'qtUS', name: '美制夸脱', symbol: 'qt (US)', value: '' },
      { unit: 'ptUS', name: '美制品脱', symbol: 'pt (US)', value: '' },
      { unit: 'flozUS', name: '美制液盎司', symbol: 'fl oz (US)', value: '' },
      { unit: 'galUK', name: '英制加仑', symbol: 'gal (UK)', value: '' },
      { unit: 'qtUK', name: '英制夸脱', symbol: 'qt (UK)', value: '' },
      { unit: 'ptUK', name: '英制品脱', symbol: 'pt (UK)', value: '' },
      { unit: 'flozUK', name: '英制液盎司', symbol: 'fl oz (UK)', value: '' },
      { unit: 'cup', name: '杯', symbol: 'cup', value: '' },
      { unit: 'tbsp', name: '汤匙', symbol: 'tbsp', value: '' },
      { unit: 'tsp', name: '茶匙', symbol: 'tsp', value: '' }
    ],
    
    // 重量/质量单位
    weightUnits: [
      { unit: 'g', name: '克', symbol: 'g', value: '' },
      { unit: 'kg', name: '千克', symbol: 'kg', value: '' },
      { unit: 'mg', name: '毫克', symbol: 'mg', value: '' },
      { unit: 't', name: '吨', symbol: 't', value: '' },
      { unit: 'oz', name: '盎司', symbol: 'oz', value: '' },
      { unit: 'lb', name: '磅', symbol: 'lb', value: '' },
      { unit: 'st', name: '英石', symbol: 'st', value: '' },
      { unit: 'dram', name: '打兰', symbol: 'dram', value: '' },
      { unit: 'tonUK', name: '长吨', symbol: 'ton (UK)', value: '' },
      { unit: 'tonUS', name: '短吨', symbol: 'ton (US)', value: '' },
      { unit: 'slug', name: '斯勒格', symbol: 'slug', value: '' }
    ]
  },
  
  /**
   * 切换分类
   */
  switchCategory(e) {
    const category = e.currentTarget.dataset.category;
    const categoryNames = {
      'angle': '角度',
      'length': '长度',
      'area': '面积',
      'data': '数据存储',
      'energy': '能量',
      'force': '力',
      'fuel': '燃料效率',
      'power': '功率',
      'pressure': '压力',
      'speed': '速度',
      'temperature': '温度',
      'time': '时间',
      'volume': '体积',
      'weight': '重量/质量'
    };
    this.setData({
      currentCategory: category,
      currentCategoryName: categoryNames[category],
      showCategoryModal: false
    });
  },
  
  /**
   * 显示物理量选择弹窗
   */
  showCategoryModal() {
    this.setData({
      showCategoryModal: true
    });
  },
  
  /**
   * 关闭物理量选择弹窗
   */
  onCloseModal() {
    this.setData({
      showCategoryModal: false
    });
  },
  
  /**
   * 点击弹窗外部关闭
   */
  onModalTap() {
    this.setData({
      showCategoryModal: false
    });
  },
  
  /**
   * 输入处理
   */
  onInput(e) {
    const value = parseFloat(e.detail.value) || 0;
    const category = e.currentTarget.dataset.category;
    const unit = e.currentTarget.dataset.unit;
    
    // 根据分类进行单位换算
    switch(category) {
      case 'angle':
        this.calculateAngle(value, unit);
        break;
      case 'length':
        this.calculateLength(value, unit);
        break;
      case 'area':
        this.calculateArea(value, unit);
        break;
      case 'data':
        this.calculateData(value, unit);
        break;
      case 'energy':
        this.calculateEnergy(value, unit);
        break;
      case 'force':
        this.calculateForce(value, unit);
        break;
      case 'fuel':
        this.calculateFuel(value, unit);
        break;
      case 'power':
        this.calculatePower(value, unit);
        break;
      case 'pressure':
        this.calculatePressure(value, unit);
        break;
      case 'speed':
        this.calculateSpeed(value, unit);
        break;
      case 'temperature':
        this.calculateTemperature(value, unit);
        break;
      case 'time':
        this.calculateTime(value, unit);
        break;
      case 'volume':
        this.calculateVolume(value, unit);
        break;
      case 'weight':
        this.calculateWeight(value, unit);
        break;
    }
  },
  
  /**
   * 角度换算
   */
  calculateAngle(value, unit) {
    let radValue = 0;
    
    // 转换为弧度
    switch(unit) {
      case 'deg':
        radValue = value * Math.PI / 180;
        break;
      case 'rad':
        radValue = value;
        break;
      case 'mrad':
        radValue = value / 1000;
        break;
      case 'μrad':
        radValue = value / 1000000;
        break;
      case 'amin':
        radValue = value * Math.PI / (180 * 60);
        break;
      case 'asec':
        radValue = value * Math.PI / (180 * 3600);
        break;
      case 'masec':
        radValue = value * Math.PI / (180 * 3600 * 1000);
        break;
      case 'μasec':
        radValue = value * Math.PI / (180 * 3600 * 1000000);
        break;
    }
    
    // 转换为其他单位
    const angleUnits = this.data.angleUnits.map(item => {
      let convertedValue = 0;
      switch(item.unit) {
        case 'deg':
          convertedValue = radValue * 180 / Math.PI;
          break;
        case 'rad':
          convertedValue = radValue;
          break;
        case 'mrad':
          convertedValue = radValue * 1000;
          break;
        case 'μrad':
          convertedValue = radValue * 1000000;
          break;
        case 'amin':
          convertedValue = radValue * (180 * 60) / Math.PI;
          break;
        case 'asec':
          convertedValue = radValue * (180 * 3600) / Math.PI;
          break;
        case 'masec':
          convertedValue = radValue * (180 * 3600 * 1000) / Math.PI;
          break;
        case 'μasec':
          convertedValue = radValue * (180 * 3600 * 1000000) / Math.PI;
          break;
      }
      return {
        ...item,
        value: convertedValue.toString()
      };
    });
    
    this.setData({ angleUnits });
  },
  
  /**
   * 长度换算
   */
  calculateLength(value, unit) {
    let mValue = 0;
    
    // 转换为米
    switch(unit) {
      case 'm':
        mValue = value;
        break;
      case 'km':
        mValue = value * 1000;
        break;
      case 'cm':
        mValue = value / 100;
        break;
      case 'mm':
        mValue = value / 1000;
        break;
      case 'μm':
        mValue = value / 1000000;
        break;
      case 'nm':
        mValue = value / 1000000000;
        break;
      case 'in':
        mValue = value * 0.0254;
        break;
      case 'ft':
        mValue = value * 0.3048;
        break;
      case 'yd':
        mValue = value * 0.9144;
        break;
      case 'mi':
        mValue = value * 1609.344;
        break;
      case 'nmi':
        mValue = value * 1852;
        break;
      case 'AU':
        mValue = value * 149597870700;
        break;
      case 'ly':
        mValue = value * 9460730472580800;
        break;
      case 'pc':
        mValue = value * 3.0856775814913673e16;
        break;
    }
    
    // 转换为其他单位
    const lengthUnits = this.data.lengthUnits.map(item => {
      let convertedValue = 0;
      switch(item.unit) {
        case 'm':
          convertedValue = mValue;
          break;
        case 'km':
          convertedValue = mValue / 1000;
          break;
        case 'cm':
          convertedValue = mValue * 100;
          break;
        case 'mm':
          convertedValue = mValue * 1000;
          break;
        case 'μm':
          convertedValue = mValue * 1000000;
          break;
        case 'nm':
          convertedValue = mValue * 1000000000;
          break;
        case 'in':
          convertedValue = mValue / 0.0254;
          break;
        case 'ft':
          convertedValue = mValue / 0.3048;
          break;
        case 'yd':
          convertedValue = mValue / 0.9144;
          break;
        case 'mi':
          convertedValue = mValue / 1609.344;
          break;
        case 'nmi':
          convertedValue = mValue / 1852;
          break;
        case 'AU':
          convertedValue = mValue / 149597870700;
          break;
        case 'ly':
          convertedValue = mValue / 9460730472580800;
          break;
        case 'pc':
          convertedValue = mValue / 3.0856775814913673e16;
          break;
      }
      return {
        ...item,
        value: convertedValue.toString()
      };
    });
    
    this.setData({ lengthUnits });
  },
  
  /**
   * 面积换算
   */
  calculateArea(value, unit) {
    let m2Value = 0;
    
    // 转换为平方米
    switch(unit) {
      case 'm2':
        m2Value = value;
        break;
      case 'km2':
        m2Value = value * 1000000;
        break;
      case 'mm2':
        m2Value = value / 1000000;
        break;
      case 'in2':
        m2Value = value * 0.00064516;
        break;
      case 'ft2':
        m2Value = value * 0.09290304;
        break;
      case 'yd2':
        m2Value = value * 0.83612736;
        break;
      case 'mi2':
        m2Value = value * 2589988.110336;
        break;
      case 'daa':
        m2Value = value * 100;
        break;
      case 'ha':
        m2Value = value * 10000;
        break;
      case 'acre':
        m2Value = value * 4046.8564224;
        break;
    }
    
    // 转换为其他单位
    const areaUnits = this.data.areaUnits.map(item => {
      let convertedValue = 0;
      switch(item.unit) {
        case 'm2':
          convertedValue = m2Value;
          break;
        case 'km2':
          convertedValue = m2Value / 1000000;
          break;
        case 'mm2':
          convertedValue = m2Value * 1000000;
          break;
        case 'in2':
          convertedValue = m2Value / 0.00064516;
          break;
        case 'ft2':
          convertedValue = m2Value / 0.09290304;
          break;
        case 'yd2':
          convertedValue = m2Value / 0.83612736;
          break;
        case 'mi2':
          convertedValue = m2Value / 2589988.110336;
          break;
        case 'daa':
          convertedValue = m2Value / 100;
          break;
        case 'ha':
          convertedValue = m2Value / 10000;
          break;
        case 'acre':
          convertedValue = m2Value / 4046.8564224;
          break;
      }
      return {
        ...item,
        value: convertedValue.toString()
      };
    });
    
    this.setData({ areaUnits });
  },
  
  /**
   * 数据存储换算
   */
  calculateData(value, unit) {
    let bitValue = 0;
    
    // 转换为位
    switch(unit) {
      case 'bit':
        bitValue = value;
        break;
      case 'byte':
        bitValue = value * 8;
        break;
      case 'KB':
        bitValue = value * 8 * 1000;
        break;
      case 'MB':
        bitValue = value * 8 * 1000 * 1000;
        break;
      case 'GB':
        bitValue = value * 8 * 1000 * 1000 * 1000;
        break;
      case 'TB':
        bitValue = value * 8 * 1000 * 1000 * 1000 * 1000;
        break;
      case 'PB':
        bitValue = value * 8 * 1000 * 1000 * 1000 * 1000 * 1000;
        break;
      case 'KiB':
        bitValue = value * 8 * 1024;
        break;
      case 'MiB':
        bitValue = value * 8 * 1024 * 1024;
        break;
      case 'GiB':
        bitValue = value * 8 * 1024 * 1024 * 1024;
        break;
      case 'TiB':
        bitValue = value * 8 * 1024 * 1024 * 1024 * 1024;
        break;
      case 'PiB':
        bitValue = value * 8 * 1024 * 1024 * 1024 * 1024 * 1024;
        break;
    }
    
    // 转换为其他单位
    const dataUnits = this.data.dataUnits.map(item => {
      let convertedValue = 0;
      switch(item.unit) {
        case 'bit':
          convertedValue = bitValue;
          break;
        case 'byte':
          convertedValue = bitValue / 8;
          break;
        case 'KB':
          convertedValue = bitValue / (8 * 1000);
          break;
        case 'MB':
          convertedValue = bitValue / (8 * 1000 * 1000);
          break;
        case 'GB':
          convertedValue = bitValue / (8 * 1000 * 1000 * 1000);
          break;
        case 'TB':
          convertedValue = bitValue / (8 * 1000 * 1000 * 1000 * 1000);
          break;
        case 'PB':
          convertedValue = bitValue / (8 * 1000 * 1000 * 1000 * 1000 * 1000);
          break;
        case 'KiB':
          convertedValue = bitValue / (8 * 1024);
          break;
        case 'MiB':
          convertedValue = bitValue / (8 * 1024 * 1024);
          break;
        case 'GiB':
          convertedValue = bitValue / (8 * 1024 * 1024 * 1024);
          break;
        case 'TiB':
          convertedValue = bitValue / (8 * 1024 * 1024 * 1024 * 1024);
          break;
        case 'PiB':
          convertedValue = bitValue / (8 * 1024 * 1024 * 1024 * 1024 * 1024);
          break;
      }
      return {
        ...item,
        value: convertedValue.toString()
      };
    });
    
    this.setData({ dataUnits });
  },
  
  /**
   * 能量换算
   */
  calculateEnergy(value, unit) {
    let JValue = 0;
    
    // 转换为焦耳
    switch(unit) {
      case 'J':
        JValue = value;
        break;
      case 'kJ':
        JValue = value * 1000;
        break;
      case 'Nm':
        JValue = value;
        break;
      case 'cal':
        JValue = value * 4.184;
        break;
      case 'kcal':
        JValue = value * 4184;
        break;
      case 'kWh':
        JValue = value * 3600000;
        break;
      case 'ftlb':
        JValue = value * 1.3558179483314;
        break;
      case 'erg':
        JValue = value * 1e-7;
        break;
    }
    
    // 转换为其他单位
    const energyUnits = this.data.energyUnits.map(item => {
      let convertedValue = 0;
      switch(item.unit) {
        case 'J':
          convertedValue = JValue;
          break;
        case 'kJ':
          convertedValue = JValue / 1000;
          break;
        case 'Nm':
          convertedValue = JValue;
          break;
        case 'cal':
          convertedValue = JValue / 4.184;
          break;
        case 'kcal':
          convertedValue = JValue / 4184;
          break;
        case 'kWh':
          convertedValue = JValue / 3600000;
          break;
        case 'ftlb':
          convertedValue = JValue / 1.3558179483314;
          break;
        case 'erg':
          convertedValue = JValue * 1e7;
          break;
      }
      return {
        ...item,
        value: convertedValue.toString()
      };
    });
    
    this.setData({ energyUnits });
  },
  
  /**
   * 力换算
   */
  calculateForce(value, unit) {
    let NValue = 0;
    
    // 转换为牛顿
    switch(unit) {
      case 'N':
        NValue = value;
        break;
      case 'kN':
        NValue = value * 1000;
        break;
      case 'lbf':
        NValue = value * 4.4482216152605;
        break;
      case 'dyn':
        NValue = value * 1e-5;
        break;
      case 'pdl':
        NValue = value * 0.138254954376;
        break;
      case 'kp':
        NValue = value * 9.80665;
        break;
    }
    
    // 转换为其他单位
    const forceUnits = this.data.forceUnits.map(item => {
      let convertedValue = 0;
      switch(item.unit) {
        case 'N':
          convertedValue = NValue;
          break;
        case 'kN':
          convertedValue = NValue / 1000;
          break;
        case 'lbf':
          convertedValue = NValue / 4.4482216152605;
          break;
        case 'dyn':
          convertedValue = NValue * 1e5;
          break;
        case 'pdl':
          convertedValue = NValue / 0.138254954376;
          break;
        case 'kp':
          convertedValue = NValue / 9.80665;
          break;
      }
      return {
        ...item,
        value: convertedValue.toString()
      };
    });
    
    this.setData({ forceUnits });
  },
  
  /**
   * 燃料效率换算
   */
  calculateFuel(value, unit) {
    let L100kmValue = 0;
    
    // 转换为L/100km
    switch(unit) {
      case 'L100km':
        L100kmValue = value;
        break;
      case 'kmL':
        L100kmValue = 100 / value;
        break;
      case 'mpgUS':
        L100kmValue = 235.214583 / value;
        break;
      case 'mpgUK':
        L100kmValue = 282.480936 / value;
        break;
      case 'miL':
        L100kmValue = 100 / (value * 1.609344);
        break;
      case 'Lmi':
        L100kmValue = value * 1.609344;
        break;
    }
    
    // 转换为其他单位
    const fuelUnits = this.data.fuelUnits.map(item => {
      let convertedValue = 0;
      switch(item.unit) {
        case 'L100km':
          convertedValue = L100kmValue;
          break;
        case 'kmL':
          convertedValue = 100 / L100kmValue;
          break;
        case 'mpgUS':
          convertedValue = 235.214583 / L100kmValue;
          break;
        case 'mpgUK':
          convertedValue = 282.480936 / L100kmValue;
          break;
        case 'miL':
          convertedValue = (100 / L100kmValue) / 1.609344;
          break;
        case 'Lmi':
          convertedValue = L100kmValue / 1.609344;
          break;
      }
      return {
        ...item,
        value: convertedValue.toString()
      };
    });
    
    this.setData({ fuelUnits });
  },
  
  /**
   * 功率换算
   */
  calculatePower(value, unit) {
    let WValue = 0;
    
    // 转换为瓦
    switch(unit) {
      case 'W':
        WValue = value;
        break;
      case 'kW':
        WValue = value * 1000;
        break;
      case 'MW':
        WValue = value * 1000000;
        break;
      case 'hp':
        WValue = value * 745.69987158227022;
        break;
      case 'PS':
        WValue = value * 735.49875;
        break;
      case 'ftlbmin':
        WValue = value * 0.022596965805523;
        break;
      case 'BTUhr':
        WValue = value * 0.29307107017222;
        break;
    }
    
    // 转换为其他单位
    const powerUnits = this.data.powerUnits.map(item => {
      let convertedValue = 0;
      switch(item.unit) {
        case 'W':
          convertedValue = WValue;
          break;
        case 'kW':
          convertedValue = WValue / 1000;
          break;
        case 'MW':
          convertedValue = WValue / 1000000;
          break;
        case 'hp':
          convertedValue = WValue / 745.69987158227022;
          break;
        case 'PS':
          convertedValue = WValue / 735.49875;
          break;
        case 'ftlbmin':
          convertedValue = WValue / 0.022596965805523;
          break;
        case 'BTUhr':
          convertedValue = WValue / 0.29307107017222;
          break;
      }
      return {
        ...item,
        value: convertedValue.toString()
      };
    });
    
    this.setData({ powerUnits });
  },
  
  /**
   * 压力换算
   */
  calculatePressure(value, unit) {
    let PaValue = 0;
    
    // 转换为帕斯卡
    switch(unit) {
      case 'Pa':
        PaValue = value;
        break;
      case 'kPa':
        PaValue = value * 1000;
        break;
      case 'MPa':
        PaValue = value * 1000000;
        break;
      case 'bar':
        PaValue = value * 100000;
        break;
      case 'mbar':
        PaValue = value * 100;
        break;
      case 'atm':
        PaValue = value * 101325;
        break;
      case 'psi':
        PaValue = value * 6894.75729;
        break;
      case 'torr':
        PaValue = value * 133.3223684;
        break;
      case 'inHg':
        PaValue = value * 3386.38816;
        break;
    }
    
    // 转换为其他单位
    const pressureUnits = this.data.pressureUnits.map(item => {
      let convertedValue = 0;
      switch(item.unit) {
        case 'Pa':
          convertedValue = PaValue;
          break;
        case 'kPa':
          convertedValue = PaValue / 1000;
          break;
        case 'MPa':
          convertedValue = PaValue / 1000000;
          break;
        case 'bar':
          convertedValue = PaValue / 100000;
          break;
        case 'mbar':
          convertedValue = PaValue / 100;
          break;
        case 'atm':
          convertedValue = PaValue / 101325;
          break;
        case 'psi':
          convertedValue = PaValue / 6894.75729;
          break;
        case 'torr':
          convertedValue = PaValue / 133.3223684;
          break;
        case 'inHg':
          convertedValue = PaValue / 3386.38816;
          break;
      }
      return {
        ...item,
        value: convertedValue.toString()
      };
    });
    
    this.setData({ pressureUnits });
  },
  
  /**
   * 速度换算
   */
  calculateSpeed(value, unit) {
    let msValue = 0;
    
    // 转换为m/s
    switch(unit) {
      case 'ms':
        msValue = value;
        break;
      case 'kmh':
        msValue = value / 3.6;
        break;
      case 'fts':
        msValue = value * 0.3048;
        break;
      case 'mph':
        msValue = value * 0.44704;
        break;
      case 'knot':
        msValue = value * 0.51444444444444;
        break;
    }
    
    // 转换为其他单位
    const speedUnits = this.data.speedUnits.map(item => {
      let convertedValue = 0;
      switch(item.unit) {
        case 'ms':
          convertedValue = msValue;
          break;
        case 'kmh':
          convertedValue = msValue * 3.6;
          break;
        case 'fts':
          convertedValue = msValue / 0.3048;
          break;
        case 'mph':
          convertedValue = msValue / 0.44704;
          break;
        case 'knot':
          convertedValue = msValue / 0.51444444444444;
          break;
      }
      return {
        ...item,
        value: convertedValue.toString()
      };
    });
    
    this.setData({ speedUnits });
  },
  
  /**
   * 温度换算
   */
  calculateTemperature(value, unit) {
    let CValue = 0;
    
    // 转换为摄氏度
    switch(unit) {
      case 'C':
        CValue = value;
        break;
      case 'F':
        CValue = (value - 32) * 5 / 9;
        break;
      case 'K':
        CValue = value - 273.15;
        break;
      case 'R':
        CValue = (value - 491.67) * 5 / 9;
        break;
    }
    
    // 转换为其他单位
    const temperatureUnits = this.data.temperatureUnits.map(item => {
      let convertedValue = 0;
      switch(item.unit) {
        case 'C':
          convertedValue = CValue;
          break;
        case 'F':
          convertedValue = CValue * 9 / 5 + 32;
          break;
        case 'K':
          convertedValue = CValue + 273.15;
          break;
        case 'R':
          convertedValue = (CValue + 273.15) * 9 / 5;
          break;
      }
      return {
        ...item,
        value: convertedValue.toString()
      };
    });
    
    this.setData({ temperatureUnits });
  },
  
  /**
   * 时间换算
   */
  calculateTime(value, unit) {
    let sValue = 0;
    
    // 转换为秒
    switch(unit) {
      case 'ns':
        sValue = value * 1e-9;
        break;
      case 'μs':
        sValue = value * 1e-6;
        break;
      case 'ms':
        sValue = value * 0.001;
        break;
      case 's':
        sValue = value;
        break;
      case 'min':
        sValue = value * 60;
        break;
      case 'h':
        sValue = value * 3600;
        break;
      case 'day':
        sValue = value * 86400;
        break;
      case 'week':
        sValue = value * 604800;
        break;
      case 'yr':
        sValue = value * 31536000;
        break;
    }
    
    // 转换为其他单位
    const timeUnits = this.data.timeUnits.map(item => {
      let convertedValue = 0;
      switch(item.unit) {
        case 'ns':
          convertedValue = sValue * 1e9;
          break;
        case 'μs':
          convertedValue = sValue * 1e6;
          break;
        case 'ms':
          convertedValue = sValue * 1000;
          break;
        case 's':
          convertedValue = sValue;
          break;
        case 'min':
          convertedValue = sValue / 60;
          break;
        case 'h':
          convertedValue = sValue / 3600;
          break;
        case 'day':
          convertedValue = sValue / 86400;
          break;
        case 'week':
          convertedValue = sValue / 604800;
          break;
        case 'yr':
          convertedValue = sValue / 31536000;
          break;
      }
      return {
        ...item,
        value: convertedValue.toString()
      };
    });
    
    this.setData({ timeUnits });
  },
  
  /**
   * 体积换算
   */
  calculateVolume(value, unit) {
    let m3Value = 0;
    
    // 转换为立方米
    switch(unit) {
      case 'm3':
        m3Value = value;
        break;
      case 'L':
        m3Value = value / 1000;
        break;
      case 'mL':
        m3Value = value / 1000000;
        break;
      case 'in3':
        m3Value = value * 1.6387064e-5;
        break;
      case 'ft3':
        m3Value = value * 0.028316846592;
        break;
      case 'galUS':
        m3Value = value * 0.003785411784;
        break;
      case 'qtUS':
        m3Value = value * 0.000946352946;
        break;
      case 'ptUS':
        m3Value = value * 0.000473176473;
        break;
      case 'flozUS':
        m3Value = value * 2.95735295625e-5;
        break;
      case 'galUK':
        m3Value = value * 0.00454609;
        break;
      case 'qtUK':
        m3Value = value * 0.0011365225;
        break;
      case 'ptUK':
        m3Value = value * 0.00056826125;
        break;
      case 'flozUK':
        m3Value = value * 2.84130625e-5;
        break;
      case 'cup':
        m3Value = value * 0.0002365882365;
        break;
      case 'tbsp':
        m3Value = value * 1.478676478125e-5;
        break;
      case 'tsp':
        m3Value = value * 4.92892159375e-6;
        break;
    }
    
    // 转换为其他单位
    const volumeUnits = this.data.volumeUnits.map(item => {
      let convertedValue = 0;
      switch(item.unit) {
        case 'm3':
          convertedValue = m3Value;
          break;
        case 'L':
          convertedValue = m3Value * 1000;
          break;
        case 'mL':
          convertedValue = m3Value * 1000000;
          break;
        case 'in3':
          convertedValue = m3Value / 1.6387064e-5;
          break;
        case 'ft3':
          convertedValue = m3Value / 0.028316846592;
          break;
        case 'galUS':
          convertedValue = m3Value / 0.003785411784;
          break;
        case 'qtUS':
          convertedValue = m3Value / 0.000946352946;
          break;
        case 'ptUS':
          convertedValue = m3Value / 0.000473176473;
          break;
        case 'flozUS':
          convertedValue = m3Value / 2.95735295625e-5;
          break;
        case 'galUK':
          convertedValue = m3Value / 0.00454609;
          break;
        case 'qtUK':
          convertedValue = m3Value / 0.0011365225;
          break;
        case 'ptUK':
          convertedValue = m3Value / 0.00056826125;
          break;
        case 'flozUK':
          convertedValue = m3Value / 2.84130625e-5;
          break;
        case 'cup':
          convertedValue = m3Value / 0.0002365882365;
          break;
        case 'tbsp':
          convertedValue = m3Value / 1.478676478125e-5;
          break;
        case 'tsp':
          convertedValue = m3Value / 4.92892159375e-6;
          break;
      }
      return {
        ...item,
        value: convertedValue.toString()
      };
    });
    
    this.setData({ volumeUnits });
  },
  
  /**
   * 重量/质量换算
   */
  calculateWeight(value, unit) {
    let gValue = 0;
    
    // 转换为克
    switch(unit) {
      case 'g':
        gValue = value;
        break;
      case 'kg':
        gValue = value * 1000;
        break;
      case 'mg':
        gValue = value / 1000;
        break;
      case 't':
        gValue = value * 1000000;
        break;
      case 'oz':
        gValue = value * 28.349523125;
        break;
      case 'lb':
        gValue = value * 453.59237;
        break;
      case 'st':
        gValue = value * 6350.29318;
        break;
      case 'dram':
        gValue = value * 1.7718451953125;
        break;
      case 'tonUK':
        gValue = value * 1016046.9088;
        break;
      case 'tonUS':
        gValue = value * 907184.74;
        break;
      case 'slug':
        gValue = value * 14593.90293720636;
        break;
    }
    
    // 转换为其他单位
    const weightUnits = this.data.weightUnits.map(item => {
      let convertedValue = 0;
      switch(item.unit) {
        case 'g':
          convertedValue = gValue;
          break;
        case 'kg':
          convertedValue = gValue / 1000;
          break;
        case 'mg':
          convertedValue = gValue * 1000;
          break;
        case 't':
          convertedValue = gValue / 1000000;
          break;
        case 'oz':
          convertedValue = gValue / 28.349523125;
          break;
        case 'lb':
          convertedValue = gValue / 453.59237;
          break;
        case 'st':
          convertedValue = gValue / 6350.29318;
          break;
        case 'dram':
          convertedValue = gValue / 1.7718451953125;
          break;
        case 'tonUK':
          convertedValue = gValue / 1016046.9088;
          break;
        case 'tonUS':
          convertedValue = gValue / 907184.74;
          break;
        case 'slug':
          convertedValue = gValue / 14593.90293720636;
          break;
      }
      return {
        ...item,
        value: convertedValue.toString()
      };
    });
    
    this.setData({ weightUnits });
  },

  // 分享给朋友
  onShareAppMessage() {
    return {
      title: '单位换算器',
      path: '/pages/unit-converter/unit-converter'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '单位换算器',
      path: '/pages/unit-converter/unit-converter',
      imageUrl: ''
    }
  },

  adLoad() {
    console.log('原生模板广告加载成功')
  },

  adError(err) {
    console.error('原生模板广告加载失败', err)
  },

  adClose() {
    console.log('原生模板广告关闭')
  }
});
