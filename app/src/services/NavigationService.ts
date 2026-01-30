/**
 * NavigationService
 * Navigation service for navigating from outside React components
 */

import {
  createNavigationContainerRef,
  CommonActions,
  StackActions,
  NavigationAction,
  ParamListBase,
} from '@react-navigation/native';

// Create navigation ref
export const navigationRef = createNavigationContainerRef<ParamListBase>();

/**
 * Check if navigation is ready
 */
export const isNavigationReady = (): boolean => {
  return navigationRef.isReady();
};

/**
 * Wait for navigation to be ready
 */
export const waitForNavigation = (): Promise<void> => {
  return new Promise(resolve => {
    const checkReady = () => {
      if (navigationRef.isReady()) {
        resolve();
      } else {
        setTimeout(checkReady, 50);
      }
    };
    checkReady();
  });
};

/**
 * Navigate to a screen
 */
export const navigate = <T extends ParamListBase>(
  name: keyof T,
  params?: T[keyof T],
): void => {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name as string, params);
  } else {
    console.warn('Navigation is not ready yet');
  }
};

/**
 * Navigate and reset the navigation state
 */
export const navigateAndReset = <T extends ParamListBase>(
  name: keyof T,
  params?: T[keyof T],
): void => {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: name as string, params }],
      }),
    );
  }
};

/**
 * Go back to previous screen
 */
export const goBack = (): void => {
  if (navigationRef.isReady() && navigationRef.canGoBack()) {
    navigationRef.goBack();
  }
};

/**
 * Check if can go back
 */
export const canGoBack = (): boolean => {
  return navigationRef.isReady() && navigationRef.canGoBack();
};

/**
 * Push a new screen onto the stack
 */
export const push = <T extends ParamListBase>(
  name: keyof T,
  params?: T[keyof T],
): void => {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(StackActions.push(name as string, params));
  }
};

/**
 * Pop screens from the stack
 */
export const pop = (count: number = 1): void => {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(StackActions.pop(count));
  }
};

/**
 * Pop to the top of the stack
 */
export const popToTop = (): void => {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(StackActions.popToTop());
  }
};

/**
 * Replace current screen
 */
export const replace = <T extends ParamListBase>(
  name: keyof T,
  params?: T[keyof T],
): void => {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(StackActions.replace(name as string, params));
  }
};

/**
 * Reset navigation state with multiple routes
 */
export const reset = (
  routes: Array<{ name: string; params?: object }>,
  index?: number,
): void => {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(
      CommonActions.reset({
        index: index ?? routes.length - 1,
        routes,
      }),
    );
  }
};

/**
 * Dispatch a custom navigation action
 */
export const dispatch = (action: NavigationAction): void => {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(action);
  }
};

/**
 * Get current route name
 */
export const getCurrentRouteName = (): string | undefined => {
  if (navigationRef.isReady()) {
    return navigationRef.getCurrentRoute()?.name;
  }
  return undefined;
};

/**
 * Get current route params
 */
export const getCurrentRouteParams = <T = object>(): T | undefined => {
  if (navigationRef.isReady()) {
    return navigationRef.getCurrentRoute()?.params as T | undefined;
  }
  return undefined;
};

/**
 * Get navigation state
 */
export const getState = () => {
  if (navigationRef.isReady()) {
    return navigationRef.getState();
  }
  return undefined;
};

/**
 * Set params for current screen
 */
export const setParams = <T extends object>(params: T): void => {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(CommonActions.setParams(params));
  }
};

// Default export
const NavigationService = {
  navigationRef,
  isNavigationReady,
  waitForNavigation,
  navigate,
  navigateAndReset,
  goBack,
  canGoBack,
  push,
  pop,
  popToTop,
  replace,
  reset,
  dispatch,
  getCurrentRouteName,
  getCurrentRouteParams,
  getState,
  setParams,
};

export default NavigationService;
