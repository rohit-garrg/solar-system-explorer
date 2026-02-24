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

  // Relative asset paths for iframe embedding and static hosting
  base: './',

  // Force Vite to re-bundle three with our shim during dev
  optimizeDeps: {
    esbuildOptions: {
      plugins: [
        {
          name: 'three-compat-shim',
          setup(build) {
            build.onLoad({ filter: /three\/build\/three\.module\.js$/ }, async (args) => {
              const fs = await import('fs')
              let contents = fs.readFileSync(args.path, 'utf8')
              if (!contents.includes('LinearEncoding')) {
                contents += '\nexport const LinearEncoding = 3000;\nexport const sRGBEncoding = 3001;\n'
              }
              return { contents, loader: 'js' }
            })
          },
        },
      ],
    },
  },

  build: {
    // Split Three.js into its own chunk for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          'react-three': ['@react-three/fiber', '@react-three/drei'],
        },
      },
    },
  },

  // Development server headers
  server: {
    headers: {
      'Content-Security-Policy': "frame-ancestors 'self' https://rohitgarrg.com https://*.rohitgarrg.com",
    },
  },

  // Preview server headers (npm run preview)
  preview: {
    headers: {
      'Content-Security-Policy': "frame-ancestors 'self' https://rohitgarrg.com https://*.rohitgarrg.com",
    },
  },
})
