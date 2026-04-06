import { MD3DarkTheme } from 'react-native-paper';

// Modern Dark Taxi Palette
// Background: Deep Slate-950 (#020617) - Near black, extremely premium
// Primary: Taxi Yellow (#FDE047) - High-contrast accent
// Surface: Slate-900 (#0F172A) - For cards and headers
// Text: White/Yellow - For maximum legibility

export const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#FDE047', // Taxi Yellow
    onPrimary: '#020617', 
    primaryContainer: '#0F172A',
    onPrimaryContainer: '#FDE047',
    
    background: '#020617', // The "All Black" look
    surface: '#0F172A', // Aggressive gray for cards
    onSurface: '#F8FAFC',
    onSurfaceVariant: '#94A3B8',
    
    outline: '#1E293B',
    error: '#EF4444',
  },
  roundness: 3,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 12,
  lg: 20,
  full: 9999,
};
