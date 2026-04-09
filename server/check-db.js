const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('✓ Connected to database');
    
    // Check if leaves table exists
    const tableResult = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'leaves'
      );
    `;
    
    console.log('Leaves table exists:', tableResult[0].exists);
    
    if (tableResult[0].exists) {
      // Get column count
      const columnsResult = await prisma.$queryRaw`
        SELECT COUNT(*) as column_count FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'leaves';
      `;
      console.log('Columns in leaves table:', columnsResult[0].column_count);
      
      // Get row count
      const rowsResult = await prisma.$queryRaw`
        SELECT COUNT(*) as row_count FROM "leaves";
      `;
      console.log('Rows in leaves table:', rowsResult[0].row_count);
    } else {
      console.log('\n❌ LEAVES TABLE DOES NOT EXIST IN DATABASE');
      
      // Check what tables do exist
      const tables = await prisma.$queryRaw`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `;
      console.log('Tables in database:', tables.map(t => t.table_name));
      
      // Check migrations table
      const migrations = await prisma.$queryRaw`
        SELECT version, name FROM "_prisma_migrations"
        ORDER BY finished_at DESC;
      `;
      console.log('Applied migrations:', migrations.map(m => `${m.version}: ${m.name}`));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
