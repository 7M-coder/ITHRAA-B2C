import { theme, type ThemeConfig } from 'antd'
/** Creates the Ithraa palette for the selected appearance. @param dark - Dark appearance. @returns Ant Design tokens. */
export function getThemeConfig(dark: boolean): ThemeConfig {
  return {
    algorithm: dark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: '#008186',
      colorSuccess: '#008186',
      colorInfo: '#008186',
      colorWarning: '#a6763c',
      colorError: '#b63744',
      fontFamily: 'var(--font-theme)',
      fontSize: 15,
      borderRadius: 12,
      colorBgBase: dark ? '#141f23' : '#f6f8f9',
      colorBgContainer: dark ? '#1c2b30' : '#ffffff',
      colorText: dark ? '#e8f0f1' : '#23363b',
      colorTextSecondary: dark ? '#afc1c6' : '#6d7f85',
      colorBorderSecondary: dark ? '#304349' : '#edf1f2',
      controlHeight: 42
    },
    components: {
      Card: { headerFontSize: 17, headerHeight: 62 },
      Menu: {
        itemBg: 'transparent',
        itemColor: '#e8f0f1',
        itemHoverBg: '#006e72',
        itemHoverColor: '#ffffff',
        itemSelectedBg: '#00b5a4',
        itemSelectedColor: '#003b3e',
        subMenuItemSelectedColor: '#003b3e',
        subMenuItemBg: 'transparent',
        itemHeight: 48
      },
      Table: {
        headerBg: dark ? '#23373d' : '#f8fafb',
        headerColor: dark ? '#c5d8dc' : '#72858b',
        fontSize: 14
      },
      Button: { primaryShadow: 'none' }
    }
  }
}
