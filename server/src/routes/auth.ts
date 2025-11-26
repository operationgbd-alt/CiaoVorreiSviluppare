import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { pool, User, Company } from '../db';
import { generateToken, authMiddleware, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      throw new AppError('Username e password sono obbligatori', 400);
    }
    
    const userResult = await pool.query<User>(
      'SELECT * FROM users WHERE username = $1',
      [username.toLowerCase()]
    );
    
    const user = userResult.rows[0];
    
    if (!user) {
      throw new AppError('Credenziali non valide', 401);
    }
    
    if (!user.active) {
      throw new AppError('Account disattivato', 401);
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      throw new AppError('Credenziali non valide', 401);
    }
    
    let company: Company | null = null;
    if (user.role === 'DITTA') {
      const companyResult = await pool.query<Company>(
        'SELECT * FROM companies WHERE owner_id = $1',
        [user.id]
      );
      company = companyResult.rows[0] || null;
    } else if (user.company_id) {
      const companyResult = await pool.query<Company>(
        'SELECT * FROM companies WHERE id = $1',
        [user.company_id]
      );
      company = companyResult.rows[0] || null;
    }
    
    const token = generateToken({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      companyId: user.company_id,
    });
    
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          company: company ? {
            id: company.id,
            name: company.name,
          } : null,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me', authMiddleware, async (req: AuthRequest, res: Response, next) => {
  try {
    const userResult = await pool.query<User>(
      'SELECT * FROM users WHERE id = $1',
      [req.user!.id]
    );
    
    const user = userResult.rows[0];
    
    if (!user) {
      throw new AppError('Utente non trovato', 404);
    }
    
    let company: Company | null = null;
    if (user.role === 'DITTA') {
      const companyResult = await pool.query<Company>(
        'SELECT * FROM companies WHERE owner_id = $1',
        [user.id]
      );
      company = companyResult.rows[0] || null;
    } else if (user.company_id) {
      const companyResult = await pool.query<Company>(
        'SELECT * FROM companies WHERE id = $1',
        [user.company_id]
      );
      company = companyResult.rows[0] || null;
    }
    
    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        company: company ? {
          id: company.id,
          name: company.name,
        } : null,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/change-password', authMiddleware, async (req: AuthRequest, res: Response, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      throw new AppError('Password attuale e nuova password sono obbligatorie', 400);
    }
    
    if (newPassword.length < 6) {
      throw new AppError('La nuova password deve essere di almeno 6 caratteri', 400);
    }
    
    const userResult = await pool.query<User>(
      'SELECT * FROM users WHERE id = $1',
      [req.user!.id]
    );
    
    const user = userResult.rows[0];
    
    if (!user) {
      throw new AppError('Utente non trovato', 404);
    }
    
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    
    if (!isValidPassword) {
      throw new AppError('Password attuale non corretta', 401);
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await pool.query(
      'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, user.id]
    );
    
    res.json({
      success: true,
      message: 'Password aggiornata con successo',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
