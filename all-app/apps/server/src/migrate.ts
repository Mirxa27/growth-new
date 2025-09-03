import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { Client } from 'pg'

function loadEnv() {
  const tryPaths = [
    path.resolve(__dirname, '../../../.env'),
    path.resolve(__dirname, '../../.env'),
  ]
  for (const p of tryPaths) {
    if (fs.existsSync(p)) {
      dotenv.config({ path: p })
      return
    }
  }
  dotenv.config()
}

async function main() {
  loadEnv()
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('Missing DATABASE_URL')
  const sqlPath = path.resolve(__dirname, 'schema.sql')
  const sql = fs.readFileSync(sqlPath, 'utf-8')
  const client = new Client({ connectionString: databaseUrl })
  await client.connect()
  try {
    await client.query(sql)
    console.log('Schema applied')
  } finally {
    await client.end()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

