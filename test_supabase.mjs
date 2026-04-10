import pg from 'pg'

const client = new pg.Client({
  host: 'aws-1-ap-southeast-1.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.gndcbkzulzeeillptdip',
  password: 'Rr0558750989',
  ssl: { rejectUnauthorized: false }
})

async function test() {
  try {
    await client.connect()
    const res = await client.query('SELECT NOW()')
    console.log('✅ الاتصال ناجح!', res.rows[0])
  } catch (error) {
    console.log('❌ فشل:', error.message)
  } finally {
    await client.end()
  }
}

test()
