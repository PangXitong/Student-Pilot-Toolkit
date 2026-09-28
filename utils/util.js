const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

/**
 * 带备份域名链的 wx.request 封装
 * 域名尝试顺序: ot7atswad4sr.ngrok.xiaomiqiu123.top → icao.oldsai.cn → icao.iepose.cn:443
 * @param {string} path - 相对路径，如 "/dictionary.json" 或 "/text.json"
 * @param {object} options - wx.request 的 options (method, success, fail 等)
 */
const requestWithFallback = (path, options) => {
  const origins = [
    'https://ot7atswad4sr.ngrok.xiaomiqiu123.top',
    'https://icao.iepose.cn/',
    'https://icao.oldsai.cn',
    'https://oldsai.kooldns.cn:443'
  ]
  const total = origins.length
  let current = 0

  const tryNext = () => {
    if (current >= total) {
      // 所有域名都失败
      if (options.fail) {
        options.fail({ errMsg: '所有备份域名均不可用' })
      }
      return
    }

    const baseUrl = origins[current]
    const url = baseUrl + path

    wx.request({
      url: url,
      method: options.method || 'GET',
      data: options.data,
      header: options.header,
      timeout: options.timeout || 15000,
      success: (res) => {
        if (res.statusCode === 200) {
          if (options.success) options.success(res)
        } else {
          // 非 200 状态码 → 继续尝试下一个域名
          current++
          tryNext()
        }
      },
      fail: () => {
        // 网络错误 → 继续尝试下一个域名
        current++
        tryNext()
      }
    })
  }

  tryNext()
}

module.exports = {
  formatTime,
  requestWithFallback
}
