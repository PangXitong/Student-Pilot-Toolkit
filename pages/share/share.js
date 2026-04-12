// share.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    shareLink: 'example.com'
  },

  /**
   * 下载图片
   */
  downloadImage(e) {
    const imageUrl = e.currentTarget.dataset.image;
    
    // 检查是否为本地图片路径
    if (imageUrl.startsWith('../')) {
      // 对于本地图片，使用getImageInfo获取图片信息后再保存
      wx.getImageInfo({
        src: imageUrl,
        success: function(res) {
          console.log('获取图片信息成功:', res);
          // 使用获取到的临时路径保存图片
          wx.saveImageToPhotosAlbum({
            filePath: res.path,
            success: function() {
              wx.showToast({
                title: '图片已保存到相册',
                icon: 'success'
              });
            },
            fail: function(res) {
              console.log('保存失败:', res);
              if (res.errMsg.includes('no permission')) {
                wx.showToast({
                  title: '保存失败，请检查权限',
                  icon: 'none'
                });
              } else {
                wx.showToast({
                  title: '保存失败',
                  icon: 'none'
                });
              }
            }
          });
        },
        fail: function(res) {
          console.log('获取图片信息失败:', res);
          // 尝试直接保存
          wx.saveImageToPhotosAlbum({
            filePath: imageUrl,
            success: function() {
              wx.showToast({
                title: '图片已保存到相册',
                icon: 'success'
              });
            },
            fail: function(res) {
              console.log('直接保存失败:', res);
              if (res.errMsg.includes('no permission')) {
                wx.showToast({
                  title: '保存失败，请检查权限',
                  icon: 'none'
                });
              } else {
                wx.showToast({
                  title: '保存失败',
                  icon: 'none'
                });
              }
            }
          });
        }
      });
    } else {
      // 对于网络图片，使用下载API
      wx.downloadFile({
        url: imageUrl,
        success: function(res) {
          if (res.statusCode === 200) {
            wx.saveImageToPhotosAlbum({
              filePath: res.tempFilePath,
              success: function() {
                wx.showToast({
                  title: '图片已保存到相册',
                  icon: 'success'
                });
              },
              fail: function() {
                wx.showToast({
                  title: '保存失败，请检查权限',
                  icon: 'none'
                });
              }
            });
          }
        },
        fail: function() {
          wx.showToast({
            title: '下载失败',
            icon: 'none'
          });
        }
      });
    }
  },

  /**
   * 复制链接
   */
  copyLink() {
    const link = this.data.shareLink;
    wx.setClipboardData({
      data: link,
      success: function() {
        wx.showToast({
          title: '链接已复制',
          icon: 'success'
        });
      },
      fail: function() {
        wx.showToast({
          title: '复制失败',
          icon: 'none'
        });
      }
    });
  },

  /**
   * 返回首页
   */
  goBack() {
    wx.navigateBack({
      delta: 1
    });
  },

  // ---------- 分享功能 ----------
  onShareAppMessage() {
    return {
      title: '分享页面',
      path: '/pages/share/share',
      imageUrl: '',
    };
  },

  onShareTimeline() {
    return {
      title: '分享页面',
      query: '',
      imageUrl: '',
    };
  },
});