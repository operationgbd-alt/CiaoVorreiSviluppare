import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { pool, initializeDatabase } from './db';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import companyRoutes from './routes/companies';
import interventionRoutes from './routes/interventions';
import photoRoutes from './routes/photos';
import reportRoutes from './routes/reports';
import pushTokenRoutes from './routes/pushTokens';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = parseInt(process.env.PORT || process.env.SERVER_PORT || '3001', 10);

app.use(cors({
  origin: '*',
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const BUILD_VERSION = '2025.12.02.v4';

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: BUILD_VERSION
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/interventions', interventionRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/push-tokens', pushTokenRoutes);

app.use(errorHandler);

async function seedMasterUser() {
  const username = process.env.MASTER_USERNAME || 'gbd';
  const password = process.env.MASTER_PASSWORD || 'master123';
  const name = process.env.MASTER_NAME || 'GBD Master';

  try {
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length === 0) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query(
        'INSERT INTO users (username, password, name, role) VALUES ($1, $2, $3, $4)',
        [username, hashedPassword, name, 'MASTER']
      );
      console.log(`[SEED] Master user '${username}' created successfully`);
    } else {
      console.log(`[SEED] Master user '${username}' already exists`);
    }
  } catch (error) {
    console.error('[SEED] Error seeding master user:', error);
  }
}

async function main() {
  try {
    await initializeDatabase();
    console.log('Connected to database');
    
    await seedMasterUser();
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

main();

process.on('SIGINT', async () => {
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await pool.end();
  process.exit(0);
});
