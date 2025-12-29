const fs = require('fs');

const callDetailPath = 'C:/Dev/ZyncIT/src/screens/main/CallDetailScreen.tsx';
let content = fs.readFileSync(callDetailPath, 'utf8');

// Replace all corrupted action icons with Ionicons
// Pattern: <Text style={styles.actionIcon}>CORRUPTED</Text>
content = content.replace(
  /<Text style={styles\.actionIcon}>[^<]+<\/Text>/g,
  (match, offset) => {
    // Find which action this is by looking at the context
    const before = content.substring(Math.max(0, offset - 200), offset);
    if (before.includes('handleMessage')) {
      return '<Icon name="chatbubble" size={24} color="#0A84FF" />';
    } else if (before.includes('handleCall')) {
      return '<Icon name="call" size={24} color="#0A84FF" />';
    } else if (before.includes('handleVideo')) {
      return '<Icon name="videocam" size={24} color="#0A84FF" />';
    } else if (before.includes('handleEmail')) {
      return '<Icon name="mail" size={24} color="#0A84FF" />';
    }
    return match;
  },
);

fs.writeFileSync(callDetailPath, content, 'utf8');
console.log('Done!');

// Check results
const verify = fs.readFileSync(callDetailPath, 'utf8');
const icons = verify.match(/<Icon name="[^"]+"/g);
console.log('Icons found:', icons);
