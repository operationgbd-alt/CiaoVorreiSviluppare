import { Pool } from 'pg';

// Priority: RAILWAY_DATABASE_URL (for dev connecting to Railway) > DATABASE_URL > DATABASE_PUBLIC_URL
const connectionString = process.env.RAILWAY_DATABASE_URL || process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL;

if (!connectionString) {
  console.error('ERROR: No database connection string found!');
  console.error('Set DATABASE_URL or DATABASE_PUBLIC_URL environment variable');
  process.exit(1);
}

console.log('Connecting to database...');

export const pool = new Pool({
  connectionString,
  ssl: connectionString?.includes('railway') ? { rejectUnauthorized: false } : 
       (process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined),
});

export async function initializeDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        role VARCHAR(20) NOT NULL CHECK (role IN ('MASTER', 'DITTA', 'TECNICO')),
        active BOOLEAN DEFAULT true,
        company_id UUID,
        created_by_id UUID,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS companies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        active BOOLEAN DEFAULT true,
        owner_id UUID UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS interventions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        number VARCHAR(50) UNIQUE NOT NULL,
        client_name VARCHAR(255) NOT NULL,
        client_phone VARCHAR(50),
        client_email VARCHAR(255),
        client_address TEXT NOT NULL,
        client_civic_number VARCHAR(20),
        client_city VARCHAR(100) NOT NULL,
        client_province VARCHAR(10),
        client_postal_code VARCHAR(10),
        category VARCHAR(20) NOT NULL CHECK (category IN ('sopralluogo', 'installazione', 'manutenzione')),
        priority VARCHAR(20) DEFAULT 'normale' CHECK (priority IN ('bassa', 'normale', 'alta', 'urgente')),
        description TEXT NOT NULL,
        status VARCHAR(30) DEFAULT 'assegnato' CHECK (status IN ('assegnato', 'appuntamento_fissato', 'in_corso', 'completato', 'chiuso')),
        company_id UUID,
        technician_id UUID,
        appointment_date TIMESTAMP,
        appointment_notes TEXT,
        appointment_confirmed_at TIMESTAMP,
        location_latitude DOUBLE PRECISION,
        location_longitude DOUBLE PRECISION,
        location_address TEXT,
        location_timestamp TIMESTAMP,
        documentation_notes TEXT,
        documentation_photos TEXT[] DEFAULT '{}',
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        closed_at TIMESTAMP,
        closed_notes TEXT,
        created_by_id UUID NOT NULL,
        assigned_by_id UUID,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS photos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        intervention_id UUID NOT NULL,
        data TEXT NOT NULL,
        mime_type VARCHAR(50) DEFAULT 'image/jpeg',
        caption TEXT,
        uploaded_by_id UUID NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
      CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);
      CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
      CREATE INDEX IF NOT EXISTS idx_interventions_status ON interventions(status);
      CREATE INDEX IF NOT EXISTS idx_interventions_company ON interventions(company_id);
      CREATE INDEX IF NOT EXISTS idx_interventions_technician ON interventions(technician_id);
      CREATE INDEX IF NOT EXISTS idx_interventions_category ON interventions(category);
      CREATE INDEX IF NOT EXISTS idx_photos_intervention ON photos(intervention_id);

      ALTER TABLE users 
        DROP CONSTRAINT IF EXISTS fk_users_company,
        ADD CONSTRAINT fk_users_company FOREIGN KEY (company_id) REFERENCES companies(id);
      
      ALTER TABLE companies 
        DROP CONSTRAINT IF EXISTS fk_companies_owner,
        ADD CONSTRAINT fk_companies_owner FOREIGN KEY (owner_id) REFERENCES users(id);
      
      ALTER TABLE interventions 
        DROP CONSTRAINT IF EXISTS fk_interventions_company,
        DROP CONSTRAINT IF EXISTS fk_interventions_technician,
        ADD CONSTRAINT fk_interventions_company FOREIGN KEY (company_id) REFERENCES companies(id),
        ADD CONSTRAINT fk_interventions_technician FOREIGN KEY (technician_id) REFERENCES users(id);
    `);
    console.log('Database initialized successfully');
  } finally {
    client.release();
  }
}

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: 'MASTER' | 'DITTA' | 'TECNICO';
  active: boolean;
  company_id: string | null;
  created_by_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Company {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  active: boolean;
  owner_id: string;
  created_at: Date;
  updated_at: Date;
}

export interface Intervention {
  id: string;
  number: string;
  client_name: string;
  client_phone: string | null;
  client_email: string | null;
  client_address: string;
  client_civic_number: string | null;
  client_city: string;
  client_province: string | null;
  client_postal_code: string | null;
  category: 'sopralluogo' | 'installazione' | 'manutenzione';
  priority: 'bassa' | 'normale' | 'alta' | 'urgente';
  description: string;
  status: 'assegnato' | 'appuntamento_fissato' | 'in_corso' | 'completato' | 'chiuso';
  company_id: string | null;
  technician_id: string | null;
  appointment_date: Date | null;
  appointment_notes: string | null;
  appointment_confirmed_at: Date | null;
  location_latitude: number | null;
  location_longitude: number | null;
  location_address: string | null;
  location_timestamp: Date | null;
  documentation_notes: string | null;
  documentation_photos: string[];
  started_at: Date | null;
  completed_at: Date | null;
  closed_at: Date | null;
  closed_notes: string | null;
  created_by_id: string;
  assigned_by_id: string | null;
  assigned_at: Date;
  created_at: Date;
  updated_at: Date;
}
