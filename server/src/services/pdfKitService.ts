import PDFDocument from 'pdfkit';

interface PhotoData {
  id: string;
  intervention_id?: string;
  photo_data: string | Buffer;
  file_name?: string;
  mime_type: string;
  description?: string;
  created_at: string;
}

function normalizePhotoData(photo: PhotoData): Buffer | null {
  try {
    const photoData = photo.photo_data;
    
    if (Buffer.isBuffer(photoData)) {
      return photoData;
    }
    
    if (typeof photoData === 'string') {
      if (photoData.startsWith('data:')) {
        const matches = photoData.match(/data:[^;]+;base64,(.+)/);
        if (matches && matches[1]) {
          return Buffer.from(matches[1], 'base64');
        }
      }
      
      const base64Regex = /^[A-Za-z0-9+/=]+$/;
      if (base64Regex.test(photoData) && photoData.length > 100) {
        return Buffer.from(photoData, 'base64');
      }
    }
    
    console.log('[PDF] Unable to normalize photo data for photo:', photo.id);
    return null;
  } catch (error) {
    console.error('[PDF] Error normalizing photo data:', error);
    return null;
  }
}

interface ReportInput {
  intervention: {
    id: string;
    title: string;
    description: string;
    category: string;
    priority: string;
    status: string;
    created_at: string;
    scheduled_date?: string;
    completed_at?: string;
    notes?: string;
    gps_latitude?: number;
    gps_longitude?: number;
    gps_timestamp?: string;
  };
  client: {
    name: string;
    address: string;
    city: string;
    phone: string;
    email?: string;
  };
  company: {
    name: string;
  };
  technician?: {
    name: string;
    phone?: string;
  };
  photos: PhotoData[];
  appointments: Array<{
    date: string;
    notes?: string;
  }>;
}

function formatDate(dateString?: string): string {
  if (!dateString) return 'N/D';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

function formatDateTime(dateString?: string): string {
  if (!dateString) return 'N/D';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

function translateCategory(category: string): string {
  const translations: Record<string, string> = {
    sopralluogo: 'Sopralluogo',
    installazione: 'Installazione',
    manutenzione: 'Manutenzione',
  };
  return translations[category] || category;
}

function translatePriority(priority: string): string {
  const translations: Record<string, string> = {
    bassa: 'Bassa',
    normale: 'Normale',
    alta: 'Alta',
    urgente: 'Urgente',
  };
  return translations[priority] || priority;
}

function translateStatus(status: string): string {
  const translations: Record<string, string> = {
    assegnato: 'Assegnato',
    appuntamento_fissato: 'Appuntamento Fissato',
    in_corso: 'In Corso',
    completato: 'Completato',
    chiuso: 'Chiuso',
  };
  return translations[status] || status;
}

const COLORS = {
  primary: '#0066CC',
  secondary: '#FF9500',
  success: '#34C759',
  danger: '#FF3B30',
  text: '#1C1C1E',
  textSecondary: '#8E8E93',
  border: '#E5E5EA',
  background: '#F5F5F7',
};

export async function generatePDFWithPDFKit(data: ReportInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
        info: {
          Title: `Report Intervento - ${data.intervention.title}`,
          Author: data.company.name,
          Subject: 'Report Intervento Fotovoltaico',
          Creator: 'SolarTech App',
        },
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);

      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

      doc.fillColor(COLORS.primary)
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('REPORT INTERVENTO', { align: 'center' });
      
      doc.moveDown(0.5);
      
      doc.fillColor(COLORS.textSecondary)
        .fontSize(12)
        .font('Helvetica')
        .text(data.company.name, { align: 'center' });
      
      doc.moveDown(0.3);
      doc.text(`Generato il ${formatDateTime(new Date().toISOString())}`, { align: 'center' });
      
      doc.moveDown(1.5);

      doc.strokeColor(COLORS.border)
        .lineWidth(1)
        .moveTo(doc.page.margins.left, doc.y)
        .lineTo(doc.page.width - doc.page.margins.right, doc.y)
        .stroke();
      
      doc.moveDown(1);

      doc.fillColor(COLORS.primary)
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('DETTAGLI INTERVENTO');
      
      doc.moveDown(0.5);
      
      const detailsStartY = doc.y;
      const colWidth = pageWidth / 2;
      
      doc.fillColor(COLORS.text)
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('ID:', doc.page.margins.left, detailsStartY);
      doc.font('Helvetica')
        .text(data.intervention.id, doc.page.margins.left + 80, detailsStartY);
      
      doc.font('Helvetica-Bold')
        .text('Titolo:', doc.page.margins.left, doc.y + 5);
      doc.font('Helvetica')
        .text(data.intervention.title, doc.page.margins.left + 80, doc.y - 10);
      
      doc.font('Helvetica-Bold')
        .text('Categoria:', doc.page.margins.left, doc.y + 5);
      doc.font('Helvetica')
        .text(translateCategory(data.intervention.category), doc.page.margins.left + 80, doc.y - 10);
      
      doc.font('Helvetica-Bold')
        .text('Priorita\':', doc.page.margins.left, doc.y + 5);
      doc.font('Helvetica')
        .text(translatePriority(data.intervention.priority), doc.page.margins.left + 80, doc.y - 10);
      
      doc.font('Helvetica-Bold')
        .text('Stato:', doc.page.margins.left, doc.y + 5);
      doc.font('Helvetica')
        .text(translateStatus(data.intervention.status), doc.page.margins.left + 80, doc.y - 10);
      
      doc.font('Helvetica-Bold')
        .text('Creato il:', doc.page.margins.left, doc.y + 5);
      doc.font('Helvetica')
        .text(formatDate(data.intervention.created_at), doc.page.margins.left + 80, doc.y - 10);
      
      if (data.intervention.scheduled_date) {
        doc.font('Helvetica-Bold')
          .text('Appuntamento:', doc.page.margins.left, doc.y + 5);
        doc.font('Helvetica')
          .text(formatDate(data.intervention.scheduled_date), doc.page.margins.left + 80, doc.y - 10);
      }
      
      if (data.intervention.completed_at) {
        doc.font('Helvetica-Bold')
          .text('Completato il:', doc.page.margins.left, doc.y + 5);
        doc.font('Helvetica')
          .text(formatDateTime(data.intervention.completed_at), doc.page.margins.left + 80, doc.y - 10);
      }
      
      doc.moveDown(1.5);

      if (data.intervention.description) {
        doc.fillColor(COLORS.primary)
          .fontSize(14)
          .font('Helvetica-Bold')
          .text('DESCRIZIONE');
        
        doc.moveDown(0.5);
        
        doc.fillColor(COLORS.text)
          .fontSize(10)
          .font('Helvetica')
          .text(data.intervention.description, {
            width: pageWidth,
            align: 'justify',
          });
        
        doc.moveDown(1);
      }

      doc.fillColor(COLORS.primary)
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('DATI CLIENTE');
      
      doc.moveDown(0.5);
      
      doc.fillColor(COLORS.text)
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Nome:', doc.page.margins.left, doc.y);
      doc.font('Helvetica')
        .text(data.client.name, doc.page.margins.left + 80, doc.y - 10);
      
      doc.font('Helvetica-Bold')
        .text('Indirizzo:', doc.page.margins.left, doc.y + 5);
      doc.font('Helvetica')
        .text(data.client.address, doc.page.margins.left + 80, doc.y - 10);
      
      doc.font('Helvetica-Bold')
        .text('Citta\':', doc.page.margins.left, doc.y + 5);
      doc.font('Helvetica')
        .text(data.client.city, doc.page.margins.left + 80, doc.y - 10);
      
      doc.font('Helvetica-Bold')
        .text('Telefono:', doc.page.margins.left, doc.y + 5);
      doc.font('Helvetica')
        .text(data.client.phone, doc.page.margins.left + 80, doc.y - 10);
      
      if (data.client.email) {
        doc.font('Helvetica-Bold')
          .text('Email:', doc.page.margins.left, doc.y + 5);
        doc.font('Helvetica')
          .text(data.client.email, doc.page.margins.left + 80, doc.y - 10);
      }
      
      doc.moveDown(1);

      if (data.technician) {
        doc.fillColor(COLORS.primary)
          .fontSize(14)
          .font('Helvetica-Bold')
          .text('TECNICO ASSEGNATO');
        
        doc.moveDown(0.5);
        
        doc.fillColor(COLORS.text)
          .fontSize(10)
          .font('Helvetica-Bold')
          .text('Nome:', doc.page.margins.left, doc.y);
        doc.font('Helvetica')
          .text(data.technician.name, doc.page.margins.left + 80, doc.y - 10);
        
        if (data.technician.phone) {
          doc.font('Helvetica-Bold')
            .text('Telefono:', doc.page.margins.left, doc.y + 5);
          doc.font('Helvetica')
            .text(data.technician.phone, doc.page.margins.left + 80, doc.y - 10);
        }
        
        doc.moveDown(1);
      }

      if (data.intervention.gps_latitude && data.intervention.gps_longitude) {
        doc.fillColor(COLORS.primary)
          .fontSize(14)
          .font('Helvetica-Bold')
          .text('COORDINATE GPS');
        
        doc.moveDown(0.5);
        
        doc.fillColor(COLORS.text)
          .fontSize(10)
          .font('Helvetica-Bold')
          .text('Latitudine:', doc.page.margins.left, doc.y);
        doc.font('Helvetica')
          .text(data.intervention.gps_latitude.toFixed(6), doc.page.margins.left + 80, doc.y - 10);
        
        doc.font('Helvetica-Bold')
          .text('Longitudine:', doc.page.margins.left, doc.y + 5);
        doc.font('Helvetica')
          .text(data.intervention.gps_longitude.toFixed(6), doc.page.margins.left + 80, doc.y - 10);
        
        if (data.intervention.gps_timestamp) {
          doc.font('Helvetica-Bold')
            .text('Rilevato il:', doc.page.margins.left, doc.y + 5);
          doc.font('Helvetica')
            .text(formatDateTime(data.intervention.gps_timestamp), doc.page.margins.left + 80, doc.y - 10);
        }
        
        doc.moveDown(0.5);
        doc.fillColor(COLORS.textSecondary)
          .fontSize(8)
          .text(`Google Maps: https://maps.google.com/?q=${data.intervention.gps_latitude},${data.intervention.gps_longitude}`);
        
        doc.moveDown(1);
      }

      if (data.intervention.notes) {
        doc.fillColor(COLORS.primary)
          .fontSize(14)
          .font('Helvetica-Bold')
          .text('NOTE LAVORO');
        
        doc.moveDown(0.5);
        
        doc.fillColor(COLORS.text)
          .fontSize(10)
          .font('Helvetica')
          .text(data.intervention.notes, {
            width: pageWidth,
            align: 'justify',
          });
        
        doc.moveDown(1);
      }

      if (data.appointments && data.appointments.length > 0) {
        doc.fillColor(COLORS.primary)
          .fontSize(14)
          .font('Helvetica-Bold')
          .text('STORICO APPUNTAMENTI');
        
        doc.moveDown(0.5);
        
        data.appointments.forEach((apt, index) => {
          doc.fillColor(COLORS.text)
            .fontSize(10)
            .font('Helvetica-Bold')
            .text(`${index + 1}. ${formatDate(apt.date)}`, doc.page.margins.left, doc.y);
          
          if (apt.notes) {
            doc.font('Helvetica')
              .fillColor(COLORS.textSecondary)
              .text(`   ${apt.notes}`, doc.page.margins.left + 20, doc.y);
          }
          doc.moveDown(0.3);
        });
        
        doc.moveDown(1);
      }

      if (data.photos && data.photos.length > 0) {
        doc.addPage();
        
        doc.fillColor(COLORS.primary)
          .fontSize(14)
          .font('Helvetica-Bold')
          .text(`DOCUMENTAZIONE FOTOGRAFICA (${data.photos.length} foto)`);
        
        doc.moveDown(1);
        
        const photoWidth = (pageWidth - 20) / 2;
        const photoHeight = 150;
        let x = doc.page.margins.left;
        let y = doc.y;
        let validPhotosRendered = 0;
        
        for (let index = 0; index < data.photos.length; index++) {
          const photo = data.photos[index];
          
          if (y + photoHeight + 40 > doc.page.height - doc.page.margins.bottom) {
            doc.addPage();
            y = doc.page.margins.top;
          }
          
          let imageRendered = false;
          
          try {
            const normalizedData = normalizePhotoData(photo);
            
            if (normalizedData && normalizedData.length > 0) {
              doc.image(normalizedData, x, y, {
                fit: [photoWidth, photoHeight],
                align: 'center',
                valign: 'center',
              });
              imageRendered = true;
              validPhotosRendered++;
            }
          } catch (imgError) {
            console.error(`[PDF] Error rendering photo ${index + 1}:`, imgError);
          }
          
          if (!imageRendered) {
            doc.rect(x, y, photoWidth, photoHeight)
              .strokeColor(COLORS.border)
              .stroke();
            doc.fillColor(COLORS.textSecondary)
              .fontSize(10)
              .text('Immagine non disponibile', x + 10, y + photoHeight / 2 - 5, {
                width: photoWidth - 20,
                align: 'center',
              });
          }
          
          doc.fillColor(COLORS.textSecondary)
            .fontSize(8)
            .text(`Foto ${index + 1} - ${formatDateTime(photo.created_at)}`, x, y + photoHeight + 5, {
              width: photoWidth,
              align: 'center',
            });
          
          if (photo.description) {
            doc.text(photo.description, x, y + photoHeight + 15, {
              width: photoWidth,
              align: 'center',
            });
          }
          
          if (index % 2 === 0) {
            x = doc.page.margins.left + photoWidth + 20;
          } else {
            x = doc.page.margins.left;
            y = doc.y + 40;
          }
        }
        
        console.log(`[PDF] Rendered ${validPhotosRendered}/${data.photos.length} photos successfully`);
      }

      const footerY = doc.page.height - 30;
      doc.fillColor(COLORS.textSecondary)
        .fontSize(8)
        .text(
          `Report generato da SolarTech - ${data.company.name} - ${formatDateTime(new Date().toISOString())}`,
          doc.page.margins.left,
          footerY,
          {
            width: pageWidth,
            align: 'center',
          }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
