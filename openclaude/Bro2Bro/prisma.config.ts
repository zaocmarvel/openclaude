import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  earlyAccess: true,
  schema: './prisma/schema.prisma',
  migrate: {
    adapter: async () => {
      const { PrismaPg } = await import('@prisma/adapter-pg')
      const { Pool } = await import('pg')

      const connectionString = env('DIRECT_URL') || env('DATABASE_URL')
      if (!connectionString) {
        throw new Error('DATABASE_URL or DIRECT_URL environment variable is required')
      }

      const pool = new Pool({ connectionString })
      return new PrismaPg(pool)
    },
    datasourceUrl: env('DIRECT_URL') || env('DATABASE_URL'),
  },
})
