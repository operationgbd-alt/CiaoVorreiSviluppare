import express from 'express';
import cors from 'cors';
import { pool, initializeDatabase } from './db';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import companyRoutes from './routes/companies';
import interventionRoutes from './routes/interventions';
import photoRoutes from './routes/photos';
import reportRoutes from './routes/reports';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = parseInt(process.env.PORT || process.env.SERVER_PORT || '3001', 10);

app.use(cors({
  origin: '*',
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/interventions', interventionRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/reports', reportRoutes);

app.use(errorHandler);

async function main() {
  try {
    await initializeDatabase();
    console.log('Connected to database');
    
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
