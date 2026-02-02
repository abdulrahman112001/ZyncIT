import React from 'react';
import { View, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles } from './styles';
import { useOnboarding } from './useOnboarding';
import { t } from '../../../i18n';
import { Button } from '../../../components/common';
import {
  WelcomeStep,
  ThemeSelectionStep,
  LanguageSelectionStep,
  PermissionsStep,
  OverviewStep,
  SecurityStep,
  ProgressBar,
  OnboardingHeader,
} from './components';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const {
    currentStep,
    totalSteps,
    selectedTheme,
    actualTheme,
    selectedLanguage,
    permissions,
    isRTL,
    getColors,
    setSelectedTheme,
    setSelectedLanguage,
    goNext,
    goBack,
    skip,
    requestPermission,
    completeOnboarding,
    triggerHaptic,
  } = useOnboarding();

  const colors = getColors();

  // Helper function for translations based on selected language
  const translate = (key: string) => t(key, undefined, selectedLanguage);

  const handleComplete = async () => {
    const success = await completeOnboarding();
    if (success) {
      onComplete();
    }
  };

  // Render current step content
  const renderContent = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep colors={colors} translate={translate} />;
      case 1:
        return (
          <LanguageSelectionStep
            selectedLanguage={selectedLanguage}
            isRTL={isRTL}
            colors={colors}
            translate={translate}
            onSelectLanguage={setSelectedLanguage}
          />
        );
      case 2:
        return (
          <ThemeSelectionStep
            selectedTheme={selectedTheme}
            actualTheme={actualTheme}
            isRTL={isRTL}
            colors={colors}
            translate={translate}
            onSelectTheme={setSelectedTheme}
            triggerHaptic={triggerHaptic}
          />
        );
      case 3:
        return (
          <PermissionsStep
            permissions={permissions}
            isRTL={isRTL}
            actualTheme={actualTheme}
            colors={colors}
            translate={translate}
            onRequestPermission={requestPermission}
          />
        );
      case 4:
        return <OverviewStep colors={colors} translate={translate} />;
      case 5:
        return (
          <SecurityStep colors={colors} translate={translate} isRTL={isRTL} />
        );
      default:
        return null;
    }
  };

  // Get button text based on current step
  const getButtonText = () => {
    const isLastStep = currentStep === totalSteps - 1;
    if (currentStep === 0) return translate('onboarding.getStarted');
    if (currentStep === 1)
      return translate('onboarding.language.confirmLanguage');
    if (currentStep === 2) return translate('onboarding.theme.setAppearance');
    if (currentStep === 3) return translate('onboarding.permissions.continue');
    if (currentStep === 4) return translate('common.next');
    if (isLastStep) return translate('onboarding.overview.letsGo');
    return translate('common.next');
  };

  const isLastStep = currentStep === totalSteps - 1;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={actualTheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        {/* <OnboardingHeader
          isRTL={isRTL}
          selectedLanguage={selectedLanguage}
          colors={colors}
          onToggleLanguage={() => {
            triggerHaptic('selection');
            setSelectedLanguage(selectedLanguage === 'ar' ? 'en' : 'ar');
          }}
        /> */}

        {/* Content */}
        {renderContent()}

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          <ProgressBar
            currentStep={currentStep}
            totalSteps={totalSteps}
            colors={colors}
          />

          <Button
            title={getButtonText()}
            variant="primary"
            size="lg"
            fullWidth
            isDark={actualTheme === 'dark'}
            onPress={isLastStep ? handleComplete : goNext}
          />

          {currentStep > 0 && currentStep < totalSteps - 1 && (
            <View
              style={{
                flexDirection: isRTL ? 'row-reverse' : 'row',
                gap: 12,
                marginTop: 12,
              }}
            >
              <View style={{ flex: 1 }}>
                <Button
                  title={translate('common.previous')}
                  variant="outline"
                  size="md"
                  fullWidth
                  isDark={actualTheme === 'dark'}
                  onPress={goBack}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  title={translate('onboarding.skip')}
                  variant="ghost"
                  size="md"
                  fullWidth
                  isDark={actualTheme === 'dark'}
                  onPress={skip}
                />
              </View>
            </View>
          )}

          {currentStep === totalSteps - 1 && (
            <View style={{ marginTop: 12 }}>
              <Button
                title={translate('common.previous')}
                variant="outline"
                size="md"
                fullWidth
                isDark={actualTheme === 'dark'}
                onPress={goBack}
              />
            </View>
          )}
        </View>
      </SafeAreaView>
    </View>
  );
};

export default OnboardingScreen;
