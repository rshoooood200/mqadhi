import pg from 'pg'

const client = new pg.Client({
  connectionString: 'postgresql://neondb_owner:npg_DHqSXmvnh20M@ep-soft-lake-a12ynrmk.ap-southeast-1.aws.neon.tech/neondb?sslmode=require'
})

async function test() {
  try {
    await client.connect()
    const res = await client.query('SELECT NOW()')
    console.log('✅ الاتصال بـ Neon ناجح!', res.rows[0])
  } catch (error) {
    console.log('❌ فشل:', error.message)
  } finally {
    await client.end()
  }
}

test()
