// shipin.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    videoLink: 'https://v.douyin.com/GUxkPqFtGUg/'
  },

  /**
   * 保存图片
   */
  saveImage() {
    wx.getSetting({
      success: (res) => {
        if (!res.authSetting['scope.writePhotosAlbum']) {
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success: () => {
              this.trySaveImage()
            },
            fail: (error) => {
              console.log('授权失败:', error)
              wx.showToast({
                title: '需要保存图片权限，请在设置中开启',
                icon: 'none'
              })
            }
          })
        } else {
          this.trySaveImage()
        }
      },
      fail: (error) => {
        console.log('获取设置失败:', error)
        wx.showToast({
          title: '获取设置失败',
          icon: 'none'
        })
      }
    })
  },

  /**
   * 尝试保存图片（兼容iOS）
   */
  trySaveImage() {
    // 尝试多种路径格式
    const paths = [
      '../../images/ChannelsCode.jpg',  // 相对路径
      '/pages/images/ChannelsCode.jpg',  // 绝对路径
      'images/ChannelsCode.jpg'  // 相对路径2
    ];
    
    // 递归尝试保存
    this.attemptSave(paths, 0);
  },
  
  /**
   * 递归尝试保存图片
   */
  attemptSave(paths, index) {
    if (index >= paths.length) {
      // 所有路径都尝试失败
      wx.showToast({
        title: '保存图片失败，请检查权限',
        icon: 'none'
      });
      return;
    }
    
    const currentPath = paths[index];
    console.log('尝试路径:', currentPath);
    
    wx.saveImageToPhotosAlbum({
      filePath: currentPath,
      success: () => {
        wx.showToast({
          title: '图片已保存到相册',
          icon: 'none'
        });
      },
      fail: (error) => {
        console.log('保存失败:', error);
        // 尝试下一个路径
        this.attemptSave(paths, index + 1);
      }
    });
  },

  // 分享给朋友
  onShareAppMessage() {
    return {
      title: '作者的视频账号',
      path: '/pages/shipin/shipin'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '作者的视频账号',
      path: '/pages/shipin/shipin',
      imageUrl: ''
    }
  }
})
