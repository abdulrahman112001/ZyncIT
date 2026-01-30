export interface MenuScreenProps {
  navigation: any;
}

export interface MenuItem {
  icon: string;
  title: string;
  subtitle?: string;
  danger?: boolean;
  iconColor?: string;
  isSwitch?: boolean;
  value?: boolean;
  settingKey?: string;
  onPress?: () => void;
}

export interface MenuSection {
  title: string;
  items: MenuItem[];
}
