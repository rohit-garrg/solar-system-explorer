import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * drei@9.x uses LinearEncoding and sRGBEncoding which were removed in three r152.
 * We use a Vite plugin to inject these legacy constants into the three.js module
 * at build time, without patching node_modules.
 */
function threeShimPlugin() {
  return {
    name: 'three-shim',
    // Transform three's main module to add back removed constants
    transform(code, id) {
      if (id.includes('three/build/three.module.js') || id.includes('three/src/Three.js')) {
        // Only add if not already present
        if (!code.includes('LinearEncoding')) {
          return {
            code: code + '\nexport const LinearEncoding = 3000;\nexport const sRGBEncoding = 3001;\n',
            map: null,
          }
        }
      }
    },
  }
}

export default defineConfig({
  plugins: [react(), threeShimPlugin()],
})
