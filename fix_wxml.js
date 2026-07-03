const fs = require('fs');
const path = 'pages/PEPEC/PEPEC.wxml';
let content = fs.readFileSync(path, 'utf-8');

content = content.replace(
  'wx:if="{{currentIndex === index && isPlaying}}"',
  'wx:if="{{(audioList[currentIndex] && audioList[currentIndex].name === item.name) && isPlaying}}"'
);

fs.writeFileSync(path, content, 'utf-8');
console.log('修复完成');
