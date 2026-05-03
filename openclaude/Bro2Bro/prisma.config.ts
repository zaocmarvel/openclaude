import { defineConfig } from 'prisma/config'

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL

if (!url) {
  throw new Error('DATABASE_URL or DIRECT_URL environment variable is required')
}

export default defineConfig({
  earlyAccess: true,
  schema: './prisma/schema.prisma',
  migrate: {
    adapter: async () => {
      const { PrismaPg } = await import('@prisma/adapter-pg')
      const { Pool } = await import('pg')
      const pool = new Pool({ connectionString: url })
      return new PrismaPg(pool)
    },
    datasourceUrl: url,
  },
})
