import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Permission } from '../types';

interface PermissionsStepProps {
  permissions: Permission[];
  isRTL: boolean;
  actualTheme: 'light' | 'dark';
  colors: {
    text: string;
    textSecondary: string;
    surface: string;
    surfaceSecondary: string;
    border: string;
    primary: string;
    success: string;
    error: string;
  };
  translate: (key: string) => string;
  onRequestPermission: (permissionId: string) => void;
}

const PermissionsStep: React.FC<PermissionsStepProps> = ({
  permissions,
  isRTL,
  colors,
  translate,
  onRequestPermission,
}) => {
  return (
    <View style={localStyles.container}>
      {/* Title Section */}
      <View style={localStyles.titleSection}>
        <Text style={[localStyles.title, { color: colors.text }]}>
          {translate('onboarding.permissions.title')}
        </Text>
        <Text style={[localStyles.subtitle, { color: colors.textSecondary }]}>
          {translate('onboarding.permissions.subtitle')}
        </Text>
      </View>

      {/* Permissions List */}
      <View style={localStyles.permissionsList}>
        {permissions.map(permission => {
          const isGranted = permission.granted;
          return (
            <View
              key={permission.id}
              style={[
                localStyles.permissionCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: isGranted ? colors.success : colors.border,
                },
              ]}
            >
              {/* Icon */}
              <View
                style={[
                  localStyles.iconContainer,
                  {
                    backgroundColor: isGranted
                      ? `${colors.success}20`
                      : `${colors.primary}15`,
                  },
                ]}
              >
                <Icon
                  name={isGranted ? 'checkmark-circle' : permission.icon}
                  size={28}
                  color={isGranted ? colors.success : colors.primary}
                />
              </View>

              {/* Info */}
              <View style={localStyles.infoContainer}>
                <Text
                  style={[localStyles.permissionName, { color: colors.text }]}
                >
                  {isRTL ? permission.nameAr : permission.name}
                  {permission.required && (
                    <Text style={{ color: colors.error }}> *</Text>
                  )}
                </Text>
                <Text
                  style={[
                    localStyles.permissionDesc,
                    { color: colors.textSecondary },
                  ]}
                  numberOfLines={2}
                >
                  {isRTL ? permission.descriptionAr : permission.description}
                </Text>
              </View>

              {/* Action Button */}
              {isGranted ? (
                <View
                  style={[
                    localStyles.grantedBadge,
                    { backgroundColor: colors.success },
                  ]}
                >
                  <Icon name="checkmark" size={18} color="#FFF" />
                </View>
              ) : (
                <TouchableOpacity
                  style={[
                    localStyles.grantButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={() => onRequestPermission(permission.id)}
                  activeOpacity={0.8}
                >
                  <Text style={localStyles.grantButtonText}>
                    {translate('onboarding.permissions.grant')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>

      {/* Info Note */}
      <View
        style={[
          localStyles.infoNote,
          { backgroundColor: `${colors.primary}10` },
        ]}
      >
        <Icon
          name="information-circle-outline"
          size={20}
          color={colors.primary}
        />
        <Text
          style={[localStyles.infoNoteText, { color: colors.textSecondary }]}
        >
          {isRTL
            ? 'يمكنك تغيير هذه الأذونات لاحقاً من الإعدادات'
            : 'You can change these permissions later in Settings'}
        </Text>
      </View>
    </View>
  );
};

const localStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  permissionsList: {
    gap: 12,
  },
  permissionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    flex: 1,
    marginHorizontal: 14,
  },
  permissionName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  permissionDesc: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.8,
  },
  grantedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grantButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  grantButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginTop: 20,
    gap: 10,
  },
  infoNoteText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});

export default PermissionsStep;
