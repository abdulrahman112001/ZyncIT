const fs = require('fs');

const filePath = 'C:/Dev/ZyncIT/src/screens/main/ConversationScreen.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Fix MessageBubble props - it now receives more color props
const oldProps = `const MessageBubble = ({
  item,
  onDelete,
  isRTL,
  isDarkMode,
}: {
  item: AppNotification;
  onDelete: (id: string) => void;
  isRTL: boolean;
  isDarkMode: boolean;
})`;

const newProps = `const MessageBubble = ({
  item,
  onDelete,
  isRTL,
  textColor,
  secondaryTextColor,
  bubbleColor,
}: {
  item: AppNotification;
  onDelete: (id: string) => void;
  isRTL: boolean;
  textColor: string;
  secondaryTextColor: string;
  bubbleColor: string;
})`;

content = content.replace(oldProps, newProps);

// Remove the color definitions inside MessageBubble since they're now passed as props
content = content.replace(
  /\/\/ Theme colors\s*\n\s*const textColor = isDarkMode[^;]+;\s*\n\s*const secondaryTextColor = isDarkMode[^;]+;\s*\n\s*const bubbleColor = isDarkMode[^;]+;\s*\n/g,
  '',
);

// Fix delete icon - replace corrupted emoji
content = content.replace(/ًں—'ï¸ڈ/g, '');
content = content.replace(
  /<Text style={styles\.deleteIcon}>[^<]*<\/Text>/g,
  '<Icon name="trash" size={24} color="#FF3B30" />',
);

// Fix send button if it's empty
content = content.replace(
  /<Text style={styles\.sendIcon}>\{isSending \? '\.\.\.' : ''\}<\/Text>/g,
  '<Icon name="send" size={20} color="#FFFFFF" />',
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('ConversationScreen Dark/Light Mode fixed!');
