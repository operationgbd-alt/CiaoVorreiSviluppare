import puppeteer from 'puppeteer';
import { generateReportHTML } from '../templates/reportTemplate';

interface PhotoData {
  id: string;
  intervention_id: string;
  photo_data: string;
  file_name: string;
  mime_type: string;
  description?: string;
  created_at: string;
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

export async function generatePDF(data: ReportInput): Promise<Buffer> {
  const photosWithDataUri = data.photos.map((photo, index) => ({
    id: photo.id,
    imageUrl: `data:${photo.mime_type};base64,${photo.photo_data}`,
    timestamp: photo.created_at,
    description: photo.description || `Foto ${index + 1}`,
  }));

  const reportData = {
    intervention: {
      id: data.intervention.id,
      title: data.intervention.title,
      description: data.intervention.description,
      category: data.intervention.category,
      priority: data.intervention.priority,
      status: data.intervention.status,
      createdAt: data.intervention.created_at,
      scheduledDate: data.intervention.scheduled_date,
      completedAt: data.intervention.completed_at,
    },
    client: data.client,
    company: data.company,
    technician: data.technician,
    gps: data.intervention.gps_latitude && data.intervention.gps_longitude
      ? {
          latitude: data.intervention.gps_latitude,
          longitude: data.intervention.gps_longitude,
          timestamp: data.intervention.gps_timestamp || new Date().toISOString(),
        }
      : undefined,
    notes: data.intervention.notes || '',
    photos: photosWithDataUri,
    appointments: data.appointments,
  };

  const html = generateReportHTML(reportData);

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });

  try {
    const page = await browser.newPage();
    
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px',
      },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}
