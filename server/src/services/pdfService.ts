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

  const launchOptions: any = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--single-process',
      '--no-zygote',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-default-apps',
      '--disable-sync',
      '--disable-translate',
      '--hide-scrollbars',
      '--metrics-recording-only',
      '--mute-audio',
      '--no-first-run',
      '--safebrowsing-disable-auto-update',
    ],
  };
  
  // Use custom Chromium path if specified (Replit/Nix environment)
  if (process.env.CHROMIUM_PATH) {
    console.log('[PDF] Using CHROMIUM_PATH:', process.env.CHROMIUM_PATH);
    launchOptions.executablePath = process.env.CHROMIUM_PATH;
  } else if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    console.log('[PDF] Using PUPPETEER_EXECUTABLE_PATH:', process.env.PUPPETEER_EXECUTABLE_PATH);
    launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  } else {
    // Check for Nix store Chromium (Replit)
    const fs = await import('fs');
    const nixChromiumPath = '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium';
    if (fs.existsSync(nixChromiumPath)) {
      console.log('[PDF] Using Nix Chromium:', nixChromiumPath);
      launchOptions.executablePath = nixChromiumPath;
    } else {
      console.log('[PDF] Using Puppeteer bundled Chromium');
    }
  }
  
  console.log('[PDF] Launching browser with options:', JSON.stringify(launchOptions, null, 2));
  
  let browser;
  try {
    browser = await puppeteer.launch(launchOptions);
  } catch (launchError: any) {
    console.error('[PDF] Failed to launch browser:', launchError.message);
    throw new Error(`Impossibile avviare il browser per la generazione PDF: ${launchError.message}`);
  }

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
