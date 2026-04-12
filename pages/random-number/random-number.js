// random-number.js
Page({
  data: {
    // ① 随机数生成器
    rng: {
      min: 1,
      max: 100,
      count: 1,
      allowRepeat: true,
      results: []
    },
    // ② 是/否
    yesno: {
      answer: ''
    },
    // ③ 排列 & 组合
    pnc: {
      n: 10,
      r: 3,
      calculated: false,
      permutation: '',
      combination: '',
      permutationFormula: '',
      combinationFormula: ''
    }
  },

  // ══════════════════════════════════════════
  //  ① 随机数生成器
  // ══════════════════════════════════════════

  onRngInput: function (e) {
    const field = e.currentTarget.dataset.field;
    const raw = e.detail.value;
    const val = raw === '' ? '' : parseInt(raw, 10);
    const rng = Object.assign({}, this.data.rng);
    rng[field] = isNaN(val) ? '' : val;
    // 数量变为 1 时重置 allowRepeat
    if (field === 'count' && val === 1) rng.allowRepeat = true;
    this.setData({ rng });
  },

  onRepeatToggle: function (e) {
    const rng = Object.assign({}, this.data.rng, { allowRepeat: e.detail.value });
    this.setData({ rng });
  },

  generateNumbers: function () {
    const { min, max, count, allowRepeat } = this.data.rng;

    // 输入校验
    if (min === '' || max === '' || count === '') {
      wx.showToast({ title: '请填写完整参数', icon: 'none' }); return;
    }
    const iMin = parseInt(min, 10);
    const iMax = parseInt(max, 10);
    const iCount = parseInt(count, 10);

    if (iMin > iMax) {
      wx.showToast({ title: '开始范围不能大于终止范围', icon: 'none' }); return;
    }
    if (iCount < 1 || iCount > 1000) {
      wx.showToast({ title: '生成数量请在 1 ~ 1000 之间', icon: 'none' }); return;
    }
    const rangeSize = iMax - iMin + 1;
    if (!allowRepeat && iCount > rangeSize) {
      wx.showToast({ title: `不重复时最多生成 ${rangeSize} 个数`, icon: 'none' }); return;
    }

    let results = [];
    if (allowRepeat) {
      for (let i = 0; i < iCount; i++) {
        results.push(Math.floor(Math.random() * rangeSize) + iMin);
      }
    } else {
      // Fisher-Yates 抽样
      const pool = [];
      for (let i = iMin; i <= iMax; i++) pool.push(i);
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      results = pool.slice(0, iCount);
    }

    const rng = Object.assign({}, this.data.rng, { results });
    this.setData({ rng });
  },

  // ══════════════════════════════════════════
  //  ② 是 / 否
  // ══════════════════════════════════════════

  generateYesNo: function () {
    const answer = Math.random() < 0.5 ? '是' : '否';
    this.setData({ yesno: { answer } });
  },

  // ══════════════════════════════════════════
  //  ③ 排列数 & 组合数
  // ══════════════════════════════════════════

  onPncInput: function (e) {
    const field = e.currentTarget.dataset.field;
    const raw = e.detail.value;
    const val = raw === '' ? '' : parseInt(raw, 10);
    const pnc = Object.assign({}, this.data.pnc, { [field]: isNaN(val) ? '' : val, calculated: false });
    this.setData({ pnc });
  },

  calculatePnC: function () {
    const { n, r } = this.data.pnc;

    if (n === '' || r === '') {
      wx.showToast({ title: '请填写 n 和 r', icon: 'none' }); return;
    }
    const iN = parseInt(n, 10);
    const iR = parseInt(r, 10);

    if (iN < 0 || iR < 0) {
      wx.showToast({ title: 'n 和 r 必须为非负整数', icon: 'none' }); return;
    }
    if (iR > iN) {
      wx.showToast({ title: 'r 不能大于 n', icon: 'none' }); return;
    }
    if (iN > 20) {
      wx.showToast({ title: 'n 最大支持 20（避免溢出）', icon: 'none' }); return;
    }

    // 计算阶乘（用 BigInt 避免大数溢出）
    const factorial = (x) => {
      let result = BigInt(1);
      for (let i = 2; i <= x; i++) result *= BigInt(i);
      return result;
    };

    const fN = factorial(iN);
    const fR = factorial(iR);
    const fNR = factorial(iN - iR);

    const perm = fN / fNR;                // P(n,r) = n! / (n-r)!
    const comb = fN / (fR * fNR);         // C(n,r) = n! / (r! * (n-r)!)

    const pnc = Object.assign({}, this.data.pnc, {
      calculated: true,
      permutation: perm.toString(),
      combination: comb.toString(),
      permutationFormula: `${iN}! / ${iN - iR}!`,
      combinationFormula: `${iN}! / (${iR}! × ${iN - iR}!)`
    });
    this.setData({ pnc });
  },

  // 分享给朋友
  onShareAppMessage() {
    return {
      title: '随机数生成器',
      path: '/pages/random-number/random-number'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '随机数生成器',
      query: '',
      imageUrl: ''
    }
  }
})
