/* 
for reference: https://ant.design/docs/react/customize-theme
*/
import { theme } from 'antd'
import type { ThemeConfig } from 'antd'

// Common token settings for both themes
const commonTokens = {
  borderRadius: 10,
  fontFamily: 'var(--font-theme)',
  fontWeightStrong: 900,
  fontWeightMedium: 600,
  fontWeightLight: 300,
  colorPrimary: '#3A608F'
}

// Light theme configuration
export const lightTheme: ThemeConfig = {
  algorithm: theme.defaultAlgorithm,
  token: {
    ...commonTokens,
    colorBgBase: '#f5f5f5',
    colorBgContainer: '#ffffff',
    colorTextBase: '#050505',
    colorText: '#050505',
    colorTextHeading: '#050505',
    colorTextDescription: '#a9a8a8',
    colorTextSecondary: '#a9a8a8',
    colorTextDisabled: '#a9a8a8',
    colorTextPlaceholder: '#a9a8a8',
    colorLink: '#256489',
    colorSuccess: '#2c775d',
    colorSuccessText: '#2c775d',
    colorSuccessBg: '#E1F4ED',
    colorSuccessBorder: '#C8E6D6',
    colorError: '#a9000e',
    colorErrorText: '#a9000e',
    colorErrorBg: '#F7E1E1',
    colorErrorBorder: '#F0D0D0',
    colorWarning: '#c0722a',
    colorWarningText: '#c0722a',
    colorWarningBg: '#FBF3E8',
    colorWarningBorder: '#F0E4D0',
    colorInfo: '#396689',
    colorInfoText: '#396689',
    colorInfoBg: '#E0ECFA',
    colorInfoBorder: '#CCE0F4'
  }
}

// Dark theme configuration
export const darkTheme: ThemeConfig = {
  algorithm: theme.darkAlgorithm,
  token: {
    ...commonTokens,
    colorBgBase: '#191c20',
    colorBgContainer: '#212326',
    colorTextBase: '#fefefe',
    colorText: '#fefefe',
    colorTextHeading: '#fefefe',
    colorTextDescription: '#a9a8a8',
    colorTextSecondary: '#a9a8a8',
    colorTextDisabled: '#a9a8a8',
    colorTextPlaceholder: '#a9a8a8',
    colorLink: '#3082b1',
    colorSuccess: '#138a60',
    colorError: '#c00011',
    colorWarning: '#d4974a',
    colorInfo: '#5a9bcf'
  }
}

/**
 * Returns the appropriate Ant Design theme configuration based on dark mode preference
 * @param {boolean} isDark - Whether dark mode is enabled
 * @returns {ThemeConfig} The corresponding theme configuration
 */
export const getThemeConfig = (isDark: boolean): ThemeConfig => {
  return isDark ? darkTheme : lightTheme
}
