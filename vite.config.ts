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

          if (id.includes('AdminDashboard')) {
            return 'admin-dashboard';
          }
          if (id.includes('AdminService') || id.includes('AdminPeriodic') || id.includes('AdminFieldTrips')) {
            return 'admin-features';
          }
          if (id.includes('RefAtolye') || id.includes('RefEvaluation') || id.includes('RefSections')) {
            return 'ref-atolye-features';
          }
          if (id.includes('Product') || id.includes('Order')) {
            return 'ecommerce-products';
          }
          if (id.includes('Shopping') || id.includes('Cart')) {
            return 'ecommerce-cart';
          }
          if (id.includes('PlayGroup')) {
            return 'playgroup-features';
          }
          if (id.includes('PeriodicDevelopment') || id.includes('PeriodicReports')) {
            return 'periodic-reports';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1500,
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2015',
    cssCodeSplit: true,
  },
});
