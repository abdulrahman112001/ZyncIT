const fs = require('fs');

const filePath = 'C:/Dev/ZyncIT/src/screens/main/CallDetailScreen.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Fix corrupted chevron - replace with Icon
content = content.replace(
  /<Text style={\[styles\.menuChevron[^}]*\]}>[^<]*<\/Text>/g,
  '<Icon name="chevron-forward" size={20} color={secondaryTextColor} />',
);

// Also fix any other corrupted characters
content = content.replace(/â€؛/g, '›');
content = content.replace(/â€¹/g, '‹');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Chevron fixed!');

// Verify
const verify = fs.readFileSync(filePath, 'utf8');
console.log('Has chevron-forward:', verify.includes('chevron-forward'));
