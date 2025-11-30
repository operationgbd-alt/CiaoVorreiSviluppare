import { Router, Response } from 'express';
import { pool } from '../db';
import { generatePDFWithPDFKit } from '../services/pdfKitService';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/intervention/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { format = 'pdf' } = req.query;
  const interventionData = req.body?.interventionData;
  
  console.log('[REPORT] Generating report for intervention:', id);
  console.log('[REPORT] User:', req.user?.username, 'Role:', req.user?.role);
  console.log('[REPORT] Has interventionData:', !!interventionData);
  
  const userRole = req.user?.role?.toUpperCase();
  if (!req.user || (userRole !== 'MASTER' && userRole !== 'DITTA')) {
    console.log('[REPORT] Access denied for role:', userRole);
    return res.status(403).json({ error: 'Solo utenti MASTER e DITTA possono generare report' });
  }

  try {
    let intervention: any = null;
    let technician: any = null;
    let photos: any[] = [];
    let appointments: any[] = [];

    if (interventionData) {
      intervention = {
        id: interventionData.id,
        title: `INT-${new Date().getFullYear()}-${String(interventionData.number).padStart(3, '0')}`,
        description: interventionData.description || '',
        category: interventionData.category,
        priority: interventionData.priority,
        status: interventionData.status,
        created_at: new Date(interventionData.assignedAt),
        scheduled_date: interventionData.appointment?.date ? new Date(interventionData.appointment.date) : null,
        completed_at: interventionData.documentation?.completedAt ? new Date(interventionData.documentation.completedAt) : null,
        notes: interventionData.documentation?.notes,
        gps_latitude: interventionData.documentation?.gpsLocation?.latitude,
        gps_longitude: interventionData.documentation?.gpsLocation?.longitude,
        gps_timestamp: interventionData.documentation?.gpsLocation?.timestamp ? new Date(interventionData.documentation.gpsLocation.timestamp) : null,
        client_name: interventionData.client?.name,
        client_address: interventionData.client?.address,
        client_city: '',
        client_phone: interventionData.client?.phone,
        client_email: interventionData.client?.email,
        company_name: interventionData.companyName || 'N/D',
      };

      if (interventionData.technicianName) {
        technician = { name: interventionData.technicianName, phone: '' };
      }

      if (interventionData.appointment) {
        appointments = [{
          date: new Date(interventionData.appointment.date),
          notes: interventionData.appointment.notes
        }];
      }

      if (interventionData.documentation?.photos) {
        console.log('[REPORT] Processing photos:', interventionData.documentation.photos.length);
        photos = interventionData.documentation.photos
          .filter((p: any) => {
            const hasValidData = (p.data && p.data.includes('base64')) || (p.uri && p.uri.includes('base64'));
            if (!hasValidData) {
              console.log('[REPORT] Skipping photo without base64 data:', p.id);
            }
            return hasValidData;
          })
          .map((p: any, index: number) => {
            let photoData = '';
            let mimeType = 'image/jpeg';
            
            const source = p.data || p.uri || '';
            if (source.includes('data:')) {
              const matches = source.match(/data:([^;]+);base64,(.+)/);
              if (matches) {
                mimeType = matches[1];
                photoData = matches[2];
              }
            } else if (source.includes('base64')) {
              photoData = source;
            }
            
            console.log(`[REPORT] Photo ${index + 1}: has data = ${photoData.length > 0}, mime = ${mimeType}`);
            
            return {
              id: p.id,
              photo_data: photoData,
              mime_type: p.mimeType || mimeType,
              description: p.caption || `Foto ${index + 1}`,
              created_at: p.timestamp ? new Date(p.timestamp) : (p.takenAt ? new Date(p.takenAt) : new Date())
            };
          });
        console.log('[REPORT] Valid photos for report:', photos.length);
      }
    } else {
      let interventionResult;
      
      console.log('[REPORT] Fetching intervention from database, ID:', id, 'Role:', userRole);
      
      if (userRole === 'MASTER') {
        interventionResult = await pool.query(
          `SELECT 
            i.*,
            c.name as company_name
          FROM interventions i
          LEFT JOIN companies c ON i.company_id = c.id
          WHERE i.id = $1`,
          [id]
        );
        console.log('[REPORT] MASTER query result rows:', interventionResult.rows.length);
      } else if (userRole === 'DITTA') {
        if (!req.user.companyId) {
          return res.status(403).json({ error: 'Utente non associato a un\'azienda' });
        }
        interventionResult = await pool.query(
          `SELECT 
            i.*,
            c.name as company_name
          FROM interventions i
          LEFT JOIN companies c ON i.company_id = c.id
          WHERE i.id = $1 AND i.company_id = $2`,
          [id, req.user.companyId]
        );
      } else {
        return res.status(403).json({ error: 'Accesso non autorizzato' });
      }

      if (interventionResult.rows.length === 0) {
        return res.status(404).json({ error: 'Intervento non trovato' });
      }

      intervention = interventionResult.rows[0];

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
        `SELECT id, intervention_id, data as photo_data, mime_type, caption as description, created_at
         FROM photos 
         WHERE intervention_id = $1 
         ORDER BY created_at ASC`,
        [id]
      );
      photos = photosResult.rows;

      if (intervention.scheduled_date) {
        appointments = [{
          date: intervention.scheduled_date,
          notes: intervention.appointment_notes || undefined
        }];
      }
    }

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
      photos: photos,
      appointments,
    };

    const pdfBuffer = await generatePDFWithPDFKit(reportData);

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
