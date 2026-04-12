// jszip-wrapper.js - 统一 JSZip 在微信小程序中的引入方式
// 使用 globalThis 确保在所有环境中都能正确设置polyfill
if (typeof globalThis.setImmediate === 'undefined') {
  globalThis.setImmediate = function(fn) { return setTimeout(fn, 0); };
}
if (typeof globalThis.clearImmediate === 'undefined') {
  globalThis.clearImmediate = function(id) { clearTimeout(id); };
}

var _r = require('./jszip.min.js');
function findJSZip(obj) {
  if (!obj || typeof obj !== 'object') return null;
  if (typeof obj.loadAsync === 'function') return obj;
  if (obj.default) return findJSZip(obj.default);
  for (var k in obj) {
    if (obj[k] && typeof obj[k] === 'object') {
      var f = findJSZip(obj[k]);
      if (f) return f;
    }
  }
  return null;
}
var J = findJSZip(_r) || _r;
module.exports = J;
