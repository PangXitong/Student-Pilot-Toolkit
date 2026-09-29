// dictionary.js - 民航词典页面

// ================================================================
// JS 工具
// ================================================================
var { requestWithFallback } = require('../../utils/util.js');

Page({
  data: {
    dictionaryData: [],
    searchResults: [],
    searchKeyword: '',
    isMember: false,
    highlightType: null,
    highlightText: '',
    isRefreshing: false
  },

  onLoad() {
    this.checkMemberStatus();
    this.fetchDictionaryData();
  },

  onShow() {
    this.checkMemberStatus();
  },

  checkMemberStatus() {
    try {
      const expireTime = wx.getStorageSync('memberExpireTime');
      if (expireTime && Date.now() < parseInt(expireTime)) {
        this.setData({ isMember: true });
      } else {
        this.setData({ isMember: false });
      }
    } catch (e) {
      console.error('获取会员状态失败', e);
    }
  },

  fetchDictionaryData(forceRefresh) {
    if (!forceRefresh) {
      try {
        const cached = wx.getStorageSync('dictionary_cache');
        if (cached && Array.isArray(cached) && cached.length > 0) {
          // 有缓存，直接使用
          this.setData({ dictionaryData: cached });
          console.log('使用本地缓存的词典数据，共', cached.length, '条');
          return;
        }
      } catch (e) {
        console.warn('读取缓存失败', e);
      }
    }

    // 无缓存或强制刷新，从网络加载
    wx.showLoading({ title: forceRefresh ? '正在更新词库...' : '加载中...' });
    if (forceRefresh) {
      this.setData({ isRefreshing: true });
    }

    requestWithFallback('/dictionary.json', {
      method: 'GET',
      success: (res) => {
        wx.hideLoading();
        this.setData({ isRefreshing: false });
        if (res.data && Array.isArray(res.data)) {
          const dataWithId = res.data.map((item, index) => ({
            id: index,
            english: item.english || item.English || item.en || '',
            abbreviation: item.abbreviation || item.Abbreviation || item.abb || item.AB || '',
            chinese: item.chinese || item.Chinese || item.cn || item.CN || ''
          }));
          // 保存到本地缓存（覆盖旧缓存）
          try {
            wx.setStorageSync('dictionary_cache', dataWithId);
            console.log('词典数据已缓存，共', dataWithId.length, '条');
          } catch (e) {
            console.warn('保存缓存失败', e);
          }
          this.setData({ dictionaryData: dataWithId });

          if (forceRefresh) {
            // 刷新后按当前关键词重新搜索
            if (this.data.searchKeyword) {
              this.searchDictionary(this.data.searchKeyword.toLowerCase());
            }
            wx.showToast({ title: `词库已更新，共${dataWithId.length}条`, icon: 'success' });
          }
        } else {
          wx.showToast({ title: '词库数据格式错误', icon: 'none' });
        }
      },
      fail: () => {
        wx.hideLoading();
        this.setData({ isRefreshing: false });
        wx.showToast({ title: '所有链接不可用，请检查网络', icon: 'none' });
      }
    });
  },

  // 刷新按钮：强制下载最新的 JSON 覆盖本地缓存
  onRefreshDictionary() {
    if (this.data.isRefreshing) return;
    wx.showModal({
      title: '更新词库',
      content: '将从服务器重新下载最新词库并覆盖本地缓存，是否继续？',
      confirmText: '更新',
      success: (res) => {
        if (res.confirm) {
          this.fetchDictionaryData(true);
        }
      }
    });
  },

  onSearchInput(e) {
    const keyword = e.detail.value;
    this.setData({ searchKeyword: keyword });
    if (keyword) {
      this.searchDictionary(keyword.toLowerCase());
    } else {
      this.setData({ searchResults: [] });
    }
  },

  onSearchConfirm(e) {
    const keyword = e.detail.value.trim();
    if (keyword) {
      this.searchDictionary(keyword.toLowerCase());
    } else {
      this.setData({ searchResults: [] });
    }
  },

  onClearSearch() {
    this.setData({
      searchKeyword: '',
      searchResults: [],
      highlightType: null,
      highlightText: ''
    });
  },

  searchDictionary(keyword) {
    const data = this.data.dictionaryData;
    const results = data.filter(item => {
      return (
        (item.english && item.english.toLowerCase().includes(keyword)) ||
        (item.abbreviation && item.abbreviation.toLowerCase().includes(keyword)) ||
        (item.chinese && item.chinese.includes(keyword))
      );
    });
    this.setData({ searchResults: results });
  },

  onItemTap(e) {
    const index = e.currentTarget.dataset.index;
    const item = this.data.searchResults[index];
    // 点击后高亮显示搜索词对应的字段
    const keyword = this.data.searchKeyword.toLowerCase();
    let highlightText = '';
    if (item.english.toLowerCase().includes(keyword)) {
      highlightText = `英语：${item.english}`;
    } else if (item.abbreviation.toLowerCase().includes(keyword)) {
      highlightText = `缩写：${item.abbreviation}`;
    } else if (item.chinese.includes(keyword)) {
      highlightText = `中文：${item.chinese}`;
    }
    this.setData({
      highlightType: index,
      highlightText: highlightText
    });
  },

  // 原生模板广告事件处理
  adLoad() {
    console.log('原生模板广告加载成功')
  },
  adError(err) {
    console.error('原生模板广告加载失败', err)
  },
  adClose() {
    console.log('原生模板广告关闭')
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: '民航词典 - 英语单词、缩写、中文翻译查询工具',
      path: '/pages/dictionary/dictionary',
      imageUrl: ''
    };
  },

  onShareTimeline() {
    return {
      title: '民航词典 - 英语单词、缩写、中文翻译查询工具',
      query: '',
      imageUrl: ''
    };
  }
});
