/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#4CAF50'; // Light green
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#1B5E20', // dark green for text
    background: '#E8F5E9', // very light green background
    tint: tintColorLight,
    icon: '#388E3C', // medium green for icons
    tabIconDefault: '#A5D6A7', // light green for default tab
    tabIconSelected: tintColorLight,
    button: '#66BB6A', // button green
    buttonText: '#fff',
    inputBackground: '#C8E6C9',
    inputBorder: '#A5D6A7',
    error: '#D32F2F',
    primary: '#4CAF50', // primary green
    secondary: '#81C784', // secondary green
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    button: '#388E3C',
    buttonText: '#fff',
    inputBackground: '#263238',
    inputBorder: '#388E3C',
    error: '#EF9A9A',
    primary: '#4CAF50', // primary green
    secondary: '#81C784', // secondary green
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
