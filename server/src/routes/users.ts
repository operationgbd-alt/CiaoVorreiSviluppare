import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { pool, User, Company } from '../db';
import { authMiddleware, requireRole, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

router.use(authMiddleware);

router.get('/', requireRole('MASTER', 'DITTA'), async (req: AuthRequest, res: Response, next) => {
  try {
    const { role } = req.query;
    const user = req.user!;
    
    let query = 'SELECT u.*, c.id as company_id_ref, c.name as company_name FROM users u LEFT JOIN companies c ON u.company_id = c.id WHERE u.active = true';
    const params: any[] = [];
    
    if (user.role === 'DITTA') {
      const companyResult = await pool.query<Company>(
        'SELECT * FROM companies WHERE owner_id = $1',
        [user.id]
      );
      
      const company = companyResult.rows[0];
      if (!company) {
        throw new AppError('Ditta non trovata', 404);
      }
      
      query += ' AND u.company_id = $1 AND u.role = $2';
      params.push(company.id, 'TECNICO');
    } else if (role) {
      query += ' AND u.role = $1';
      params.push(role);
    }
    
    query += ' ORDER BY u.created_at DESC';
    
    const result = await pool.query(query, params);
    
    const users = result.rows.map(row => ({
      id: row.id,
      username: row.username,
      name: row.name,
      email: row.email,
      phone: row.phone,
      role: row.role,
      active: row.active,
      createdAt: row.created_at,
      company: row.company_id_ref ? {
        id: row.company_id_ref,
        name: row.company_name,
      } : null,
    }));
    
    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireRole('MASTER', 'DITTA'), async (req: AuthRequest, res: Response, next) => {
  try {
    const { username, password, name, email, phone, role, companyId } = req.body;
    const currentUser = req.user!;
    
    if (!username || !password || !name || !role) {
      throw new AppError('Username, password, nome e ruolo sono obbligatori', 400);
    }
    
    if (password.length < 6) {
      throw new AppError('La password deve essere di almeno 6 caratteri', 400);
    }
    
    const existingResult = await pool.query<User>(
      'SELECT id FROM users WHERE username = $1',
      [username.toLowerCase()]
    );
    
    if (existingResult.rows.length > 0) {
      throw new AppError('Username già in uso', 400);
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    if (currentUser.role === 'DITTA') {
      if (role !== 'TECNICO') {
        throw new AppError('La ditta può creare solo account tecnico', 403);
      }
      
      const companyResult = await pool.query<Company>(
        'SELECT * FROM companies WHERE owner_id = $1',
        [currentUser.id]
      );
      
      const company = companyResult.rows[0];
      if (!company) {
        throw new AppError('Ditta non trovata', 404);
      }
      
      const userResult = await pool.query<User>(
        `INSERT INTO users (username, password, name, email, phone, role, company_id, created_by_id)
         VALUES ($1, $2, $3, $4, $5, 'TECNICO', $6, $7)
         RETURNING *`,
        [username.toLowerCase(), hashedPassword, name, email, phone, company.id, currentUser.id]
      );
      
      const newUser = userResult.rows[0];
      
      return res.status(201).json({
        success: true,
        data: {
          id: newUser.id,
          username: newUser.username,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          role: newUser.role,
          company: {
            id: company.id,
            name: company.name,
          },
        },
      });
    }
    
    if (currentUser.role === 'MASTER') {
      if (role === 'MASTER') {
        throw new AppError('Non è possibile creare altri account Master', 403);
      }
      
      if (role === 'DITTA') {
        const userResult = await pool.query<User>(
          `INSERT INTO users (username, password, name, email, phone, role, created_by_id)
           VALUES ($1, $2, $3, $4, $5, 'DITTA', $6)
           RETURNING *`,
          [username.toLowerCase(), hashedPassword, name, email, phone, currentUser.id]
        );
        
        const newUser = userResult.rows[0];
        
        const companyResult = await pool.query<Company>(
          `INSERT INTO companies (name, email, phone, owner_id)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [name, email, phone, newUser.id]
        );
        
        const company = companyResult.rows[0];
        
        return res.status(201).json({
          success: true,
          data: {
            id: newUser.id,
            username: newUser.username,
            name: newUser.name,
            email: newUser.email,
            phone: newUser.phone,
            role: newUser.role,
            company: {
              id: company.id,
              name: company.name,
            },
          },
        });
      }
      
      if (role === 'TECNICO') {
        if (!companyId) {
          throw new AppError('Per creare un tecnico è necessario specificare la ditta', 400);
        }
        
        const companyResult = await pool.query<Company>(
          'SELECT * FROM companies WHERE id = $1',
          [companyId]
        );
        
        const company = companyResult.rows[0];
        if (!company) {
          throw new AppError('Ditta non trovata', 404);
        }
        
        const userResult = await pool.query<User>(
          `INSERT INTO users (username, password, name, email, phone, role, company_id, created_by_id)
           VALUES ($1, $2, $3, $4, $5, 'TECNICO', $6, $7)
           RETURNING *`,
          [username.toLowerCase(), hashedPassword, name, email, phone, companyId, currentUser.id]
        );
        
        const newUser = userResult.rows[0];
        
        return res.status(201).json({
          success: true,
          data: {
            id: newUser.id,
            username: newUser.username,
            name: newUser.name,
            email: newUser.email,
            phone: newUser.phone,
            role: newUser.role,
            company: {
              id: company.id,
              name: company.name,
            },
          },
        });
      }
    }
    
    throw new AppError('Ruolo non valido', 400);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', requireRole('MASTER', 'DITTA'), async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const { name, email, phone, active } = req.body;
    const currentUser = req.user!;
    
    const targetResult = await pool.query<User>(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    
    const targetUser = targetResult.rows[0];
    if (!targetUser) {
      throw new AppError('Utente non trovato', 404);
    }
    
    if (currentUser.role === 'DITTA') {
      const companyResult = await pool.query<Company>(
        'SELECT * FROM companies WHERE owner_id = $1',
        [currentUser.id]
      );
      
      const company = companyResult.rows[0];
      if (!company || targetUser.company_id !== company.id) {
        throw new AppError('Non hai i permessi per modificare questo utente', 403);
      }
    }
    
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;
    
    if (name) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (email !== undefined) {
      updates.push(`email = $${paramCount++}`);
      values.push(email);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramCount++}`);
      values.push(phone);
    }
    if (active !== undefined) {
      updates.push(`active = $${paramCount++}`);
      values.push(active);
    }
    
    if (updates.length === 0) {
      throw new AppError('Nessun campo da aggiornare', 400);
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    
    const result = await pool.query<User>(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    
    const updatedUser = result.rows[0];
    
    res.json({
      success: true,
      data: {
        id: updatedUser.id,
        username: updatedUser.username,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        active: updatedUser.active,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET posizioni tecnici per la mappa - MASTER e DITTA
router.get('/technician-locations', requireRole('MASTER', 'DITTA'), async (req: AuthRequest, res: Response, next) => {
  try {
    const user = req.user!;
    
    let query = `
      SELECT u.id, u.name, u.phone, u.email,
             i.location_latitude as latitude, 
             i.location_longitude as longitude,
             i.location_timestamp as last_update,
             i.status
      FROM users u
      LEFT JOIN LATERAL (
        SELECT location_latitude, location_longitude, location_timestamp, status
        FROM interventions
        WHERE technician_id = u.id 
          AND location_latitude IS NOT NULL 
          AND location_longitude IS NOT NULL
        ORDER BY location_timestamp DESC NULLS LAST
        LIMIT 1
      ) i ON true
      WHERE u.role = 'TECNICO' AND u.active = true
    `;
    
    const params: any[] = [];
    
    // Se DITTA, filtra solo i tecnici della propria azienda
    if (user.role === 'DITTA') {
      const companyResult = await pool.query<Company>(
        'SELECT * FROM companies WHERE owner_id = $1',
        [user.id]
      );
      
      const company = companyResult.rows[0];
      if (!company) {
        throw new AppError('Ditta non trovata', 404);
      }
      
      query += ' AND u.company_id = $1';
      params.push(company.id);
    }
    
    const result = await pool.query(query, params);
    
    const technicians = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      email: row.email,
      latitude: row.latitude ? parseFloat(row.latitude) : null,
      longitude: row.longitude ? parseFloat(row.longitude) : null,
      lastUpdate: row.last_update,
      status: row.status,
    }));
    
    console.log('[USERS] Technician locations:', technicians.length, 'found');
    
    res.json({
      success: true,
      data: technicians,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/reset-password', requireRole('MASTER', 'DITTA'), async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    const currentUser = req.user!;
    
    if (!newPassword || newPassword.length < 6) {
      throw new AppError('La nuova password deve essere di almeno 6 caratteri', 400);
    }
    
    const targetResult = await pool.query<User>(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    
    const targetUser = targetResult.rows[0];
    if (!targetUser) {
      throw new AppError('Utente non trovato', 404);
    }
    
    if (currentUser.role === 'DITTA') {
      const companyResult = await pool.query<Company>(
        'SELECT * FROM companies WHERE owner_id = $1',
        [currentUser.id]
      );
      
      const company = companyResult.rows[0];
      if (!company || targetUser.company_id !== company.id) {
        throw new AppError('Non hai i permessi per modificare questo utente', 403);
      }
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await pool.query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, id]
    );
    
    res.json({
      success: true,
      message: 'Password reimpostata con successo',
    });
  } catch (error) {
    next(error);
  }
});

export default router;