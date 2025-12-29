const fs = require('fs');
const path = 'C:/Dev/ZyncIT/src/screens/main/CallDetailScreen.tsx';
let content = fs.readFileSync(path, 'utf8');

// These are the corrupted patterns we need to find
const patterns = [
    [/طظظظƒطظظططھ/g, 'المكالمات'],
    [/طططظط/g, 'رسالة'],
    [/ططھطµطظ/g, 'اتصال'],
    [/ظپظٹطظٹظ/g, 'فيديو'],
    [/ططظٹط/g, 'بريد'],
    [/طظطھظپططµظٹظ/g, 'التفاصيل'],
    [/طظططظٹط طظطµظطھظٹ/g, 'البريد الصوتي'],
    [/ططظ طظظظƒطظظططھ/g, 'سجل المكالمات'],
    [/طظظططھظپ/g, 'الهاتف'],
    [/ظطظظظ/g, 'محمول'],
    [/ظطظظظ/g, 'محمول'],
    [/ططط ظطط طظظطھطµظ/g, 'حظر هذا المتصل'],
    [/آ/g, '']
];

for (const [pattern, replacement] of patterns) {
    content = content.replace(pattern, replacement);
}

fs.writeFileSync(path, content, 'utf8');
console.log('Done!');