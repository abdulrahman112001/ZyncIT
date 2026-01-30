import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

export type OnboardingStackParamList = {
  Welcome: undefined;
  ThemeSelection: undefined;
  LanguageSelection: undefined;
  Permissions: undefined;
  Overview: undefined;
};

export interface OnboardingScreenProps {
  navigation: NativeStackNavigationProp<OnboardingStackParamList>;
}

export interface SlideData {
  id: string;
  title: string;
  titleAr: string;
  subtitle: string;
  subtitleAr: string;
  icon: string;
  image?: any;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface Permission {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  icon: string;
  required: boolean;
  granted: boolean;
}
