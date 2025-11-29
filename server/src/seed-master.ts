import bcrypt from 'bcryptjs';
import { Pool } from 'pg';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: DATABASE_URL.includes('railway') ? { rejectUnauthorized: false } : false,
});

async function seedMaster() {
  const username = process.env.MASTER_USERNAME || 'gbd';
  const password = process.env.MASTER_PASSWORD || 'master123';
  const name = process.env.MASTER_NAME || 'GBD';
  
  console.log(`Updating MASTER credentials for user: ${username}`);
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      `UPDATE users SET password = $1 WHERE username = $2 AND role = 'MASTER' RETURNING id, username, name`,
      [hashedPassword, username]
    );
    
    if (result.rowCount === 0) {
      console.log('No MASTER user found with that username. Creating new one...');
      
      const insertResult = await pool.query(
        `INSERT INTO users (id, username, password, name, role, active, created_at) 
         VALUES (gen_random_uuid(), $1, $2, $3, 'MASTER', true, NOW()) 
         ON CONFLICT (username) DO UPDATE SET password = $2
         RETURNING id, username, name`,
        [username, hashedPassword, name]
      );
      
      console.log('MASTER user created/updated:', insertResult.rows[0]);
    } else {
      console.log('MASTER password updated successfully:', result.rows[0]);
    }
    
    await pool.end();
    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating MASTER credentials:', error);
    await pool.end();
    process.exit(1);
  }
}

seedMaster();
