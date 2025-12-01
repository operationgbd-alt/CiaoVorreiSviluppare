import { pool } from '../db';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: 'default' | null;
  badge?: number;
  priority?: 'default' | 'normal' | 'high';
}

interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
}

export async function savePushToken(userId: string, token: string, platform: string = 'unknown'): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO push_tokens (user_id, token, platform, updated_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id, token) 
       DO UPDATE SET platform = $3, updated_at = CURRENT_TIMESTAMP`,
      [userId, token, platform]
    );
    console.log(`[PUSH] Token saved for user ${userId}`);
  } catch (error) {
    console.error('[PUSH] Error saving token:', error);
    throw error;
  }
}

export async function removePushToken(userId: string, token: string): Promise<void> {
  try {
    await pool.query(
      'DELETE FROM push_tokens WHERE user_id = $1 AND token = $2',
      [userId, token]
    );
    console.log(`[PUSH] Token removed for user ${userId}`);
  } catch (error) {
    console.error('[PUSH] Error removing token:', error);
    throw error;
  }
}

async function getMasterPushTokens(): Promise<string[]> {
  try {
    const result = await pool.query(
      `SELECT pt.token 
       FROM push_tokens pt
       JOIN users u ON pt.user_id = u.id
       WHERE UPPER(u.role) = 'MASTER'`
    );
    return result.rows.map(row => row.token);
  } catch (error) {
    console.error('[PUSH] Error getting master tokens:', error);
    return [];
  }
}

async function sendPushNotifications(messages: PushMessage[]): Promise<void> {
  if (messages.length === 0) return;

  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const result = await response.json() as { data?: Array<{ status: string; message?: string; details?: { error?: string } }> };
    console.log('[PUSH] Notifications sent:', result);

    if (result.data) {
      result.data.forEach((ticket, index: number) => {
        if (ticket.status === 'error') {
          console.error(`[PUSH] Error for token ${messages[index].to}:`, ticket.message);
          if (ticket.details?.error === 'DeviceNotRegistered') {
            pool.query('DELETE FROM push_tokens WHERE token = $1', [messages[index].to])
              .catch(err => console.error('[PUSH] Error removing invalid token:', err));
          }
        }
      });
    }
  } catch (error) {
    console.error('[PUSH] Error sending notifications:', error);
  }
}

export async function notifyMasters(payload: NotificationPayload): Promise<void> {
  const tokens = await getMasterPushTokens();
  
  if (tokens.length === 0) {
    console.log('[PUSH] No master tokens found, skipping notification');
    return;
  }

  const messages: PushMessage[] = tokens.map(token => ({
    to: token,
    title: payload.title,
    body: payload.body,
    data: payload.data,
    sound: 'default',
    priority: 'high',
  }));

  await sendPushNotifications(messages);
}

export async function notifyAppointmentSet(
  interventionNumber: string,
  userName: string,
  userRole: string,
  appointmentDate: Date
): Promise<void> {
  const formattedDate = appointmentDate.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  await notifyMasters({
    title: `Appuntamento Fissato`,
    body: `${interventionNumber}: Appuntamento fissato per il ${formattedDate} da ${userName} (${userRole})`,
    data: {
      type: 'appointment_set',
      interventionNumber,
    },
  });
}

export async function notifyStatusChange(
  interventionNumber: string,
  userName: string,
  userRole: string,
  oldStatus: string,
  newStatus: string
): Promise<void> {
  const statusLabels: Record<string, string> = {
    assegnato: 'Assegnato',
    appuntamento_fissato: 'Appuntamento Fissato',
    in_corso: 'In Corso',
    completato: 'Completato',
    chiuso: 'Chiuso',
  };

  const newStatusLabel = statusLabels[newStatus] || newStatus;

  await notifyMasters({
    title: `Cambio Stato Intervento`,
    body: `${interventionNumber}: Stato cambiato in "${newStatusLabel}" da ${userName} (${userRole})`,
    data: {
      type: 'status_change',
      interventionNumber,
      oldStatus,
      newStatus,
    },
  });
}

export async function notifyReportSent(
  interventionNumber: string,
  userName: string,
  userRole: string,
  recipientEmail: string
): Promise<void> {
  await notifyMasters({
    title: `Report Inviato`,
    body: `${interventionNumber}: Report PDF inviato a ${recipientEmail} da ${userName} (${userRole})`,
    data: {
      type: 'report_sent',
      interventionNumber,
      recipientEmail,
    },
  });
}
