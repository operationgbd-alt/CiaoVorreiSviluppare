import { Router, Response } from 'express';
import { pool, User, Company, Intervention } from '../db';
import { authMiddleware, requireRole, AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { notifyStatusChange, notifyAppointmentSet } from '../services/pushNotificationService';

const router = Router();

router.use(authMiddleware);

async function generateInterventionNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const result = await pool.query(
    `SELECT COUNT(*) FROM interventions WHERE created_at >= $1 AND created_at < $2`,
    [`${year}-01-01`, `${year + 1}-01-01`]
  );
  const count = parseInt(result.rows[0].count);
  return `INT-${year}-${String(count + 1).padStart(4, '0')}`;
}

router.get('/', async (req: AuthRequest, res: Response, next) => {
  try {
    const { status, category, companyId, technicianId } = req.query;
    const user = req.user!;
    
    let query = `
      SELECT i.*, 
             c.id as company_id_ref, c.name as company_name,
             t.id as tech_id, t.name as tech_name, t.phone as tech_phone
      FROM interventions i
      LEFT JOIN companies c ON i.company_id = c.id
      LEFT JOIN users t ON i.technician_id = t.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;
    
    if (user.role?.toUpperCase() === 'TECNICO') {
      query += ` AND i.technician_id = $${paramCount++}`;
      params.push(user.id);
    } else if (user.role?.toUpperCase() === 'DITTA') {
      const companyResult = await pool.query<Company>(
        'SELECT * FROM companies WHERE owner_id = $1',
        [user.id]
      );
      const company = companyResult.rows[0];
      if (company) {
        query += ` AND i.company_id = $${paramCount++}`;
        params.push(company.id);
      }
    }
    
    if (status) {
      query += ` AND i.status = $${paramCount++}`;
      params.push(status);
    }
    if (category) {
      query += ` AND i.category = $${paramCount++}`;
      params.push(category);
    }
    if (user.role?.toUpperCase() === 'MASTER' && companyId) {
      query += ` AND i.company_id = $${paramCount++}`;
      params.push(companyId);
    }
    if ((user.role?.toUpperCase() === 'MASTER' || user.role?.toUpperCase() === 'DITTA') && technicianId) {
      query += ` AND i.technician_id = $${paramCount++}`;
      params.push(technicianId);
    }
    
    query += ' ORDER BY i.created_at DESC';
    
    const result = await pool.query(query, params);
    
    const interventions = result.rows.map(row => ({
      id: row.id,
      number: row.number,
      clientName: row.client_name,
      clientPhone: row.client_phone,
      clientEmail: row.client_email,
      clientAddress: row.client_address,
      clientCivicNumber: row.client_civic_number,
      clientCity: row.client_city,
      clientProvince: row.client_province,
      clientPostalCode: row.client_postal_code,
      category: row.category,
      priority: row.priority,
      description: row.description,
      status: row.status,
      company: row.company_id_ref ? {
        id: row.company_id_ref,
        name: row.company_name,
      } : null,
      technician: row.tech_id ? {
        id: row.tech_id,
        name: row.tech_name,
        phone: row.tech_phone,
      } : null,
      appointmentDate: row.appointment_date,
      appointmentNotes: row.appointment_notes,
      appointmentConfirmedAt: row.appointment_confirmed_at,
      locationLatitude: row.location_latitude,
      locationLongitude: row.location_longitude,
      locationAddress: row.location_address,
      locationTimestamp: row.location_timestamp,
      documentationNotes: row.documentation_notes,
      documentationPhotos: row.documentation_photos || [],
      startedAt: row.started_at,
      completedAt: row.completed_at,
      closedAt: row.closed_at,
      closedNotes: row.closed_notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      assignedAt: row.assigned_at,
    }));
    
    res.json({
      success: true,
      data: interventions,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/stats', async (req: AuthRequest, res: Response, next) => {
  try {
    const user = req.user!;
    
    let whereClause = '';
    const params: any[] = [];
    
    if (user.role?.toUpperCase() === 'TECNICO') {
      whereClause = 'WHERE technician_id = $1';
      params.push(user.id);
    } else if (user.role?.toUpperCase() === 'DITTA') {
      const companyResult = await pool.query<Company>(
        'SELECT * FROM companies WHERE owner_id = $1',
        [user.id]
      );
      const company = companyResult.rows[0];
      if (company) {
        whereClause = 'WHERE company_id = $1';
        params.push(company.id);
      }
    }
    
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'assegnato') as assegnato,
        COUNT(*) FILTER (WHERE status = 'appuntamento_fissato') as appuntamento_fissato,
        COUNT(*) FILTER (WHERE status = 'in_corso') as in_corso,
        COUNT(*) FILTER (WHERE status = 'completato') as completato,
        COUNT(*) FILTER (WHERE status = 'chiuso') as chiuso
      FROM interventions ${whereClause}
    `, params);
    
    const stats = result.rows[0];
    
    res.json({
      success: true,
      data: {
        total: parseInt(stats.total),
        assegnato: parseInt(stats.assegnato),
        appuntamento_fissato: parseInt(stats.appuntamento_fissato),
        in_corso: parseInt(stats.in_corso),
        completato: parseInt(stats.completato),
        chiuso: parseInt(stats.chiuso),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const user = req.user!;
    
    const result = await pool.query(`
      SELECT i.*, 
             c.id as company_id_ref, c.name as company_name,
             t.id as tech_id, t.name as tech_name, t.phone as tech_phone
      FROM interventions i
      LEFT JOIN companies c ON i.company_id = c.id
      LEFT JOIN users t ON i.technician_id = t.id
      WHERE i.id = $1
    `, [id]);
    
    const row = result.rows[0];
    if (!row) {
      throw new AppError('Intervento non trovato', 404);
    }
    
    if (user.role?.toUpperCase() === 'TECNICO' && row.technician_id !== user.id) {
      throw new AppError('Non hai i permessi per vedere questo intervento', 403);
    }
    
    if (user.role?.toUpperCase() === 'DITTA') {
      const companyResult = await pool.query<Company>(
        'SELECT * FROM companies WHERE owner_id = $1',
        [user.id]
      );
      const company = companyResult.rows[0];
      if (!company || row.company_id !== company.id) {
        throw new AppError('Non hai i permessi per vedere questo intervento', 403);
      }
    }
    
    res.json({
      success: true,
      data: {
        id: row.id,
        number: row.number,
        clientName: row.client_name,
        clientPhone: row.client_phone,
        clientEmail: row.client_email,
        clientAddress: row.client_address,
        clientCivicNumber: row.client_civic_number,
        clientCity: row.client_city,
        clientProvince: row.client_province,
        clientPostalCode: row.client_postal_code,
        category: row.category,
        priority: row.priority,
        description: row.description,
        status: row.status,
        company: row.company_id_ref ? {
          id: row.company_id_ref,
          name: row.company_name,
        } : null,
        technician: row.tech_id ? {
          id: row.tech_id,
          name: row.tech_name,
          phone: row.tech_phone,
        } : null,
        appointmentDate: row.appointment_date,
        appointmentNotes: row.appointment_notes,
        appointmentConfirmedAt: row.appointment_confirmed_at,
        locationLatitude: row.location_latitude,
        locationLongitude: row.location_longitude,
        locationAddress: row.location_address,
        locationTimestamp: row.location_timestamp,
        documentationNotes: row.documentation_notes,
        documentationPhotos: row.documentation_photos || [],
        startedAt: row.started_at,
        completedAt: row.completed_at,
        closedAt: row.closed_at,
        closedNotes: row.closed_notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        assignedAt: row.assigned_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireRole('MASTER'), async (req: AuthRequest, res: Response, next) => {
  try {
    const {
      clientName,
      clientPhone,
      clientEmail,
      clientAddress,
      clientCivicNumber,
      clientCity,
      clientProvince,
      clientPostalCode,
      category,
      priority,
      description,
      companyId,
    } = req.body;
    
    const user = req.user!;
    
    if (!clientName || !clientAddress || !clientCity || !category || !description) {
      throw new AppError('Nome cliente, indirizzo, città, categoria e descrizione sono obbligatori', 400);
    }
    
    if (companyId) {
      const companyResult = await pool.query<Company>(
        'SELECT * FROM companies WHERE id = $1',
        [companyId]
      );
      if (companyResult.rows.length === 0) {
        throw new AppError('Ditta non trovata', 404);
      }
    }
    
    const number = await generateInterventionNumber();
    
    const result = await pool.query<Intervention>(`
      INSERT INTO interventions (
        number, client_name, client_phone, client_email, client_address,
        client_civic_number, client_city, client_province, client_postal_code,
        category, priority, description, company_id, created_by_id, assigned_by_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `, [
      number, clientName, clientPhone, clientEmail, clientAddress,
      clientCivicNumber, clientCity, clientProvince, clientPostalCode,
      category, priority || 'normale', description, companyId, user.id, companyId ? user.id : null
    ]);
    
    const intervention = result.rows[0];
    
    res.status(201).json({
      success: true,
      data: intervention,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/assign-company', requireRole('MASTER'), async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const { companyId } = req.body;
    const user = req.user!;
    
    if (!companyId) {
      throw new AppError('ID ditta obbligatorio', 400);
    }
    
    const interventionResult = await pool.query<Intervention>(
      'SELECT * FROM interventions WHERE id = $1',
      [id]
    );
    
    if (interventionResult.rows.length === 0) {
      throw new AppError('Intervento non trovato', 404);
    }
    
    const companyResult = await pool.query<Company>(
      'SELECT * FROM companies WHERE id = $1',
      [companyId]
    );
    
    if (companyResult.rows.length === 0) {
      throw new AppError('Ditta non trovata', 404);
    }
    
    const result = await pool.query<Intervention>(`
      UPDATE interventions 
      SET company_id = $1, technician_id = NULL, status = 'assegnato',
          assigned_by_id = $2, assigned_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [companyId, user.id, id]);
    
    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/assign-technician', requireRole('DITTA'), async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const { technicianId } = req.body;
    const user = req.user!;
    
    if (!technicianId) {
      throw new AppError('ID tecnico obbligatorio', 400);
    }
    
    const interventionResult = await pool.query<Intervention>(
      'SELECT * FROM interventions WHERE id = $1',
      [id]
    );
    
    const intervention = interventionResult.rows[0];
    if (!intervention) {
      throw new AppError('Intervento non trovato', 404);
    }
    
    const companyResult = await pool.query<Company>(
      'SELECT * FROM companies WHERE owner_id = $1',
      [user.id]
    );
    
    const company = companyResult.rows[0];
    if (!company || intervention.company_id !== company.id) {
      throw new AppError('Non hai i permessi per assegnare questo intervento', 403);
    }
    
    const technicianResult = await pool.query<User>(
      'SELECT * FROM users WHERE id = $1 AND company_id = $2 AND role = $3 AND active = true',
      [technicianId, company.id, 'TECNICO']
    );
    
    if (technicianResult.rows.length === 0) {
      throw new AppError('Tecnico non trovato o non appartiene alla tua ditta', 404);
    }
    
    const result = await pool.query<Intervention>(`
      UPDATE interventions 
      SET technician_id = $1, assigned_by_id = $2, assigned_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `, [technicianId, user.id, id]);
    
    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/status', async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const { status, appointmentDate, appointmentNotes, locationLatitude, locationLongitude, locationAddress, documentationNotes, closedNotes } = req.body;
    const user = req.user!;
    
    if (!status) {
      throw new AppError('Stato obbligatorio', 400);
    }
    
    const interventionResult = await pool.query<Intervention>(
      'SELECT * FROM interventions WHERE id = $1',
      [id]
    );
    
    const intervention = interventionResult.rows[0];
    if (!intervention) {
      throw new AppError('Intervento non trovato', 404);
    }
    
    const statusTransitions: Record<string, Record<string, string[]>> = {
      MASTER: {
        assegnato: ['appuntamento_fissato', 'in_corso', 'completato', 'chiuso'],
        appuntamento_fissato: ['assegnato', 'in_corso', 'completato', 'chiuso'],
        in_corso: ['assegnato', 'appuntamento_fissato', 'completato', 'chiuso'],
        completato: ['in_corso', 'chiuso'],
        chiuso: ['completato'],
      },
      DITTA: {
        assegnato: ['appuntamento_fissato'],
        appuntamento_fissato: ['assegnato', 'in_corso'],
        in_corso: ['appuntamento_fissato', 'completato'],
        completato: ['in_corso', 'chiuso'],
        chiuso: [],
      },
      TECNICO: {
        assegnato: ['appuntamento_fissato'],
        appuntamento_fissato: ['in_corso'],
        in_corso: ['completato'],
        completato: [],
        chiuso: [],
      },
    };
    
    const allowedTransitions = statusTransitions[user.role]?.[intervention.status] || [];
    
    if (!allowedTransitions.includes(status)) {
      throw new AppError(`Non puoi cambiare lo stato da "${intervention.status}" a "${status}"`, 403);
    }
    
    if (user.role?.toUpperCase() === 'TECNICO' && intervention.technician_id !== user.id) {
      throw new AppError('Non hai i permessi per modificare questo intervento', 403);
    }
    
    if (user.role?.toUpperCase() === 'DITTA') {
      const companyResult = await pool.query<Company>(
        'SELECT * FROM companies WHERE owner_id = $1',
        [user.id]
      );
      const company = companyResult.rows[0];
      if (!company || intervention.company_id !== company.id) {
        throw new AppError('Non hai i permessi per modificare questo intervento', 403);
      }
    }
    
    const updates: string[] = ['status = $1', 'updated_at = CURRENT_TIMESTAMP'];
    const values: any[] = [status];
    let paramCount = 2;
    
    if (status === 'appuntamento_fissato' && appointmentDate) {
      updates.push(`appointment_date = $${paramCount++}`);
      values.push(appointmentDate);
      updates.push(`appointment_confirmed_at = CURRENT_TIMESTAMP`);
      if (appointmentNotes) {
        updates.push(`appointment_notes = $${paramCount++}`);
        values.push(appointmentNotes);
      }
    }
    
    if (status === 'in_corso') {
      updates.push(`started_at = CURRENT_TIMESTAMP`);
      if (locationLatitude && locationLongitude) {
        updates.push(`location_latitude = $${paramCount++}`);
        values.push(locationLatitude);
        updates.push(`location_longitude = $${paramCount++}`);
        values.push(locationLongitude);
        if (locationAddress) {
          updates.push(`location_address = $${paramCount++}`);
          values.push(locationAddress);
        }
        updates.push(`location_timestamp = CURRENT_TIMESTAMP`);
      }
    }
    
    if (status === 'completato') {
      updates.push(`completed_at = CURRENT_TIMESTAMP`);
      if (documentationNotes) {
        updates.push(`documentation_notes = $${paramCount++}`);
        values.push(documentationNotes);
      }
    }
    
    if (status === 'chiuso') {
      updates.push(`closed_at = CURRENT_TIMESTAMP`);
      if (closedNotes) {
        updates.push(`closed_notes = $${paramCount++}`);
        values.push(closedNotes);
      }
    }
    
    values.push(id);
    
    const result = await pool.query<Intervention>(
      `UPDATE interventions SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    
    const updatedIntervention = result.rows[0];
    
    if (user.role !== 'MASTER') {
      try {
        await notifyStatusChange(
          updatedIntervention.number,
          user.name,
          user.role,
          intervention.status,
          status
        );
        
        if (status === 'appuntamento_fissato' && appointmentDate) {
          await notifyAppointmentSet(
            updatedIntervention.number,
            user.name,
            user.role,
            new Date(appointmentDate)
          );
        }
      } catch (notifyError) {
        console.error('[PUSH] Error sending notification:', notifyError);
      }
    }
    
    res.json({
      success: true,
      data: updatedIntervention,
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    const user = req.user!;
    
    const interventionResult = await pool.query<Intervention>(
      'SELECT * FROM interventions WHERE id = $1',
      [id]
    );
    
    const intervention = interventionResult.rows[0];
    if (!intervention) {
      throw new AppError('Intervento non trovato', 404);
    }
    
    if (user.role?.toUpperCase() === 'TECNICO' && intervention.technician_id !== user.id) {
      throw new AppError('Non hai i permessi per modificare questo intervento', 403);
    }
    
    if (user.role?.toUpperCase() === 'DITTA') {
      const companyResult = await pool.query<Company>(
        'SELECT * FROM companies WHERE owner_id = $1',
        [user.id]
      );
      const company = companyResult.rows[0];
      if (!company || intervention.company_id !== company.id) {
        throw new AppError('Non hai i permessi per modificare questo intervento', 403);
      }
    }
    
    const allowedFields: Record<string, string[]> = {
      MASTER: ['client_name', 'client_phone', 'client_email', 'client_address', 'client_civic_number', 'client_city', 'client_province', 'client_postal_code', 'category', 'priority', 'description'],
      DITTA: ['appointment_date', 'appointment_notes', 'documentation_notes', 'closed_notes'],
      TECNICO: ['appointment_date', 'appointment_notes', 'location_latitude', 'location_longitude', 'location_address', 'documentation_notes', 'documentation_photos'],
    };
    
    const fieldMapping: Record<string, string> = {
      clientName: 'client_name',
      clientPhone: 'client_phone',
      clientEmail: 'client_email',
      clientAddress: 'client_address',
      clientCivicNumber: 'client_civic_number',
      clientCity: 'client_city',
      clientProvince: 'client_province',
      clientPostalCode: 'client_postal_code',
      appointmentDate: 'appointment_date',
      appointmentNotes: 'appointment_notes',
      locationLatitude: 'location_latitude',
      locationLongitude: 'location_longitude',
      locationAddress: 'location_address',
      documentationNotes: 'documentation_notes',
      documentationPhotos: 'documentation_photos',
      closedNotes: 'closed_notes',
    };
    
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;
    
    const allowed = allowedFields[user.role] || [];
    
    for (const [key, value] of Object.entries(req.body)) {
      const dbField = fieldMapping[key] || key;
      if (allowed.includes(dbField) && value !== undefined) {
        updates.push(`${dbField} = $${paramCount++}`);
        values.push(value);
      }
    }
    
    if (updates.length === 0) {
      throw new AppError('Nessun campo da aggiornare', 400);
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);
    
    const result = await pool.query<Intervention>(
      `UPDATE interventions SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
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

// DELETE singolo intervento - solo MASTER
router.delete('/:id', requireRole('MASTER'), async (req: AuthRequest, res: Response, next) => {
  try {
    const { id } = req.params;
    
    // Verifica che l'intervento esista
    const interventionResult = await pool.query<Intervention>(
      'SELECT * FROM interventions WHERE id = $1',
      [id]
    );
    
    if (interventionResult.rows.length === 0) {
      throw new AppError('Intervento non trovato', 404);
    }
    
    // Elimina prima le foto associate
    await pool.query('DELETE FROM photos WHERE intervention_id = $1', [id]);
    
    // Elimina l'intervento
    await pool.query('DELETE FROM interventions WHERE id = $1', [id]);
    
    res.json({
      success: true,
      message: 'Intervento eliminato con successo',
      data: {
        deleted: true,
        deletedCount: 1
      }
    });
  } catch (error) {
    next(error);
  }
});

// DELETE multipli interventi - solo MASTER
router.post('/bulk-delete', requireRole('MASTER'), async (req: AuthRequest, res: Response, next) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new AppError('Lista di ID interventi obbligatoria', 400);
    }
    
    // Elimina prima le foto associate a tutti gli interventi
    await pool.query(
      'DELETE FROM photos WHERE intervention_id = ANY($1::uuid[])',
      [ids]
    );
    
    // Elimina gli interventi
    const result = await pool.query(
      'DELETE FROM interventions WHERE id = ANY($1::uuid[]) RETURNING id',
      [ids]
    );
    
    res.json({
      success: true,
      message: `${result.rowCount} interventi eliminati con successo`,
      deletedCount: result.rowCount,
      data: {
        deleted: true,
        deletedCount: result.rowCount
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
