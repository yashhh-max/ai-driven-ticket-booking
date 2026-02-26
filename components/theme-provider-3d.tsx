'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

export type ThemeMode = 'dark' | 'neon' | 'ocean' | 'nature' | 'sunset'

export interface Theme {
  name: ThemeMode
  colors: {
    primary: string
    secondary: string
    accent: string
    success: string
    warning: string
    error: string
    background: string
    foreground: string
    muted: string
    border: string
    // 3D colors
    particleColor: string
    lightColor1: string
    lightColor2: string
    lightColor3: string
    glowColor: string
  }
}

const themes: Record<ThemeMode, Theme> = {
  dark: {
    name: 'dark',
    colors: {
      primary: '#00D9FF',
      secondary: '#FF1493',
      accent: '#FFD700',
      success: '#00FF00',
      warning: '#FFA500',
      error: '#FF4444',
      background: '#0a0a0a',
      foreground: '#ffffff',
      muted: '#6B7280',
      border: '#1F2937',
      // 3D
      particleColor: '#00D9FF',
      lightColor1: '#00D9FF',
      lightColor2: '#FF1493',
      lightColor3: '#00FF00',
      glowColor: '#00D9FF',
    },
  },
  neon: {
    name: 'neon',
    colors: {
      primary: '#0FFF50',
      secondary: '#FF006E',
      accent: '#8338EC',
      success: '#0FFF50',
      warning: '#FFB700',
      error: '#FF006E',
      background: '#0A0E27',
      foreground: '#F0F0F0',
      muted: '#A0A0A0',
      border: '#1F3A93',
      // 3D
      particleColor: '#0FFF50',
      lightColor1: '#0FFF50',
      lightColor2: '#FF006E',
      lightColor3: '#8338EC',
      glowColor: '#0FFF50',
    },
  },
  ocean: {
    name: 'ocean',
    colors: {
      primary: '#00CED1',
      secondary: '#1E90FF',
      accent: '#00BFFF',
      success: '#20B2AA',
      warning: '#FFB347',
      error: '#FF6B6B',
      background: '#0a1628',
      foreground: '#E0F4FF',
      muted: '#6B9DB2',
      border: '#0E3A54',
      // 3D
      particleColor: '#00CED1',
      lightColor1: '#00CED1',
      lightColor2: '#1E90FF',
      lightColor3: '#20B2AA',
      glowColor: '#00BFFF',
    },
  },
  nature: {
    name: 'nature',
    colors: {
      primary: '#00D95F',
      secondary: '#9D5D00',
      accent: '#FFD700',
      success: '#00C472',
      warning: '#FF9500',
      error: '#FF6B6B',
      background: '#0A1F0F',
      foreground: '#F5FFF0',
      muted: '#8BAF6B',
      border: '#1F4D2E',
      // 3D
      particleColor: '#00D95F',
      lightColor1: '#00D95F',
      lightColor2: '#9D5D00',
      lightColor3: '#FFD700',
      glowColor: '#00C472',
    },
  },
  sunset: {
    name: 'sunset',
    colors: {
      primary: '#FF6B35',
      secondary: '#F7931E',
      accent: '#FDB833',
      success: '#4CAF50',
      warning: '#FF9800',
      error: '#FF6B6B',
      background: '#1a0f0a',
      foreground: '#FFE8D6',
      muted: '#C9876D',
      border: '#4A2C1F',
      // 3D
      particleColor: '#FF6B35',
      lightColor1: '#FF6B35',
      lightColor2: '#F7931E',
      lightColor3: '#FDB833',
      glowColor: '#F7931E',
    },
  },
}

interface Theme3DContextType {
  theme: Theme
  themeMode: ThemeMode
  setTheme: (mode: ThemeMode) => void
  themes: Record<ThemeMode, Theme>
}

const Theme3DContext = createContext<Theme3DContextType | undefined>(undefined)

export function Theme3DProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark')
  const theme = themes[themeMode]

  const setTheme = (mode: ThemeMode) => {
    setThemeMode(mode)
    // Store in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme-mode-3d', mode)
    }
  }

  // Load from localStorage on mount
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme-mode-3d') as ThemeMode | null
      if (saved && saved in themes) {
        setThemeMode(saved)
      }
    }
  }, [])

  return (
    <Theme3DContext.Provider value={{ theme, themeMode, setTheme, themes }}>
      {children}
    </Theme3DContext.Provider>
  )
}

export function useTheme3D() {
  const context = useContext(Theme3DContext)
  if (!context) {
    throw new Error('useTheme3D must be used within Theme3DProvider')
  }
  return context
}

export function ThemeSwitcher() {
  const { themeMode, setTheme, themes } = useTheme3D()

  return (
    <div className="fixed top-4 right-4 z-50 flex gap-2 bg-black/50 backdrop-blur-sm p-3 rounded-lg border border-gray-700">
      {(Object.keys(themes) as ThemeMode[]).map((mode) => (
        <button
          key={mode}
          onClick={() => setTheme(mode)}
          className={`px-3 py-1 rounded text-xs font-medium transition-all ${
            themeMode === mode
              ? 'bg-cyan-500 text-black scale-105'
              : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
          }`}
          title={`Switch to ${mode} theme`}
        >
          {mode.charAt(0).toUpperCase() + mode.slice(1)}
        </button>
      ))}
    </div>
  )
}

export function useThemeColors() {
  const { theme } = useTheme3D()
  return theme.colors
}

// Helper function for Three.js color conversion
export function getThemeColorFor3D(colorName: keyof Theme['colors']) {
  const { theme } = useTheme3D()
  return theme.colors[colorName]
}
