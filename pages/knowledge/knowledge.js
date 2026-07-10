const BASE_URL = 'https://ot7atswad4sr.ngrok.xiaomiqiu123.top/';

const CATEGORIES = [
  { key: 'ppl', label: '私照(PPL)', file: 'ppl.json' },
  { key: 'cpl', label: '商照(CPL)', file: 'cpl.json' },
  { key: 'ir', label: '仪表(IR)', file: 'ir.json' },
  { key: 'atpl-a1', label: '航线照A1(ATPL-A1)', file: 'atpl-a1.json' },
  { key: 'atpl-a2', label: '航线照A2(ATPL-A2)', file: 'atpl-a2.json' }
];

Page({
  data: {
    categories: CATEGORIES,
    currentCategory: '',
    categoryLabel: '',
    showPicker: false,
    loading: false,
    loaded: false,
    // 目录树
    allNodes: [],
    visibleNodes: [],
    expandedKeys: {},
    allLeafTopics: [],
    // 内容显示
    currentTopic: null,
    currentTopicIndex: -1,
    totalTopics: 0,
    // 收藏
    favorites: {},
    showFavorites: false,
    favoriteTopics: [],
    // 目录折叠
    tocCollapsed: false
  },

  _categoryCache: {},

  onLoad() {
    this.loadFavorites();
  },

  loadFavorites() {
    const favorites = wx.getStorageSync('knowledge_favorites') || {};
    this.setData({ favorites });
  },

  saveFavorites() {
    wx.setStorageSync('knowledge_favorites', this.data.favorites);
  },

  openPicker() {
    this.setData({ showPicker: true });
  },

  closePicker() {
    this.setData({ showPicker: false });
  },

  toggleToc() {
    this.setData({ tocCollapsed: !this.data.tocCollapsed });
  },

  confirmCategory(e) {
    const key = e.currentTarget.dataset.key;
    const label = e.currentTarget.dataset.label;
    if (key === this.data.currentCategory) {
      this.setData({ showPicker: false });
      return;
    }

    const cachedData = this._categoryCache[key];
    if (cachedData) {
      const expandedKeys = {};
      const visibleNodes = cachedData.allNodes.filter(n => !n.parentKey);
      this.setData({
        currentCategory: key,
        categoryLabel: label,
        showPicker: false,
        loaded: true,
        loading: false,
        allNodes: cachedData.allNodes,
        visibleNodes,
        expandedKeys,
        allLeafTopics: cachedData.allLeafTopics,
        currentTopic: null,
        currentTopicIndex: -1,
        totalTopics: cachedData.totalTopics,
        showFavorites: false
      });
      return;
    }

    this.setData({
      currentCategory: key,
      categoryLabel: label,
      showPicker: false,
      loaded: false,
      allNodes: [],
      visibleNodes: [],
      expandedKeys: {},
      allLeafTopics: [],
      currentTopic: null,
      currentTopicIndex: -1,
      totalTopics: 0,
      showFavorites: false
    });
    this.loadCategory(key);
  },

  loadCategory(key) {
    const category = CATEGORIES.find(c => c.key === key);
    if (!category) return;

    this.setData({ loading: true });

    wx.request({
      url: BASE_URL + category.file,
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data) {
          const data = res.data;
          const chapters = (data.chapters || []).map(ch => ({
            ...ch,
            topics: (ch.topics || []).map(t => ({
              ...t,
              content: Array.isArray(t.content) ? t.content.join('\n') : (t.content || '')
            }))
          }));

          const { allNodes, allLeafTopics } = this.buildTreeNodes(chapters);
          const expandedKeys = {};
          const visibleNodes = allNodes.filter(n => !n.parentKey);

          this._categoryCache[key] = {
            allNodes,
            allLeafTopics,
            totalTopics: allLeafTopics.length
          };

          this.setData({
            allNodes,
            visibleNodes,
            expandedKeys,
            allLeafTopics,
            totalTopics: allLeafTopics.length,
            loading: false,
            loaded: true,
            currentTopic: null,
            currentTopicIndex: -1
          });
        } else {
          this.setData({ loading: false });
          wx.showToast({ title: '数据加载失败', icon: 'none' });
        }
      },
      fail: () => {
        this.setData({ loading: false });
        wx.showToast({ title: '网络请求失败', icon: 'none' });
      }
    });
  },

  buildTreeNodes(chapters) {
    const allNodes = [];
    const allLeafTopics = [];
    const chapterTitles = {
      '1': '第1章 民用航空法',
      '2': '第2章 空中交通管理',
      '3': '第3章 航空气象',
      '4': '第4章 空中领航',
      '5': '第5章 航空器飞行原理与飞行性能',
      '6': '第6章 航空器系统与动力装置',
      '7': '第7章 航空电子与电气系统',
      '8': '第8章 航空医学',
      '9': '第9章 航空法规',
      '10': '第10章 人为因素与机组资源管理'
    };

    chapters.forEach(ch => {
      const topicMap = {};
      (ch.topics || []).forEach(t => { topicMap[t.id] = t; });

      const topicIds = (ch.topics || []).map(t => t.id);
      const prefixSet = new Set();
      topicIds.forEach(id => {
        const parts = id.split('.');
        for (let i = 1; i < parts.length; i++) {
          prefixSet.add(parts.slice(0, i).join('.'));
        }
      });

      // 章节根节点
      allNodes.push({
        key: ch.chapter_id,
        title: chapterTitles[ch.chapter_id] || ('第' + ch.chapter_id + '章'),
        level: 0,
        parentKey: '',
        hasContent: false,
        isLeaf: false,
        topicData: null
      });

      // 收集所有 key（前缀 + 叶子 topic id）
      const allKeys = [...new Set([...prefixSet, ...topicIds])];
      allKeys.sort((a, b) => {
        const aParts = a.split('.').map(Number);
        const bParts = b.split('.').map(Number);
        for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
          const av = aParts[i] || 0;
          const bv = bParts[i] || 0;
          if (av !== bv) return av - bv;
        }
        return 0;
      });

      allKeys.forEach(key => {
        if (key === ch.chapter_id) return;
        const parts = key.split('.');
        const level = parts.length - 1;
        const parentKey = parts.slice(0, -1).join('.');
        const topic = topicMap[key];
        const hasChildren = prefixSet.has(key);
        const isLeaf = !!topic && !hasChildren;

        const node = {
          key,
          title: topic ? topic.title : '',
          level,
          parentKey,
          hasContent: !!topic,
          isLeaf,
          topicData: topic || null
        };
        allNodes.push(node);

        if (isLeaf && topic) {
          allLeafTopics.push({ ...topic, chapter_id: ch.chapter_id });
        }
        // 有内容但也是父节点的，也可作为叶子显示
        if (topic && hasChildren) {
          allLeafTopics.push({ ...topic, chapter_id: ch.chapter_id });
        }
      });
    });

    return { allNodes, allLeafTopics };
  },

  toggleTreeNode(e) {
    const key = e.currentTarget.dataset.key;
    const node = this.data.allNodes.find(n => n.key === key);
    if (!node) return;

    const expandedKeys = { ...this.data.expandedKeys };

    // 如果是叶子节点且有内容，显示内容
    if (node.isLeaf && node.topicData) {
      this.showTopicContent(node);
      return;
    }

    // 如果是有内容的父节点但未被展开，先展开
    if (node.hasContent && !expandedKeys[key]) {
      this.showTopicContent(node);
    }

    // 切换展开状态
    if (expandedKeys[key]) {
      delete expandedKeys[key];
    } else {
      expandedKeys[key] = true;
    }

    this.setData({ expandedKeys });
    this.updateVisibleNodes();
  },

  showTopicContent(node) {
    const allLeafTopics = this.data.allLeafTopics;
    const idx = allLeafTopics.findIndex(t => t.id === node.key);
    const content = node.topicData.content || '';
    const contentParagraphs = content.split('\n').filter(p => p.trim());
    this.setData({
      currentTopic: node.topicData,
      contentParagraphs,
      currentTopicIndex: idx >= 0 ? idx : 0,
      showFavorites: false
    });
  },

  selectLeafNode(e) {
    const key = e.currentTarget.dataset.key;
    const node = this.data.allNodes.find(n => n.key === key);
    if (!node || !node.topicData) return;
    this.showTopicContent(node);
  },

  updateVisibleNodes() {
    const { allNodes, expandedKeys } = this.data;
    const visibleNodes = allNodes.filter(node => {
      if (!node.parentKey) return true;
      // 检查所有祖先是否都展开了
      let parent = node.parentKey;
      while (parent) {
        if (!expandedKeys[parent]) return false;
        const pNode = allNodes.find(n => n.key === parent);
        parent = pNode ? pNode.parentKey : '';
      }
      return true;
    });
    this.setData({ visibleNodes });
  },

  prevTopic() {
    const allLeafTopics = this.data.allLeafTopics;
    const currentIndex = this.data.currentTopicIndex;
    if (currentIndex <= 0) {
      wx.showToast({ title: '已是第一个知识点', icon: 'none' });
      return;
    }
    const prevIndex = currentIndex - 1;
    const prev = allLeafTopics[prevIndex];
    const content = prev.content || '';
    const contentParagraphs = content.split('\n').filter(p => p.trim());
    this.setData({
      currentTopic: prev,
      contentParagraphs,
      currentTopicIndex: prevIndex
    });
    wx.pageScrollTo({ scrollTop: 0, duration: 200 });
  },

  nextTopic() {
    const allLeafTopics = this.data.allLeafTopics;
    const currentIndex = this.data.currentTopicIndex;
    if (currentIndex >= allLeafTopics.length - 1) {
      wx.showToast({ title: '已是最后一个知识点', icon: 'none' });
      return;
    }
    const nextIndex = currentIndex + 1;
    const next = allLeafTopics[nextIndex];
    const content = next.content || '';
    const contentParagraphs = content.split('\n').filter(p => p.trim());
    this.setData({
      currentTopic: next,
      contentParagraphs,
      currentTopicIndex: nextIndex
    });
    wx.pageScrollTo({ scrollTop: 0, duration: 200 });
  },

  toggleFavorite(e) {
    const topicId = String(e.currentTarget.dataset.topicId);
    if (!this.data.currentTopic) return;
    const cat = this.data.currentCategory;
    const favorites = { ...this.data.favorites };
    if (!favorites[cat]) {
      favorites[cat] = [];
    }

    const idx = favorites[cat].indexOf(topicId);
    if (idx > -1) {
      favorites[cat].splice(idx, 1);
      wx.showToast({ title: '已取消收藏', icon: 'none' });
    } else {
      favorites[cat].push(topicId);
      wx.showToast({ title: '已收藏', icon: 'success' });
    }

    this.setData({ favorites });
    this.saveFavorites();

    if (this.data.showFavorites) {
      this.showFavoritesView();
    }
  },

  showFavoritesView() {
    const cat = this.data.currentCategory;
    const favIds = this.data.favorites[cat] || [];
    const allNodes = this.data.allNodes;
    const favoriteTopics = [];

    favIds.forEach(id => {
      const node = allNodes.find(n => String(n.key) === id && n.topicData);
      if (node) {
        // 找章节
        let parent = node.parentKey;
        let chapterId = '';
        while (parent) {
          const pNode = allNodes.find(n => n.key === parent);
          if (pNode && pNode.level === 0) {
            chapterId = pNode.key;
            break;
          }
          parent = pNode ? pNode.parentKey : '';
        }
        favoriteTopics.push({
          ...node.topicData,
          chapter_id: chapterId,
          key: node.key
        });
      }
    });

    this.setData({
      showFavorites: true,
      favoriteTopics
    });
  },

  closeFavorites() {
    this.setData({ showFavorites: false });
  },

  jumpToFavorite(e) {
    const key = e.currentTarget.dataset.key;
    const node = this.data.allNodes.find(n => String(n.key) === key);
    if (!node || !node.topicData) return;

    // 展开所有祖先
    const expandedKeys = { ...this.data.expandedKeys };
    let parent = node.parentKey;
    while (parent) {
      expandedKeys[parent] = true;
      const pNode = this.data.allNodes.find(n => n.key === parent);
      parent = pNode ? pNode.parentKey : '';
    }

    this.setData({ expandedKeys, showFavorites: false });
    this.updateVisibleNodes();
    this.showTopicContent(node);
  },

  onShareAppMessage() {
    return {
      title: '执照考试知识点',
      path: '/pages/knowledge/knowledge'
    };
  }
});
