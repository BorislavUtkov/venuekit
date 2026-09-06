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
  const { venue_id, category, name, price_vnd, description, photo_url, card_bg_url, sort_order } = req.body;

  if (!venue_id || !name || price_vnd === undefined) {
    return res.status(400).json({ error: 'venue_id, name, and price_vnd are required' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('menu_items')
      .insert({ venue_id, category, name, price_vnd, description, photo_url, card_bg_url,
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

// POST /api/admin/menu-item-ingredient
router.post('/menu-item-ingredient', async (req, res) => {
  try {
    const {
      menu_item_id,
      image_url,
      css_class,
      sort_order,
    } = req.body;

    if (!menu_item_id || !image_url) {
      return res.status(400).json({ error: 'menu_item_id and image_url are required' });
    }

    const { data, error } = await supabaseAdmin
      .from('menu_item_ingredients')
      .insert({
        menu_item_id,
        image_url,
        css_class: css_class || '',
        sort_order: sort_order || 0,
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json(data);
  } catch (error) {
    console.error('POST /api/admin/menu-item-ingredient error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/admin/menu-item-ingredient
router.delete('/menu-item-ingredient', async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'id is required' });
    }

    const { error } = await supabaseAdmin
      .from('menu_item_ingredients')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/admin/menu-item-ingredient error:', error);
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

// GET /api/admin/venues
router.get('/venues', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('venues')
      .select('id, slug, name')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json(data);
  } catch (error) {
    console.error('GET /api/admin/venues error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/menu-items?venue_id=
router.get('/menu-items', async (req, res) => {
  try {
    const { venue_id } = req.query;

    let query = supabaseAdmin
      .from('menu_items')
      .select('id, venue_id, category, name, price_vnd, photo_url')
      .order('category')
      .order('sort_order');

    if (venue_id) {
      query = query.eq('venue_id', venue_id);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json(data);
  } catch (error) {
    console.error('GET /api/admin/menu-items error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/admin/menu-item-ingredients
router.get('/menu-item-ingredients', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('menu_item_ingredients')
      .select('id, menu_item_id, image_url, css_class, sort_order')
      .order('sort_order');

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json(data);
  } catch (error) {
    console.error('GET /api/admin/menu-item-ingredients error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/admin/venue-css
router.patch('/venue-css', async (req, res) => {
  const { slug, custom_css } = req.body;

  if (!slug || !custom_css) {
    return res.status(400).json({ error: 'slug and custom_css are required' });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('venues')
      .update({ custom_css })
      .eq('slug', slug)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    return res.json(data);
  } catch (error) {
    console.error('PATCH /api/admin/venue-css error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;