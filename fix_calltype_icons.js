const fs = require('fs');

const filePath = 'C:/Dev/ZyncIT/src/screens/main/CallDetailScreen.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Fix call type icons section - replace with Ionicons
const oldSection = `<Text style={styles.callTypeIcon}>
                {call.type === 'incoming'
                  ? 'â†™ï¸ڈ'
                  : call.type === 'outgoing'
                  ? 'â†—ï¸ڈ'
                  : call.type === 'missed'
                  ? 'ًں"µ'
                  : 'â‌Œ'}
              </Text>`;

const newSection = `<Icon 
                name={call.type === 'incoming' ? 'arrow-down' : call.type === 'outgoing' ? 'arrow-up' : call.type === 'missed' ? 'close-circle' : 'close'}
                size={20}
                color={call.type === 'missed' ? '#FF3B30' : '#34C759'}
                style={styles.callTypeIcon}
              />`;

content = content.replace(oldSection, newSection);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Call type icons fixed!');

// Verify
const verify = fs.readFileSync(filePath, 'utf8');
console.log('Arrow icons:', verify.includes('arrow-down') ? 'OK' : 'NOT FOUND');
