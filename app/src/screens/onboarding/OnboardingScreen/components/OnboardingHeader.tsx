import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles';

interface OnboardingHeaderProps {
  isRTL: boolean;
  selectedLanguage: 'ar' | 'en';
  colors: {
    border: string;
    surface: string;
    text: string;
  };
  onToggleLanguage: () => void;
}

const OnboardingHeader: React.FC<OnboardingHeaderProps> = ({
  isRTL,
  selectedLanguage,
  colors,
  onToggleLanguage,
}) => {
  return (
    <View
      style={[
        styles.header,
        { justifyContent: isRTL ? 'flex-start' : 'flex-end' },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.languageButton,
          { borderColor: colors.border, backgroundColor: colors.surface },
        ]}
        onPress={onToggleLanguage}
      >
        <Text style={styles.languageFlag}>
          {selectedLanguage === 'ar' ? '🇸🇦' : '🇺🇸'}
        </Text>
        <Text style={[styles.languageText, { color: colors.text }]}>
          {selectedLanguage === 'ar' ? 'عربي' : 'EN'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default OnboardingHeader;

