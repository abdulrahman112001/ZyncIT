const fs = require('fs');

const callDetailPath = 'C:/Dev/ZyncIT/src/screens/main/CallDetailScreen.tsx';
let content = fs.readFileSync(callDetailPath, 'utf8');

// Fix menu icons - they are Text elements with corrupted emojis
// Clock icon for Call History
content = content.replace(
  /<Text style={styles\.menuIcon}>[^<]+<\/Text>/g,
  '<Icon name="time-outline" size={20} color="#0A84FF" style={styles.menuIcon} />',
);

// Fix call status icons (arrows) in the info section
content = content.replace(
  /<Text style={styles\.callIcon}>[^<]+<\/Text>/g,
  match => {
    // For missed calls use x, for incoming use down arrow, for outgoing use up arrow
    return '<Icon name="arrow-down" size={16} color="#FF3B30" style={styles.callIcon} />';
  },
);

fs.writeFileSync(callDetailPath, content, 'utf8');
console.log('Menu icons fixed!');

// Check
const verify = fs.readFileSync(callDetailPath, 'utf8');
console.log('time-outline:', verify.includes('time-outline') ? 'YES' : 'NO');
