import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            if (id.includes('jspdf')) {
              return 'pdf-vendor';
            }
            if (id.includes('html2canvas')) {
              return 'canvas-vendor';
            }
            if (id.includes('lucide-react')) {
              return 'icons-vendor';
            }
            return 'vendor';
          }

          if (id.includes('AdminDashboard') || id.includes('AdminService') || id.includes('AdminPeriodic')) {
            return 'admin-features';
          }
          if (id.includes('RefAtolye') || id.includes('RefEvaluation') || id.includes('RefSections')) {
            return 'ref-atolye-features';
          }
          if (id.includes('Product') || id.includes('Order') || id.includes('Shopping') || id.includes('Cart')) {
            return 'ecommerce-features';
          }
          if (id.includes('PlayGroup')) {
            return 'playgroup-features';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1500,
    sourcemap: false,
    minify: 'esbuild',
  },
});
