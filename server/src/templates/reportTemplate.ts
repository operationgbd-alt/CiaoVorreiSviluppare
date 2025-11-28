interface ReportData {
  intervention: {
    id: string;
    title: string;
    description: string;
    category: string;
    priority: string;
    status: string;
    createdAt: string;
    scheduledDate?: string;
    completedAt?: string;
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
  gps?: {
    latitude: number;
    longitude: number;
    timestamp: string;
  };
  notes: string;
  photos: Array<{
    id: string;
    imageUrl: string;
    timestamp: string;
    description?: string;
  }>;
  appointments: Array<{
    date: string;
    notes?: string;
  }>;
}

const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    sopralluogo: 'Sopralluogo',
    installazione: 'Installazione',
    manutenzione: 'Manutenzione',
  };
  return labels[category] || category;
};

const getPriorityLabel = (priority: string): string => {
  const labels: Record<string, string> = {
    low: 'Bassa',
    normal: 'Normale',
    high: 'Alta',
    urgent: 'Urgente',
  };
  return labels[priority] || priority;
};

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    assegnato: 'Assegnato',
    appuntamento_fissato: 'Appuntamento Fissato',
    in_corso: 'In Corso',
    completato: 'Completato',
    chiuso: 'Chiuso',
  };
  return labels[status] || status;
};

const getPriorityColor = (priority: string): string => {
  const colors: Record<string, string> = {
    low: '#34C759',
    normal: '#0066CC',
    high: '#FF9500',
    urgent: '#FF3B30',
  };
  return colors[priority] || '#0066CC';
};

const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
};

export const generateReportHTML = (data: ReportData): string => {
  const photosHTML = data.photos.length > 0
    ? data.photos.map((photo, index) => `
        <div class="photo-item">
          <img src="${photo.imageUrl}" alt="Foto ${index + 1}" />
          <div class="photo-caption">
            <span>Foto ${index + 1}</span>
            <span class="photo-date">${formatDate(photo.timestamp)}</span>
          </div>
        </div>
      `).join('')
    : '<p class="no-data">Nessuna foto documentata</p>';

  const appointmentsHTML = data.appointments.length > 0
    ? data.appointments.map(apt => `
        <div class="appointment-item">
          <span class="appointment-date">${formatDate(apt.date)}</span>
          ${apt.notes ? `<span class="appointment-notes">${apt.notes}</span>` : ''}
        </div>
      `).join('')
    : '<p class="no-data">Nessun appuntamento registrato</p>';

  return `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Report Intervento - ${data.intervention.id}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 12px;
      line-height: 1.5;
      color: #1a1a1a;
      background: #fff;
      padding: 20px;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 20px;
      border-bottom: 3px solid #0066CC;
      margin-bottom: 24px;
    }
    
    .logo-section {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .logo-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #0066CC 0%, #004999 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .logo-icon svg {
      width: 28px;
      height: 28px;
      fill: white;
    }
    
    .company-name {
      font-size: 24px;
      font-weight: 700;
      color: #0066CC;
    }
    
    .report-title {
      font-size: 14px;
      color: #666;
      text-align: right;
    }
    
    .report-id {
      font-size: 18px;
      font-weight: 600;
      color: #1a1a1a;
    }
    
    .section {
      margin-bottom: 24px;
      page-break-inside: avoid;
    }
    
    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: #0066CC;
      padding-bottom: 8px;
      border-bottom: 1px solid #e0e0e0;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .section-icon {
      width: 20px;
      height: 20px;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    
    .info-item {
      display: flex;
      flex-direction: column;
    }
    
    .info-label {
      font-size: 10px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    
    .info-value {
      font-size: 13px;
      font-weight: 500;
      color: #1a1a1a;
    }
    
    .info-full {
      grid-column: 1 / -1;
    }
    
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
    }
    
    .badge-category {
      background: #E8F4FD;
      color: #0066CC;
    }
    
    .badge-priority {
      color: white;
    }
    
    .badge-status {
      background: #E8F4FD;
      color: #0066CC;
    }
    
    .client-card {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 16px;
    }
    
    .client-name {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    
    .client-detail {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 4px;
      color: #444;
    }
    
    .gps-section {
      background: #f0f9ff;
      border-radius: 8px;
      padding: 16px;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .gps-icon {
      width: 40px;
      height: 40px;
      background: #0066CC;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .gps-icon svg {
      width: 20px;
      height: 20px;
      fill: white;
    }
    
    .gps-coords {
      font-family: 'SF Mono', Monaco, monospace;
      font-size: 13px;
      color: #1a1a1a;
    }
    
    .gps-timestamp {
      font-size: 11px;
      color: #666;
      margin-top: 4px;
    }
    
    .notes-content {
      background: #fffbeb;
      border-left: 4px solid #FF9500;
      padding: 16px;
      border-radius: 0 8px 8px 0;
      white-space: pre-wrap;
      font-size: 13px;
    }
    
    .photos-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    
    .photo-item {
      page-break-inside: avoid;
    }
    
    .photo-item img {
      width: 100%;
      height: 200px;
      object-fit: cover;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
    }
    
    .photo-caption {
      display: flex;
      justify-content: space-between;
      margin-top: 6px;
      font-size: 11px;
      color: #666;
    }
    
    .appointment-item {
      display: flex;
      justify-content: space-between;
      padding: 10px;
      background: #f8f9fa;
      border-radius: 6px;
      margin-bottom: 8px;
    }
    
    .appointment-date {
      font-weight: 600;
      color: #0066CC;
    }
    
    .appointment-notes {
      color: #666;
      font-size: 11px;
    }
    
    .no-data {
      color: #999;
      font-style: italic;
      padding: 12px;
      text-align: center;
      background: #f8f9fa;
      border-radius: 6px;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      text-align: center;
      color: #666;
      font-size: 10px;
    }
    
    .signature-section {
      margin-top: 40px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
    }
    
    .signature-box {
      border-top: 1px solid #1a1a1a;
      padding-top: 8px;
      text-align: center;
    }
    
    .signature-label {
      font-size: 11px;
      color: #666;
    }
    
    @media print {
      body {
        padding: 0;
      }
      
      .section {
        page-break-inside: avoid;
      }
      
      .photos-grid {
        page-break-before: auto;
      }
      
      .photo-item {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-section">
      <div class="logo-icon">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l6.9 3.45-6.9 3.45-6.9-3.45L12 4.18zM4 8.72l7 3.5v6.56l-7-3.5V8.72zm9 10.06V12.22l7-3.5v6.56l-7 3.5z"/>
        </svg>
      </div>
      <div>
        <div class="company-name">SolarTech</div>
        <div style="font-size: 11px; color: #666;">${data.company.name}</div>
      </div>
    </div>
    <div class="report-title">
      <div>Report Intervento</div>
      <div class="report-id">${data.intervention.id}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">
      <svg class="section-icon" viewBox="0 0 24 24" fill="#0066CC">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
        <path d="M7 12h2v5H7zm4-3h2v8h-2zm4-3h2v11h-2z"/>
      </svg>
      Dettagli Intervento
    </div>
    <div class="info-grid">
      <div class="info-item info-full">
        <span class="info-label">Titolo</span>
        <span class="info-value">${data.intervention.title}</span>
      </div>
      <div class="info-item info-full">
        <span class="info-label">Descrizione</span>
        <span class="info-value">${data.intervention.description || 'Nessuna descrizione'}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Categoria</span>
        <span class="badge badge-category">${getCategoryLabel(data.intervention.category)}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Priorità</span>
        <span class="badge badge-priority" style="background-color: ${getPriorityColor(data.intervention.priority)}">${getPriorityLabel(data.intervention.priority)}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Stato</span>
        <span class="badge badge-status">${getStatusLabel(data.intervention.status)}</span>
      </div>
      <div class="info-item">
        <span class="info-label">Data Creazione</span>
        <span class="info-value">${formatDate(data.intervention.createdAt)}</span>
      </div>
      ${data.intervention.scheduledDate ? `
      <div class="info-item">
        <span class="info-label">Data Programmata</span>
        <span class="info-value">${formatDate(data.intervention.scheduledDate)}</span>
      </div>
      ` : ''}
      ${data.intervention.completedAt ? `
      <div class="info-item">
        <span class="info-label">Data Completamento</span>
        <span class="info-value">${formatDate(data.intervention.completedAt)}</span>
      </div>
      ` : ''}
    </div>
  </div>

  <div class="section">
    <div class="section-title">
      <svg class="section-icon" viewBox="0 0 24 24" fill="#0066CC">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
      </svg>
      Dati Cliente
    </div>
    <div class="client-card">
      <div class="client-name">${data.client.name}</div>
      <div class="client-detail">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#666">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
        ${data.client.address}, ${data.client.city}
      </div>
      <div class="client-detail">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#666">
          <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
        </svg>
        ${data.client.phone}
      </div>
      ${data.client.email ? `
      <div class="client-detail">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#666">
          <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
        </svg>
        ${data.client.email}
      </div>
      ` : ''}
    </div>
  </div>

  ${data.technician ? `
  <div class="section">
    <div class="section-title">
      <svg class="section-icon" viewBox="0 0 24 24" fill="#0066CC">
        <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>
      </svg>
      Tecnico Assegnato
    </div>
    <div class="info-grid">
      <div class="info-item">
        <span class="info-label">Nome</span>
        <span class="info-value">${data.technician.name}</span>
      </div>
      ${data.technician.phone ? `
      <div class="info-item">
        <span class="info-label">Telefono</span>
        <span class="info-value">${data.technician.phone}</span>
      </div>
      ` : ''}
    </div>
  </div>
  ` : ''}

  ${data.gps ? `
  <div class="section">
    <div class="section-title">
      <svg class="section-icon" viewBox="0 0 24 24" fill="#0066CC">
        <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3c-.46-4.17-3.77-7.48-7.94-7.94V1h-2v2.06C6.83 3.52 3.52 6.83 3.06 11H1v2h2.06c.46 4.17 3.77 7.48 7.94 7.94V23h2v-2.06c4.17-.46 7.48-3.77 7.94-7.94H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/>
      </svg>
      Posizione GPS
    </div>
    <div class="gps-section">
      <div class="gps-icon">
        <svg viewBox="0 0 24 24">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>
      <div>
        <div class="gps-coords">
          Lat: ${data.gps.latitude.toFixed(6)} | Lon: ${data.gps.longitude.toFixed(6)}
        </div>
        <div class="gps-timestamp">Rilevato il ${formatDate(data.gps.timestamp)}</div>
      </div>
    </div>
  </div>
  ` : ''}

  <div class="section">
    <div class="section-title">
      <svg class="section-icon" viewBox="0 0 24 24" fill="#0066CC">
        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
      </svg>
      Note Intervento
    </div>
    ${data.notes ? `
    <div class="notes-content">${data.notes}</div>
    ` : '<p class="no-data">Nessuna nota inserita</p>'}
  </div>

  <div class="section">
    <div class="section-title">
      <svg class="section-icon" viewBox="0 0 24 24" fill="#0066CC">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5-7l-3 3.72L9 13l-3 4h12l-4-5z"/>
      </svg>
      Documentazione Fotografica (${data.photos.length} foto)
    </div>
    <div class="photos-grid">
      ${photosHTML}
    </div>
  </div>

  <div class="section">
    <div class="section-title">
      <svg class="section-icon" viewBox="0 0 24 24" fill="#0066CC">
        <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z"/>
      </svg>
      Storico Appuntamenti
    </div>
    ${appointmentsHTML}
  </div>

  <div class="signature-section">
    <div class="signature-box">
      <div class="signature-label">Firma Tecnico</div>
    </div>
    <div class="signature-box">
      <div class="signature-label">Firma Cliente</div>
    </div>
  </div>

  <div class="footer">
    <p>Report generato automaticamente da SolarTech - ${new Date().toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
    <p>Documento riservato - ${data.company.name}</p>
  </div>
</body>
</html>
  `;
};
