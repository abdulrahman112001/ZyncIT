export interface SettingsScreenProps {
  navigation: any;
}

export interface SettingSwitchProps {
  title: string;
  subtitle?: string;
  value: boolean;
  settingKey: string;
}

export interface SettingOptionProps {
  title: string;
  value: string;
  onPress: () => void;
}
