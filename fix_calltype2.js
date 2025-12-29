const fs = require('fs');

const filePath = 'C:/Dev/ZyncIT/src/screens/main/CallDetailScreen.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace the entire callTypeIcon text section with Icon component
content = content.replace(
  /<Text style={styles\.callTypeIcon}>\s*\{call\.type === 'incoming'[\s\S]*?'â‌Œ'\}\s*<\/Text>/,
  `<Icon 
                name={call.type === 'incoming' ? 'arrow-down' : call.type === 'outgoing' ? 'arrow-up' : call.type === 'missed' ? 'close-circle' : 'close'}
                size={20}
                color={call.type === 'missed' ? '#FF3B30' : '#34C759'}
                style={styles.callTypeIcon}
              />`,
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done!');

// Verify
const verify = fs.readFileSync(filePath, 'utf8');
console.log('Has arrow-down:', verify.includes('arrow-down'));
