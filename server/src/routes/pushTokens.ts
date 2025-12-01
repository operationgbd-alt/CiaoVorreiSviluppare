import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { savePushToken, removePushToken } from '../services/pushNotificationService';

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

export default router;
