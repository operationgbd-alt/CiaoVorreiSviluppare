import { Router } from 'express';
import { pool } from '../db';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { interventionId, data, mimeType, caption, uploadedById } = req.body;

    if (!interventionId || !data || !uploadedById) {
      return res.status(400).json({ error: 'interventionId, data, and uploadedById are required' });
    }

    const result = await pool.query(
      `INSERT INTO photos (intervention_id, data, mime_type, caption, uploaded_by_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, intervention_id, mime_type, caption, uploaded_by_id, created_at`,
      [interventionId, data, mimeType || 'image/jpeg', caption, uploadedById]
    );

    const photo = result.rows[0];
    res.status(201).json({
      id: photo.id,
      interventionId: photo.intervention_id,
      mimeType: photo.mime_type,
      caption: photo.caption,
      uploadedById: photo.uploaded_by_id,
      createdAt: photo.created_at,
    });
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});

router.get('/intervention/:interventionId', async (req, res) => {
  try {
    const { interventionId } = req.params;

    const result = await pool.query(
      `SELECT id, intervention_id, mime_type, caption, uploaded_by_id, created_at
       FROM photos
       WHERE intervention_id = $1
       ORDER BY created_at ASC`,
      [interventionId]
    );

    const photos = result.rows.map(photo => ({
      id: photo.id,
      interventionId: photo.intervention_id,
      mimeType: photo.mime_type,
      caption: photo.caption,
      uploadedById: photo.uploaded_by_id,
      createdAt: photo.created_at,
    }));

    res.json(photos);
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(500).json({ error: 'Failed to fetch photos' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, intervention_id, data, mime_type, caption, uploaded_by_id, created_at
       FROM photos
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    const photo = result.rows[0];
    res.json({
      id: photo.id,
      interventionId: photo.intervention_id,
      data: photo.data,
      mimeType: photo.mime_type,
      caption: photo.caption,
      uploadedById: photo.uploaded_by_id,
      createdAt: photo.created_at,
    });
  } catch (error) {
    console.error('Error fetching photo:', error);
    res.status(500).json({ error: 'Failed to fetch photo' });
  }
});

router.get('/:id/image', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT data, mime_type FROM photos WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    const photo = result.rows[0];
    const base64Data = photo.data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    res.set('Content-Type', photo.mime_type || 'image/jpeg');
    res.set('Cache-Control', 'public, max-age=31536000');
    res.send(buffer);
  } catch (error) {
    console.error('Error fetching photo image:', error);
    res.status(500).json({ error: 'Failed to fetch photo' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM photos WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    res.json({ success: true, id: result.rows[0].id });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

export default router;
