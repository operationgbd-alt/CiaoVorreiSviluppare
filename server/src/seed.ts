import bcrypt from 'bcryptjs';
import { pool, initializeDatabase, User } from './db';

async function main() {
  console.log('Initializing database...');
  await initializeDatabase();
  
  console.log('Seeding database...');
  
  const existingResult = await pool.query<User>(
    'SELECT * FROM users WHERE role = $1',
    ['MASTER']
  );
  
  if (existingResult.rows.length > 0) {
    console.log('Master account already exists:', existingResult.rows[0].username);
    return;
  }
  
  const hashedPassword = await bcrypt.hash('master123', 10);
  
  const result = await pool.query<User>(`
    INSERT INTO users (username, password, name, email, role)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `, ['gbd', hashedPassword, 'GBD', 'master@solartech.it', 'MASTER']);
  
  const master = result.rows[0];
  
  console.log('Created Master account:');
  console.log('  Username: gbd');
  console.log('  Password: master123');
  console.log('  ID:', master.id);
  
  console.log('\nSeeding complete!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
