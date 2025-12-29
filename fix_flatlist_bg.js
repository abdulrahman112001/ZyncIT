const fs = require('fs');

const filePath = 'C:/Dev/ZyncIT/src/screens/main/ConversationScreen.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Fix 1: Add backgroundColor to FlatList
content = content.replace(
  /contentContainerStyle={\[\s*styles\.listContent,\s*\{ paddingBottom: isSMSType \? 20 : 20 \},\s*\]}/g,
  `style={{ flex: 1, backgroundColor: bgColor }}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: isSMSType ? 20 : 20 },
        ]}`,
);

// Fix 2: Fix bubble colors - make sure bubbles have proper colors for light mode
// Find and update the bubbleColor in main component
content = content.replace(
  /const bubbleColor = isDarkMode \? '#2C2C2E' : '#E5E5EA';/g,
  "const bubbleColor = isDarkMode ? '#2C2C2E' : '#E8E8ED';",
);

// Fix 3: Update deleteBackground style to use theme color
content = content.replace(
  /deleteBackground: {\s*position: 'absolute',\s*top: 0,\s*bottom: 0,\s*width: '100%',\s*backgroundColor: '[^']+',/g,
  `deleteBackground: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '100%',
    backgroundColor: '#FF3B30',`,
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('FlatList background fixed!');

// Verify
const verify = fs.readFileSync(filePath, 'utf8');
console.log(
  'Has bgColor in FlatList:',
  verify.includes('backgroundColor: bgColor'),
);
