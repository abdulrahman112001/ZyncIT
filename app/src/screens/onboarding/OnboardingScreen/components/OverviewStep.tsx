import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { styles } from '../styles';

interface Feature {
  iconName: string;
  title: string;
  description: string;
}

interface OverviewStepProps {
  colors: {
    text: string;
    textSecondary: string;
    primary: string;
  };
  translate: (key: string) => string;
}

const OverviewStep: React.FC<OverviewStepProps> = ({ colors, translate }) => {
  const features: Feature[] = [
    {
      iconName: 'chatbubbles',
      title: translate('onboarding.overview.messageSync'),
      description: translate('onboarding.overview.messageSyncDesc'),
    },
    {
      iconName: 'call',
      title: translate('onboarding.overview.callHistory'),
      description: translate('onboarding.overview.callHistoryDesc'),
    },
    {
      iconName: 'notifications',
      title: translate('onboarding.overview.smartNotifications'),
      description: translate('onboarding.overview.smartNotificationsDesc'),
    },
    {
      iconName: 'shield-checkmark',
      title: translate('onboarding.overview.security'),
      description: translate('onboarding.overview.securityDesc'),
    },
  ];

  return (
    <View style={styles.overviewContainer}>
      <View style={[styles.titleSection,]}>
        <Text style={[styles.title, { color: colors.text }]}>
          {translate('onboarding.overview.title')}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {translate('onboarding.overview.subtitle')}
        </Text>
      </View>

      <ScrollView
        style={styles.overviewContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {features.map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <View
              style={[
                styles.featureIcon,
                { backgroundColor: `${colors.primary}15` },
              ]}
            >
              <Icon name={feature.iconName} size={28} color={colors.primary} />
            </View>
            <View style={styles.featureInfo}>
              <Text style={[styles.featureTitle, { color: colors.text }]}>
                {feature.title}
              </Text>
              <Text
                style={[
                  styles.featureDescription,
                  { color: colors.textSecondary },
                ]}
              >
                {feature.description}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default OverviewStep;
