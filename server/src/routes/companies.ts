import { Router, Response } from 'express';
import { pool, User, Company } from '../db';
import { authMiddleware, requireRole, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

router.use(authMiddleware);

router.get('/', requireRole('MASTER'), async (req: AuthRequest, res: Response, next) => {
  try {
    const result = await pool.query(`
      SELECT c.*, 
             u.id as owner_user_id, u.name as owner_name, u.email as owner_email, u.phone as owner_phone,
             (SELECT COUNT(*) FROM users WHERE company_id = c.id AND role = 'TECNICO' AND active = true) as technicians_count,
             (SELECT COUNT(*) FROM interventions WHERE company_id = c.id) as interventions_count
      FROM companies c
      JOIN users u ON c.owner_id = u.id
      WHERE c.active = true
      ORDER BY c.name ASC
    `);
    
    const companies = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      address: row.address,
      owner: {
        id: row.owner_user_id,
        name: row.owner_name,
        email: row.owner_email,
        phone: row.owner_phone,
      },
      techniciansCount: parseInt(row.technicians_count),
      interventionsCount: parseInt(row.interventions_count),
    }));
    
    res.json({
      success: true,
      data: companies,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', requireRole('MASTER', 'DITTA'), async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const currentUser = req.user!;
    
    const companyResult = await pool.query<Company>(
      `SELECT c.*, u.id as owner_user_id, u.name as owner_name, u.email as owner_email, u.phone as owner_phone
       FROM companies c
       JOIN users u ON c.owner_id = u.id
       WHERE c.id = $1`,
      [id]
    );
    
    const company = companyResult.rows[0];
    if (!company) {
      throw new AppError('Ditta non trovata', 404);
    }
    
    if (currentUser.role?.toUpperCase() === 'DITTA' && company.owner_id !== currentUser.id) {
      throw new AppError('Non hai i permessi per vedere questa ditta', 403);
    }
    
    const techniciansResult = await pool.query<User>(
      'SELECT id, name, email, phone FROM users WHERE company_id = $1 AND role = $2 AND active = true',
      [id, 'TECNICO']
    );
    
    res.json({
      success: true,
      data: {
        id: company.id,
        name: company.name,
        email: company.email,
        phone: company.phone,
        address: company.address,
        owner: {
          id: (company as any).owner_user_id,
          name: (company as any).owner_name,
          email: (company as any).owner_email,
          phone: (company as any).owner_phone,
        },
        technicians: techniciansResult.rows,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', requireRole('MASTER', 'DITTA'), async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, active } = req.body;
    const currentUser = req.user!;
    
    const companyResult = await pool.query<Company>(
      'SELECT * FROM companies WHERE id = $1',
      [id]
    );
    
    const company = companyResult.rows[0];
    if (!company) {
      throw new AppError('Ditta non trovata', 404);
    }
    
    if (currentUser.role?.toUpperCase() === 'DITTA' && company.owner_id !== currentUser.id) {
      throw new AppError('Non hai i permessi per modificare questa ditta', 403);
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
    if (address !== undefined) {
      updates.push(`address = $${paramCount++}`);
      values.push(address);
    }
    if (currentUser.role?.toUpperCase() === 'MASTER' && active !== undefined) {
      updates.push(`active = $${paramCount++}`);
      values.push(active);
    }
    
    if (updates.length === 0) {
      throw new AppError('Nessun campo da aggiornare', 400);
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    
    const result = await pool.query<Company>(
      `UPDATE companies SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    
    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/technicians', requireRole('MASTER', 'DITTA'), async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const currentUser = req.user!;
    
    const companyResult = await pool.query<Company>(
      'SELECT * FROM companies WHERE id = $1',
      [id]
    );
    
    const company = companyResult.rows[0];
    if (!company) {
      throw new AppError('Ditta non trovata', 404);
    }
    
    if (currentUser.role?.toUpperCase() === 'DITTA' && company.owner_id !== currentUser.id) {
      throw new AppError('Non hai i permessi per vedere i tecnici di questa ditta', 403);
    }
    
    const result = await pool.query<User>(
      'SELECT id, username, name, email, phone, created_at FROM users WHERE company_id = $1 AND role = $2 AND active = true ORDER BY name ASC',
      [id, 'TECNICO']
    );
    
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
