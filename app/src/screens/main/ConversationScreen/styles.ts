import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    backgroundColor: '#000000',
    borderBottomWidth: 0.5,
    borderBottomColor: '#38383A',
  },
  backButton: {
    position: 'absolute',
    left: 8,
    top: 44,
    padding: 8,
    zIndex: 10,
  },
  backIcon: {
    color: '#0A84FF',
    fontSize: 40,
    fontWeight: '300',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3A3A3C',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerAvatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '500',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  headerName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  headerChevron: {
    color: '#8E8E93',
    fontSize: 18,
    marginLeft: 2,
  },
  headerSubtitle: {
    color: '#8E8E93',
    fontSize: 13,
  },
  listContent: {
    padding: 16,
  },
  bubbleContainer: {
    marginBottom: 16,
  },
  deleteBackground: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 100,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 18,
  },
  deleteIcon: {
    fontSize: 24,
  },
  bubbleWrapper: {
    // backgroundColor is set dynamically via bgColor prop
  },
  timeLabel: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  bubble: {
    // backgroundColor is set dynamically via bubbleColor prop
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '85%',
    alignSelf: 'flex-start',
  },
  bubbleSent: {
    alignSelf: 'flex-end',
  },
  timeRight: {
    textAlign: 'right',
  },
  bubbleText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 22,
  },
  linkText: {
    color: '#0A84FF',
    textDecorationLine: 'underline',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: 34,
    backgroundColor: '#000000',
    borderTopWidth: 0.5,
    borderTopColor: '#38383A',
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: '#38383A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    minHeight: 40,
    maxHeight: 100,
    marginRight: 10,
  },
  input: {
    color: '#FFFFFF',
    fontSize: 16,
    padding: 0,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0A84FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#3A3A3C',
  },
  sendIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
