import { StyleSheet } from 'react-native';
import { COLORS } from '../../../theme/colors';
import { SPACING, RADIUS } from '../../../theme/spacing';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  email: {
    fontWeight: '500',
    fontSize: 18,
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
  },
  signOutText: {
    fontWeight: '500',
    fontSize: 16,
    color: COLORS.error,
    marginLeft: SPACING.sm,
  },
});
