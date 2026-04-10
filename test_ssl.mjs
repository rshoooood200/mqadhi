import pg from 'pg'

// Direct connection with SSL
const client = new pg.Client({
  connectionString: 'postgresql://postgres.gndcbkzulzeeillptdip:Rr0558750989@db.gndcbkzulzeeillptdip.supabase.co:5432/postgres?sslmode=require',
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
