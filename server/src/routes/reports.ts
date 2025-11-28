import { Router, Response } from 'express';
import { pool } from '../db';
import { generatePDF } from '../services/pdfService';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/intervention/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { format = 'pdf' } = req.query;

  try {
    const interventionResult = await pool.query(
      `SELECT 
        i.*,
        c.name as company_name
      FROM interventions i
      LEFT JOIN companies c ON i.company_id = c.id
      WHERE i.id = $1`,
      [id]
    );

    if (interventionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Intervento non trovato' });
    }

    const intervention = interventionResult.rows[0];

    let technician = null;
    if (intervention.technician_id) {
      const techResult = await pool.query(
        'SELECT name, phone FROM users WHERE id = $1',
        [intervention.technician_id]
      );
      if (techResult.rows.length > 0) {
        technician = techResult.rows[0];
      }
    }

    const photosResult = await pool.query(
      `SELECT id, intervention_id, photo_data, file_name, mime_type, description, created_at
       FROM photos 
       WHERE intervention_id = $1 
       ORDER BY created_at ASC`,
      [id]
    );

    const appointmentsResult = await pool.query(
      `SELECT scheduled_date as date, appointment_notes as notes
       FROM interventions 
       WHERE id = $1 AND scheduled_date IS NOT NULL`,
      [id]
    );

    const appointments = intervention.scheduled_date
      ? [{
          date: intervention.scheduled_date,
          notes: intervention.appointment_notes || undefined
        }]
      : [];

    const reportData = {
      intervention: {
        id: intervention.id,
        title: intervention.title,
        description: intervention.description || '',
        category: intervention.category,
        priority: intervention.priority,
        status: intervention.status,
        created_at: intervention.created_at,
        scheduled_date: intervention.scheduled_date,
        completed_at: intervention.completed_at,
        notes: intervention.notes,
        gps_latitude: intervention.gps_latitude ? parseFloat(intervention.gps_latitude) : undefined,
        gps_longitude: intervention.gps_longitude ? parseFloat(intervention.gps_longitude) : undefined,
        gps_timestamp: intervention.gps_timestamp,
      },
      client: {
        name: intervention.client_name || 'N/D',
        address: intervention.client_address || 'N/D',
        city: intervention.client_city || 'N/D',
        phone: intervention.client_phone || 'N/D',
        email: intervention.client_email,
      },
      company: {
        name: intervention.company_name || 'N/D',
      },
      technician: technician ? {
        name: technician.name,
        phone: technician.phone,
      } : undefined,
      photos: photosResult.rows,
      appointments,
    };

    const pdfBuffer = await generatePDF(reportData);

    if (format === 'base64') {
      return res.json({
        success: true,
        data: pdfBuffer.toString('base64'),
        filename: `Report_${intervention.id}_${new Date().toISOString().split('T')[0]}.pdf`,
        mimeType: 'application/pdf',
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Report_${intervention.id}_${new Date().toISOString().split('T')[0]}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating report:', error);
    return res.status(500).json({ error: 'Errore nella generazione del report' });
  }
});

export default router;
