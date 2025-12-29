const fs = require('fs');

const filePath = 'C:/Dev/ZyncIT/src/screens/main/ConversationScreen.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Fix 1: Add secondaryTextColor to MessageBubble props
content = content.replace(
  /const MessageBubble = \(\{\s*item,\s*onDelete,\s*isRTL,\s*\}: \{\s*item: AppNotification;\s*onDelete: \(id: string\) => void;\s*isRTL: boolean;\s*\}\)/,
  `const MessageBubble = ({
  item,
  onDelete,
  isRTL,
  isDarkMode,
}: {
  item: AppNotification;
  onDelete: (id: string) => void;
  isRTL: boolean;
  isDarkMode: boolean;
})`,
);

// Fix 2: Add color definitions inside MessageBubble
const bubbleStart = content.indexOf('const MessageBubble = ({');
const translateXLine = content.indexOf(
  'const translateX = useRef',
  bubbleStart,
);
if (translateXLine !== -1) {
  const colorDefs = `
  // Theme colors
  const textColor = isDarkMode ? '#FFFFFF' : '#000000';
  const secondaryTextColor = isDarkMode ? '#8E8E93' : '#6C6C70';
  const bubbleColor = isDarkMode ? '#1C1C1E' : '#E5E5EA';

  `;
  content =
    content.slice(0, translateXLine) +
    colorDefs +
    content.slice(translateXLine);
}

// Fix 3: Update MessageBubble usage to pass isDarkMode
content = content.replace(
  /<MessageBubble\s+item=\{item\}\s+onDelete=\{handleDeleteNotification\}\s+isRTL=\{isRTL\}\s*\/>/g,
  '<MessageBubble item={item} onDelete={handleDeleteNotification} isRTL={isRTL} isDarkMode={isDarkMode} />',
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('ConversationScreen fixed!');

// Verify
const verify = fs.readFileSync(filePath, 'utf8');
console.log('Has isDarkMode prop:', verify.includes('isDarkMode: boolean'));
console.log(
  'Has secondaryTextColor def:',
  verify.includes('const secondaryTextColor'),
);
