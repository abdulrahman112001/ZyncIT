import { StyleSheet } from 'react-native';

export const ACTION_WIDTH = 75;

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 8,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterIcon: {
    fontSize: 18,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerSpacer: {
    width: 36,
  },
  headerButtonText: {
    fontSize: 17,
    fontWeight: '400',
  },
  deleteSelectedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  deleteSelectedText: {
    color: '#FF3B30',
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '600',
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    height: 36,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  clearIcon: {
    fontSize: 16,
    padding: 4,
  },
  listContent: {
    flexGrow: 1,
  },
  swipeContainer: {
    position: 'relative',
  },
  actionsContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  actionsLeft: {
    left: 0,
  },
  actionsRight: {
    right: 0,
  },
  actionButton: {
    width: ACTION_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  muteButton: {
    backgroundColor: '#5856D6',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  actionIcon: {
    fontSize: 24,
  },
  messageRow: {},
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowContentRTL: {
    flexDirection: 'row-reverse',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatarContainerRTL: {
    marginRight: 0,
    marginLeft: 12,
  },
  checkboxContainer: {
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxContainerRTL: {
    marginRight: 0,
    marginLeft: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#8E8E93',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  checkboxSelected: {
    backgroundColor: '#0A84FF',
    borderColor: '#0A84FF',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '500',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#0A84FF',
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#000000',
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  messageContent: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  topRowRTL: {
    flexDirection: 'row-reverse',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  titleRowRTL: {
    flexDirection: 'row-reverse',
  },
  senderName: {
    fontSize: 17,
    fontWeight: '600',
    flex: 1,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 15,
  },
  chevron: {
    fontSize: 18,
    marginLeft: 4,
    fontWeight: '300',
  },
  previewText: {
    fontSize: 15,
    lineHeight: 20,
  },
  separator: {
    height: 0.5,
  },
  separatorLTR: {
    marginLeft: 84,
  },
  separatorRTL: {
    marginRight: 84,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  enableButton: {
    backgroundColor: '#0A84FF',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  enableButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});
