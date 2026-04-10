import pg from 'pg'

const client = new pg.Client({
  connectionString: 'postgresql://postgres.gndcbkzulzeeillptdip:Rr0558750989@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres',
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
