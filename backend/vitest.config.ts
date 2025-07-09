/// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        isolate: true,
        fileParallelism: false
    },
})
