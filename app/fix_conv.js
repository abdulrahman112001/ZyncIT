const fs = require('fs');
const path = 'C:/Dev/ZyncIT/src/screens/main/ConversationScreen.tsx';
let content = fs.readFileSync(path, 'utf8');

const fixes = {
    'طظƒطھط طططظط...': 'اكتب رسالة...',
    'طظƒطھط طططظط': 'اكتب رسالة',
    'ططططظ': 'إرسال'
};

for (const [bad, good] of Object.entries(fixes)) {
    content = content.split(bad).join(good);
}

fs.writeFileSync(path, content, 'utf8');
console.log('ConversationScreen Fixed!');
