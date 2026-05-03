import { defineConfig } from 'prisma/config'

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL

export default defineConfig({
  earlyAccess: true,
  schema: './prisma/schema.prisma',
  migrate: {
    adapter: async () => {
      const { PrismaPg } = await import('@prisma/adapter-pg')
      const { Pool } = await import('pg')

      if (!connectionString) {
        throw new Error('DATABASE_URL or DIRECT_URL environment variable is required')
      }

      const pool = new Pool({ connectionString })
      return new PrismaPg(pool)
    },
    datasourceUrl: connectionString,
  },
})
