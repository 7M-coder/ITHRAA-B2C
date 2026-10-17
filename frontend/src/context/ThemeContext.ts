import { createContext } from 'react'
export const ThemeContext = createContext<
  { isDarkMode: boolean; toggleTheme: () => void } | undefined
>(undefined)
