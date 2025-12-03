import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { savePushToken, removePushToken, notifyMasters } from '../services/pushNotificationService';

const router = Router();

router.use(authMiddleware);

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { token, platform } = req.body;
    const userId = req.user!.id;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required',
      });
    }

    await savePushToken(userId, token, platform || 'unknown');

    res.json({
      success: true,
      message: 'Push token saved successfully',
    });
  } catch (error) {
    console.error('[PUSH] Error saving token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save push token',
    });
  }
});

router.delete('/', async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.body;
    const userId = req.user!.id;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required',
      });
    }

    await removePushToken(userId, token);

    res.json({
      success: true,
      message: 'Push token removed successfully',
    });
  } catch (error) {
    console.error('[PUSH] Error removing token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove push token',
    });
  }
});

router.post('/notify-appointment/:interventionId', async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role?.toLowerCase();
    if (userRole === 'master') {
      return res.json({
        success: true,
        message: 'MASTER users do not need self-notification',
      });
    }

    const { interventionId } = req.params;
    const { interventionNumber, clientName, appointmentDate } = req.body;

    const formattedDate = new Date(appointmentDate).toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    await notifyMasters({
      title: 'Appuntamento Fissato',
      body: `Intervento ${interventionNumber} - ${clientName}: appuntamento il ${formattedDate}`,
      data: {
        type: 'appointment_set',
        interventionId,
        interventionNumber,
      },
    });

    res.json({
      success: true,
      message: 'Appointment notification sent',
    });
  } catch (error) {
    console.error('[PUSH] Error sending appointment notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send appointment notification',
    });
  }
});

router.post('/notify-status/:interventionId', async (req: AuthRequest, res: Response) => {
  try {
    const userRole = req.user?.role?.toLowerCase();
   if (userRole === 'master') {
      return res.json({
        success: true,
        message: 'MASTER users do not need self-notification',
      });
    }

    const { interventionId } = req.params;
    const { interventionNumber, previousStatus, newStatus, clientName } = req.body;

    const statusLabels: Record<string, string> = {
      'assegnato': 'Assegnato',
      'appuntamento_fissato': 'Appuntamento Fissato',
      'in_corso': 'In Corso',
      'completato': 'Completato',
      'chiuso': 'Chiuso',
    };

    await notifyMasters({
      title: 'Stato Intervento Aggiornato',
      body: `${interventionNumber} - ${clientName}: ${statusLabels[previousStatus] || previousStatus} -> ${statusLabels[newStatus] || newStatus}`,
      data: {
        type: 'status_change',
        interventionId,
        interventionNumber,
        previousStatus,
        newStatus,
      },
    });

    res.json({
      success: true,
      message: 'Status notification sent',
    });
  } catch (error) {
    console.error('[PUSH] Error sending status notification:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send status notification',
    });
  }
});

export default router;
