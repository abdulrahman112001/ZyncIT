const fs = require('fs');

const filePath = 'C:/Dev/ZyncIT/src/screens/main/CallDetailScreen.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Remove duplicate videocam icons (keep only one)
content = content.replace(
  /<Icon name="videocam" size={24} color="#0A84FF" \/>\s*<Icon name="videocam" size={24} color="#0A84FF" \/>\s*<Icon name="videocam" size={24} color="#0A84FF" \/>/g,
  '<Icon name="videocam" size={24} color="#0A84FF" />',
);

// 2. Remove Voicemails tab
content = content.replace(
  /<TouchableOpacity style={styles\.tab}>\s*<Text style={styles\.tabText}>\s*\{isRTL \? 'البريد الصوتي' : 'Voicemails'\}\s*<\/Text>\s*<\/TouchableOpacity>/g,
  '',
);

// 3. Remove Block Contact section
content = content.replace(
  /\{\/\* Block Contact \*\/\}\s*<TouchableOpacity style={\[styles\.blockRow[^\}]*\}\]}?>\s*<Text style={styles\.blockText}>\s*\{isRTL \? 'حظر هذا المتصل' : 'Block this Caller'\}\s*<\/Text>\s*<\/TouchableOpacity>/g,
  '',
);

// 4. Fix any remaining corrupted icons
content = content.replace(/ًں•گ/g, '');
content = content.replace(/â€¹/g, '‹');
content = content.replace(/â€ڈ/g, '');

// 5. Remove blockRow and blockText styles if they exist (clean up)
// This is optional, styles won't cause issues if unused

fs.writeFileSync(filePath, content, 'utf8');
console.log('CallDetailScreen fixed!');
console.log('- Removed duplicate icons');
console.log('- Removed Voicemails tab');
console.log('- Removed Block Contact section');
