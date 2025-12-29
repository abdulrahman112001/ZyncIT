const fs = require('fs');
const path = 'C:/Dev/ZyncIT/src/screens/main/CallDetailScreen.tsx';
let content = fs.readFileSync(path, 'utf8');

const fixes = {
    'طظظظƒطظظططھ': 'المكالمات',
    'طططظط': 'رسالة',
    'ططھطµطظ': 'اتصال',
    'ظپظٹطظٹظ': 'فيديو',
    'ططظٹط': 'بريد',
    'طظطھظپططµظٹظ': 'التفاصيل',
    'طظططظٹط طظطµظطھظٹ': 'البريد الصوتي',
    'ططظ طظظظƒطظظططھ': 'سجل المكالمات',
    'طظظططھظپ': 'الهاتف',
    'ظطظظظ': 'محمول',
    'ظطظظظ': 'محمول',
    'ططط ظطط طظظطھطµظ': 'حظر هذا المتصل',
    'Today آ': 'Today ',
    'Yesterday آ': 'Yesterday ',
    'آ': ''
};

for (const [bad, good] of Object.entries(fixes)) {
    content = content.split(bad).join(good);
}

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed!');
