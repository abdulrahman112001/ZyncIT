const fs = require('fs');

const filePath = 'C:/Dev/ZyncIT/src/screens/main/CallDetailScreen.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace the Call History button with an inline list showing the call history
const oldSection = `{/* Call History Section */}
        <TouchableOpacity style={[styles.menuRow, { backgroundColor: surfaceColor }]}>
          <Icon name="time-outline" size={20} color="#0A84FF" style={styles.menuIcon} />
          <Text style={[styles.menuText, { color: textColor }]}>
            {isRTL ? 'سجل المكالمات' : 'Call History'}
          </Text>
          <Text style={[styles.menuChevron, { color: secondaryTextColor }]}>›</Text>
        </TouchableOpacity>`;

const newSection = `{/* Call History Section */}
        <View style={[styles.section, { backgroundColor: surfaceColor }]}>
          <View style={styles.sectionHeader}>
            <Icon name="time-outline" size={20} color="#0A84FF" />
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              {isRTL ? 'سجل المكالمات' : 'Call History'}
            </Text>
          </View>
          
          {/* Current Call Entry */}
          <View style={styles.historyItem}>
            <Icon 
              name={call.type === 'incoming' ? 'arrow-down' : call.type === 'outgoing' ? 'arrow-up' : 'close-circle'}
              size={18}
              color={call.type === 'missed' ? '#FF3B30' : '#34C759'}
            />
            <View style={styles.historyInfo}>
              <Text style={[styles.historyType, { color: textColor }]}>
                {getCallTypeLabel(call.type)}
              </Text>
              <Text style={[styles.historyTime, { color: secondaryTextColor }]}>
                {formatDateTime(call.timestamp)}
                {call.duration > 0 ? \` · \${formatDuration(call.duration)}\` : ''}
              </Text>
            </View>
          </View>
        </View>`;

content = content.replace(oldSection, newSection);

// Add new styles for history items
const stylesIndex = content.indexOf('const styles = StyleSheet.create({');
if (stylesIndex !== -1) {
  // Find the end of styles object to add new styles before it
  const endIndex = content.lastIndexOf('});');

  const newStyles = `
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyType: {
    fontSize: 15,
    fontWeight: '500',
  },
  historyTime: {
    fontSize: 13,
    marginTop: 2,
  },`;

  // Check if styles already exist
  if (!content.includes('sectionHeader:')) {
    content =
      content.slice(0, endIndex) + newStyles + '\n' + content.slice(endIndex);
  }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Call History section updated to show inline!');
