const express = require('express');
const router = express.Router();
const { supabasePublic } = require('../supabaseClient');

// GET /api/venue?slug=sergey-cafe
router.get('/venue', async (req, res) => {
  const { slug } = req.query;

  if (!slug) {
    return res.status(400).json({ error: 'slug is required' });
  }

  try {
    const { data: venue, error: venueError } = await supabasePublic
      .from('venues')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (venueError || !venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    const { data: menuItems, error: menuError } = await supabasePublic
      .from('menu_items')
      .select('*')
      .eq('venue_id', venue.id)
      .eq('is_available', true)
      .order('sort_order');

    if (menuError) {
      return res.status(500).json({ error: 'Failed to fetch menu' });
    }

    const groupedMenu = {};
    menuItems.forEach(item => {
      const cat = item.category || 'Без категории';
      if (!groupedMenu[cat]) groupedMenu[cat] = [];
      groupedMenu[cat].push({
        id: item.id,
        name: item.name,
        priceVnd: item.price_vnd,
        description: item.description,
        photoUrl: item.photo_url,
      });
    });

    return res.json({
      venue: {
        id: venue.id,
        slug: venue.slug,
        name: venue.name,
        ownerName: venue.owner_name,
        ownerTitle: venue.owner_title,
        ownerPhotoUrl: venue.owner_photo_url,
        audioUrl: venue.audio_url,
        audioDuration: venue.audio_duration,
        audioBullets: venue.audio_bullets,
        gallery: venue.gallery,
        address: venue.address,
        googleMapsUrl: venue.google_maps_url,
        promoCode: venue.promo_code,
        promoText: venue.promo_text,
        promoReward: venue.promo_reward,
      },
      menu: groupedMenu,
    });
  } catch (error) {
    console.error('GET /api/venue error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/visit
router.post('/visit', async (req, res) => {
  const { venueId, userAgent } = req.body;

  if (!venueId) {
    return res.status(400).json({ error: 'venueId is required' });
  }

  try {
    const { error } = await supabasePublic
      .from('visits')
      .insert({
        venue_id: venueId,
        user_agent: userAgent || 'unknown',
      });

    if (error) {
      return res.status(500).json({ error: 'Failed to record visit' });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('POST /api/visit error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;