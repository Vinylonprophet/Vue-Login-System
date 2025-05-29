import { defineConfig, presetUno, presetTypography, presetWebFonts } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetTypography(),
    presetWebFonts({
      fonts: {
        sans: 'Inter:400,500,600,700',
        mono: 'Fira Code'
      }
    })
  ],
  shortcuts: {
    'btn': 'px-4 py-2 rounded-lg font-medium transition-colors cursor-pointer',
    'btn-primary': 'btn bg-blue-500 text-white hover:bg-blue-600',
    'btn-secondary': 'btn bg-gray-200 text-gray-800 hover:bg-gray-300',
    'input-field': 'px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
  }
}) 