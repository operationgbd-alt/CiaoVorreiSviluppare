import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool, User } from '../db';
import { AppError } from './errorHandler';

const JWT_SECRET = process.env.SESSION_SECRET || 'solartech-secret-key-change-in-production';

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  role: 'MASTER' | 'DITTA' | 'TECNICO';
  companyId: string | null;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): AuthUser {
  return jwt.verify(token, JWT_SECRET) as AuthUser;
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);
      
      const result = await pool.query<User>(
        'SELECT id, username, name, role, company_id, active FROM users WHERE id = $1',
        [decoded.id]
      );
      
      const user = result.rows[0];
      
      if (user && user.active) {
        // CRITICO: Normalizza SEMPRE il ruolo in MAIUSCOLO
        const normalizedRole = (user.role?.toUpperCase() || 'TECNICO') as 'MASTER' | 'DITTA' | 'TECNICO';
        req.user = {
          id: user.id,
          username: user.username,
          name: user.name,
          role: normalizedRole,
          companyId: user.company_id,
        };
        console.log('[AUTH] User authenticated:', user.username, 'role:', normalizedRole);
        return next();
      }
    }
    
    const demoUser = req.body?.demoUser || req.headers['x-demo-user'];
    if (demoUser) {
      try {
        const userData = typeof demoUser === 'string' ? JSON.parse(demoUser) : demoUser;
        if (userData.id && userData.role && userData.name) {
          const roleUpper = userData.role.toUpperCase();
          req.user = {
            id: userData.id,
            username: userData.username || userData.name.toLowerCase(),
            name: userData.name,
            role: roleUpper as 'MASTER' | 'DITTA' | 'TECNICO',
            companyId: userData.companyId || null,
          };
          console.log('[AUTH] Demo user authenticated:', req.user.name, 'role:', req.user.role);
          return next();
        }
      } catch (e) {
        console.error('Error parsing demo user:', e);
      }
    }
    
    throw new AppError('Token di autenticazione mancante', 401);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }
    return res.status(401).json({
      success: false,
      error: 'Token non valido',
    });
  }
}

export function requireRole(...roles: ('MASTER' | 'DITTA' | 'TECNICO')[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Non autenticato',
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Non hai i permessi per questa azione',
      });
    }
    
    next();
  };
}
