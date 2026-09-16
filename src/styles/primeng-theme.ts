import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/** Aura preset overridden to Damascus Paradise brand tokens. */
export const TahfizPreset = definePreset(Aura, {
  primitive: {
    emerald: {
      50: '#E4F0EA',
      100: '#C5DDD2',
      200: '#9EC4B3',
      300: '#6FA992',
      400: '#3F8B70',
      500: '#1B4D3E',
      600: '#143B30',
      700: '#0F2E26',
      800: '#0A211B',
      900: '#061510',
      950: '#030A08',
    },
  },
  semantic: {
    typography: {
      fontFamily: 'var(--font)',
    },
    colorScheme: {
      light: {
        surface: {
          0: '#FFFDF8',
          50: '#F3EEE3',
          100: '#E4DDD3',
          200: '#DDD5C6',
          300: '#C9C0B0',
          400: '#9AA39C',
          500: '#5A6B62',
          600: '#3D4A44',
          700: '#15241C',
          800: '#101A15',
          900: '#0A100D',
          950: '#050807',
        },
        primary: {
          color: '#1B4D3E',
          contrastColor: '#ffffff',
          hoverColor: '#143B30',
          activeColor: '#0F2E26',
        },
        text: {
          color: '#15241C',
          hoverColor: '#0A100D',
          mutedColor: '#5A6B62',
        },
        formField: {
          background: '#FFFDF8',
          borderColor: '#DDD5C6',
          focusBorderColor: '#1B4D3E',
          placeholderColor: '#9AA39C',
        },
        highlight: {
          background: '#E4F0EA',
          focusBackground: '#C5DDD2',
          color: '#1B4D3E',
        },
      },
    },
  },
});
