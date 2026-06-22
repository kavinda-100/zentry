import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'react/index': 'src/react/index.ts',
    'react/server': 'src/react/server.ts',
    'node/index': 'src/node/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  minify: true,
  external: ['react', 'express'],
  banner: {
    js: `// Zentry Engine Core Pipeline Output`,
  },
  esbuildOptions(options, context) {
    // Inject "use client" into the top of the interactive React entry bundle
    if (context.format === 'esm' && options.entryPoints && 'react/index' in options.entryPoints) {
      options.banner = {
        js: '"use client";\n',
      };
    }
  },
});
