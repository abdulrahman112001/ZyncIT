import React from 'react';
import { View, Text } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { styles } from '../styles';

interface WelcomeStepProps {
  colors: {
    primary: string;
    textSecondary: string;
  };
  translate: (key: string) => string;
}

const WelcomeStep: React.FC<WelcomeStepProps> = ({ colors, translate }) => {
  return (
    <View style={styles.content}>
      <View
        style={[
          styles.welcomeIconContainer,
          { backgroundColor: `${colors.primary}15` },
        ]}
      >
        <Icon name="sync-circle" size={80} color={colors.primary} />
      </View>

      <View style={styles.titleSection}>
        <Text style={[styles.appName, { color: colors.primary }]}>iRopit</Text>
        <Text style={[styles.tagline, { color: colors.textSecondary }]}>
          {translate('onboarding.welcomeSubtitle')}
        </Text>
      </View>
    </View>
  );
};

export default WelcomeStep;
