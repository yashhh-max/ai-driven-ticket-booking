/**
 * 3D Components Index
 * Import all 3D-related components from here
 */

// Theme system
export {
  Theme3DProvider,
  ThemeSwitcher,
  useTheme3D,
  useThemeColors,
  getThemeColorFor3D,
  type ThemeMode,
  type Theme,
} from './theme-provider-3d'

// Core 3D components
export { ParticleSystem, AnimatedLighting } from './particle-system'
export { Checkout3DAnimation } from './checkout-3d-animation'
export { TheatreHomePage3D } from './theatre-home-3d'
export { default as SeatSelector3D } from './seat-selector-3d'
export { default as MovieCard3D } from './movie-card-3d'

// Integration helpers
export {
  ParticleBackground,
  FloatingCard3D,
  NeonButton3D,
  AnimatedGradientText,
} from './3d-integration-examples'
