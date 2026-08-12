const express = require('express');
const router = express.Router();
const { supabaseAdmin } = require('../supabaseClient');
const { requireAdminKey } = require('../middleware/auth');

router.use(requireAdminKey);

// POST /api/admin/venue
router.post('/venue', async (req, res) => {
  const { slug, name, owner_name, owner_title, owner_photo_url,
    audio_url, audio_duration, audio_bullets, gallery,
    address, google_maps_url, promo_code, promo_text, promo_reward } = req.body;

  if (!slug || !name) {
    return res.status(400).json({ error: 'slug and name are required' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('venues')
      .insert({ slug, name, owner_name, owner_title, owner_photo_url,
        audio_url, audio_duration, audio_bullets, gallery,
        address, google_maps_url, promo_code, promo_text, promo_reward,
        is_published: true })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  } catch (error) {
    console.error('POST /api/admin/venue error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/admin/venue
router.patch('/venue', async (req, res) => {
  const { id, ...updates } = req.body;

  if (!id) return res.status(400).json({ error: 'id is required' });

  try {
    const { data, error } = await supabaseAdmin
      .from('venues')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  } catch (error) {
    console.error('PATCH /api/admin/venue error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/admin/menu-item
router.post('/menu-item', async (req, res) => {
  const { venue_id, category, name, price_vnd, description, photo_url, sort_order } = req.body;

  if (!venue_id || !name || price_vnd === undefined) {
    return res.status(400).json({ error: 'venue_id, name, and price_vnd are required' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('menu_items')
      .insert({ venue_id, category, name, price_vnd, description, photo_url,
        is_available: true, sort_order: sort_order || 0 })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  } catch (error) {
    console.error('POST /api/admin/menu-item error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/admin/menu-item
router.patch('/menu-item', async (req, res) => {
  const { id, ...updates } = req.body;

  if (!id) return res.status(400).json({ error: 'id is required' });

  try {
    const { data, error } = await supabaseAdmin
      .from('menu_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.json(data);
  } catch (error) {
    console.error('PATCH /api/admin/menu-item error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/menu-item
router.delete('/menu-item', async (req, res) => {
  const { id } = req.body;

  if (!id) return res.status(400).json({ error: 'id is required' });

  try {
    const { error } = await supabaseAdmin
      .from('menu_items')
      .delete()
      .eq('id', id);

    if (error) return res.status(500).json({ error: error.message });
    return res.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/admin/menu-item error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;