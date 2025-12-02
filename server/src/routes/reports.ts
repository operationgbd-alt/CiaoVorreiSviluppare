import { Router, Response } from 'express';
import { pool } from '../db';
import { generatePDFWithPDFKit } from '../services/pdfKitService';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { notifyReportSent } from '../services/pushNotificationService';

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
      // Handle both API format (flat: clientName) and nested format (client.name)
      const clientName = interventionData.clientName || interventionData.client?.name || 'N/D';
      const clientAddress = interventionData.clientAddress || interventionData.client?.address || '';
      const clientCivicNumber = interventionData.clientCivicNumber || '';
      const clientCity = interventionData.clientCity || interventionData.client?.city || '';
      const clientPostalCode = interventionData.clientPostalCode || '';
      const clientPhone = interventionData.clientPhone || interventionData.client?.phone || 'N/D';
      const clientEmail = interventionData.clientEmail || interventionData.client?.email || null;
      const companyName = interventionData.company?.name || interventionData.companyName || 'N/D';
      const techName = interventionData.technician?.name || interventionData.technicianName || null;
      const techPhone = interventionData.technician?.phone || '';
      
      intervention = {
        id: interventionData.id,
        title: interventionData.number || `INT-${new Date().getFullYear()}-${String(interventionData.id).substring(0, 3)}`,
        description: interventionData.description || '',
        category: interventionData.category,
        priority: interventionData.priority,
        status: interventionData.status,
        created_at: interventionData.assignedAt || interventionData.createdAt || new Date().toISOString(),
        scheduled_date: interventionData.appointmentDate || interventionData.appointment?.date || null,
        completed_at: interventionData.completedAt || interventionData.documentation?.completedAt || null,
        notes: interventionData.documentationNotes || interventionData.documentation?.notes || null,
        gps_latitude: interventionData.locationLatitude || interventionData.documentation?.gpsLocation?.latitude || null,
        gps_longitude: interventionData.locationLongitude || interventionData.documentation?.gpsLocation?.longitude || null,
        gps_timestamp: interventionData.locationTimestamp || interventionData.documentation?.gpsLocation?.timestamp || null,
        client_name: clientName,
        client_address: `${clientAddress}${clientCivicNumber ? ' ' + clientCivicNumber : ''}`.trim(),
        client_city: `${clientCity}${clientPostalCode ? ' (' + clientPostalCode + ')' : ''}`.trim(),
        client_phone: clientPhone,
        client_email: clientEmail,
        company_name: companyName,
      };

      if (techName) {
        technician = { name: techName, phone: techPhone };
      }

      // Handle both flat format (appointmentDate) and nested format (appointment.date)
      const appointmentDate = interventionData.appointmentDate || interventionData.appointment?.date;
      const appointmentNotes = interventionData.appointmentNotes || interventionData.appointment?.notes;
      if (appointmentDate) {
        appointments = [{
          date: new Date(appointmentDate),
          notes: appointmentNotes || ''
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

    // Build title from number field (e.g., "INT-2025-005")
    const interventionTitle = intervention.title || intervention.number || `INT-${intervention.id.substring(0, 8)}`;
    
    const reportData = {
      intervention: {
        id: intervention.id,
        title: interventionTitle,
        description: intervention.description || '',
        category: intervention.category,
        priority: intervention.priority,
        status: intervention.status,
        created_at: intervention.created_at,
        scheduled_date: intervention.scheduled_date || intervention.appointment_date,
        completed_at: intervention.completed_at,
        notes: intervention.notes || intervention.documentation_notes,
        gps_latitude: intervention.gps_latitude || intervention.location_latitude ? parseFloat(intervention.gps_latitude || intervention.location_latitude) : undefined,
        gps_longitude: intervention.gps_longitude || intervention.location_longitude ? parseFloat(intervention.gps_longitude || intervention.location_longitude) : undefined,
        gps_timestamp: intervention.gps_timestamp || intervention.location_timestamp,
      },
      client: {
        name: intervention.client_name || 'N/D',
        address: `${intervention.client_address || ''}${intervention.client_civic_number ? ' ' + intervention.client_civic_number : ''}`.trim() || 'N/D',
        city: `${intervention.client_city || ''}${intervention.client_postal_code ? ' (' + intervention.client_postal_code + ')' : ''}`.trim() || 'N/D',
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

  } catch (error: any) {
    console.error('[REPORT] Error generating report:', error?.message || error);
    console.error('[REPORT] Stack:', error?.stack);
    return res.status(500).json({ 
      error: 'Errore nella generazione del report',
      details: error?.message || String(error)
    });
  }
});

router.post('/notify-sent/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { recipientEmail, interventionNumber } = req.body;
    const user = req.user!;

    const userRole = user.role?.toUpperCase();
    if (userRole !== 'MASTER' && userRole !== 'DITTA') {
      return res.status(403).json({ error: 'Solo utenti MASTER e DITTA possono inviare report' });
    }

    if (userRole !== 'MASTER') {
      try {
        await notifyReportSent(
          interventionNumber || `INT-${id}`,
          user.name,
          user.role,
          recipientEmail || 'operation.gbd@gruppo-phoenix.com'
        );
        console.log('[REPORT] Notification sent for report:', interventionNumber);
      } catch (notifyError) {
        console.error('[REPORT] Error sending notification:', notifyError);
      }
    }

    res.json({
      success: true,
      message: 'Notification sent successfully',
    });
  } catch (error) {
    console.error('Error notifying report sent:', error);
    return res.status(500).json({ error: 'Errore nell\'invio della notifica' });
  }
});

export default router;
