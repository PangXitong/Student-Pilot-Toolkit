// dictionary.js - 民航词典页面

// ================================================================
// 缓存分片配置
// ================================================================
const CHUNK_SIZE = 100; // 每片存储条数（控制体积在 500KB 以内）
const CACHE_META_KEY = 'dictionary_meta';
const VERSION_KEY = 'dictionary_version'; // 版本管理 key
const VERSION_URL = '/version.txt'; // 服务器版本号路径

// 生成分片键名
const chunkKey = (index) => `dictionary_chunk_${index}`;

/**
 * 从服务器获取版本号
 */
const fetchVersionFromServer = () => {
  return new Promise((resolve) => {
    requestWithFallback(VERSION_URL, {
      method: 'GET',
      success: (res) => {
        const version = (res.data || '').toString().trim();
        console.log('服务器版本号:', version);
        resolve(version || null);
      },
      fail: () => {
        console.warn('获取版本号失败');
        resolve(null);
      }
    });
  });
};

/**
 * 将完整数据分片存储
 * 用 dictionary_meta 记录总条数，每次读取所有分片后拼接
 */
const saveDictionaryCache = (data) => {
  try {
    // 先读取旧 meta（在覆盖前）
    let oldTotalChunks = 0;
    try {
      const oldMeta = wx.getStorageSync(CACHE_META_KEY);
      if (oldMeta && oldMeta.totalChunks) oldTotalChunks = oldMeta.totalChunks;
    } catch (e) { /* ignore */ }

    // 清除所有旧分片（不管新旧格式）
    for (let i = 0; i < oldTotalChunks; i++) {
      wx.removeStorageSync(chunkKey(i));
    }
    // 额外兜底：多清 10 片，防止之前数据有微小偏差
    for (let i = oldTotalChunks; i < oldTotalChunks + 10; i++) {
      wx.removeStorageSync(chunkKey(i));
    }

    const totalChunks = Math.ceil(data.length / CHUNK_SIZE);
    for (let i = 0; i < totalChunks; i++) {
      const chunk = data.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      wx.setStorageSync(chunkKey(i), chunk);
    }
    wx.setStorageSync(CACHE_META_KEY, { totalChunks, totalItems: data.length });
    console.log('词典数据分片缓存完成，共', totalChunks, '片，', data.length, '条');
  } catch (e) {
    console.error('分片缓存失败', e);
    throw e;
  }
};

/**
 * 从分片缓存读取完整数据
 */
const loadDictionaryCache = () => {
  try {
    const meta = wx.getStorageSync(CACHE_META_KEY);
    if (!meta || !meta.totalChunks || meta.totalChunks === 0) return null;

    const chunks = [];
    for (let i = 0; i < meta.totalChunks; i++) {
      const chunk = wx.getStorageSync(chunkKey(i));
      if (chunk && Array.isArray(chunk)) {
        chunks.push(...chunk);
      }
    }

    if (chunks.length === 0) return null;
    return chunks;
  } catch (e) {
    console.warn('读取分片缓存失败', e);
    return null;
  }
};

/**
 * 清除所有词典缓存（分片 + 旧格式单条 + 版本信息）
 */
const clearDictionaryCache = () => {
  try {
    // 清除旧格式
    wx.removeStorageSync('dictionary_cache');

    // 先读取 meta 再清除
    let totalChunks = 0;
    try {
      const meta = wx.getStorageSync(CACHE_META_KEY);
      if (meta && meta.totalChunks) totalChunks = meta.totalChunks;
    } catch (e) { /* ignore */ }

    // 清除 meta 和版本信息
    wx.removeStorageSync(CACHE_META_KEY);
    wx.removeStorageSync(VERSION_KEY);

    // 清除所有分片（多清一点兜底）
    const clearCount = Math.max(totalChunks + 10, 20);
    for (let i = 0; i < clearCount; i++) {
      wx.removeStorageSync(chunkKey(i));
    }

    if (totalChunks > 0) {
      console.log('已清除词典缓存，共', clearCount, '片');
    }
  } catch (e) { /* ignore */ }
};

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

  /**
   * 核心逻辑：先查版本，再决定要不要刷新数据
   * @param {boolean} forceRefresh - 是否强制刷新（用户主动触发）
   */
  fetchDictionaryData(forceRefresh) {
    // 非强制刷新时：先检查本地缓存和版本号
    if (!forceRefresh) {
      // 1. 检查本地是否有缓存
      const cached = loadDictionaryCache();
      if (cached && cached.length > 0) {
        // 2. 有缓存，获取服务器版本号对比
        this.checkVersionAndLoad(cached);
        return;
      }
    }

    // 无缓存或强制刷新 → 直接下载数据
    this.downloadAndCacheData(forceRefresh);
  },

  /**
   * 检查版本号：如果一致则用缓存，不一致则下载新数据
   * @param {Array} cachedData - 本地缓存数据
   */
  checkVersionAndLoad(cachedData) {
    const localVersion = wx.getStorageSync(VERSION_KEY);
    console.log('本地缓存版本:', localVersion || '无');

    // 没有本地版本号（可能是旧缓存），去服务器对比
    if (!localVersion) {
      this.downloadAndCacheData(false);
      return;
    }

    // 请求服务器版本号
    wx.showLoading({ title: '检查更新...' });

    // 需要同时获取版本号和数据，先用 Promise 获取版本
    fetchVersionFromServer().then(serverVersion => {
      wx.hideLoading();

      if (!serverVersion) {
        // 服务器版本不可达，直接返回缓存
        console.log('服务器版本不可达，使用本地缓存');
        this.setData({ dictionaryData: cachedData });
        return;
      }

      if (serverVersion === localVersion) {
        // 版本一致，直接使用缓存
        console.log('版本一致，使用缓存');
        this.setData({ dictionaryData: cachedData });
        wx.showToast({ title: '词库已是最新', icon: 'none' });
        return;
      }

      // 版本不一致，下载新数据
      console.log('版本不一致:', localVersion, '→', serverVersion);
      this.downloadAndCacheData(false);
    }).catch(() => {
      wx.hideLoading();
      // 出错也返回缓存
      console.log('版本检查失败，使用本地缓存');
      this.setData({ dictionaryData: cachedData });
    });
  },

  /**
   * 下载词典数据并缓存
   * @param {boolean} forceRefresh - 是否强制刷新
   */
  downloadAndCacheData(forceRefresh) {
    wx.showLoading({ title: forceRefresh ? '正在更新词库...' : '加载中...' });
    if (forceRefresh) {
      this.setData({ isRefreshing: true });
      // 强制刷新时清除旧缓存
      clearDictionaryCache();
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
            chinese: item.chinese || item.Chinese || item.cn || item.CN || '',
            cnexplain: item.cnexplain || item.cnExplanation || '',
            enexplain: item.enexplain || item.enExplanation || ''
          }));

          // 分片保存数据
          try {
            saveDictionaryCache(dataWithId);

            // 保存版本号
            requestWithFallback(VERSION_URL, {
              method: 'GET',
              success: (res) => {
                const version = (res.data || '').toString().trim();
                if (version) {
                  wx.setStorageSync(VERSION_KEY, version);
                  console.log('已保存版本:', version);
                }
              },
              fail: () => {
                // 版本保存失败不影响词典数据
                console.warn('保存版本失败');
              }
            });
          } catch (e) {
            console.error('保存缓存失败，请检查存储空间', e);
            wx.showToast({ title: '缓存失败，请清理缓存后重试', icon: 'none' });
            // 回退：清除可能残留的分片
            clearDictionaryCache();
            return;
          }

          this.setData({ dictionaryData: dataWithId });

          if (forceRefresh) {
            // 刷新后按当前关键词重新搜索
            if (this.data.searchKeyword) {
              this.searchDictionary(this.data.searchKeyword.toLowerCase());
            }
            wx.showToast({ title: `词库已更新`, icon: 'success' });
          } else {
            console.log('词典数据加载完成，共', dataWithId.length, '条');
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
    }).sort((a, b) => {
      // 完全匹配的字段优先级排序：英文 > 缩写 > 中文
      const aEnglishMatch = a.english && a.english.toLowerCase() === keyword;
      const aAbbreviationMatch = a.abbreviation && a.abbreviation.toLowerCase() === keyword;
      const aChineseMatch = a.chinese && a.chinese === keyword;
      
      const bEnglishMatch = b.english && b.english.toLowerCase() === keyword;
      const bAbbreviationMatch = b.abbreviation && b.abbreviation.toLowerCase() === keyword;
      const bChineseMatch = b.chinese && b.chinese === keyword;
      
      // 英文完全匹配的优先级最高
      if (aEnglishMatch && !bEnglishMatch) return -1;
      if (bEnglishMatch && !aEnglishMatch) return 1;
      
      // 缩写完全匹配的次之
      if (aAbbreviationMatch && !bAbbreviationMatch) return -1;
      if (bAbbreviationMatch && !aAbbreviationMatch) return 1;
      
      // 中文完全匹配的再次之
      if (aChineseMatch && !bChineseMatch) return -1;
      if (bChineseMatch && !aChineseMatch) return 1;
      
      // 如果都完全匹配或都不完全匹配，则保持原顺序
      return 0;
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
