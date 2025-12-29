const fs = require('fs');

const filePath = 'C:/Dev/ZyncIT/src/screens/main/ConversationScreen.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Add Ionicons import if not exists
if (
  !content.includes("import Icon from 'react-native-vector-icons/Ionicons'")
) {
  content = content.replace('import React,', 'import React,');
  content =
    "import Icon from 'react-native-vector-icons/Ionicons';\n" + content;
}

// Fix corrupted characters
// Back arrow
content = content.replace(/â€¹/g, '‹');
// Forward arrow
content = content.replace(/â€؛/g, '›');
// Bullet point
content = content.replace(/â€¢/g, '•');
// Checkmark - replace with text
content = content.replace(/âœ… Success/g, 'Success');
// X mark
content = content.replace(/â‌Œ Error/g, 'Error');
// Heart/send icon - replace with proper send
content = content.replace(
  /<Text style={styles\.sendButtonText}>â‍¤<\/Text>/g,
  '<Icon name="send" size={20} color="#FFFFFF" />',
);
content = content.replace(/â‍¤/g, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log('ConversationScreen fixed!');

// Verify
const verify = fs.readFileSync(filePath, 'utf8');
const bad = verify.match(/[â]/g);
console.log('Remaining corrupted:', bad ? bad.length : 0);
