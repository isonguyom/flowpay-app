import { fileURLToPath, URL } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
    viteConfig,
    defineConfig({
        test: {
            globals: true,                // use describe/it/expect without imports
            environment: 'jsdom',         // simulate browser environment
            exclude: [...configDefaults.exclude, 'e2e/**'],
            root: fileURLToPath(new URL('./', import.meta.url)),
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url)), // alias for @
            },
            include: ['tests/**/*.test.{js,ts}'], // test files to include
        },
    }),
)
