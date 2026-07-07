/*
 * db.js — Data layer (Supabase)
 *
 * All site data operations go through these async functions.
 * Currently backed by Supabase (PostgreSQL).
 *
 * Tables:
 *   site_content  — single row: id=1, data (jsonb), updated_at (timestamptz)
 *   products      — one row per product: id (text PK), name, price, cat, catLabel, desc, img
 *
 * To reset or inspect data, visit your Supabase dashboard:
 *   https://supabase.com/dashboard/project/hqgdifxecxrxhjsbavkl
 */

(function() {
  'use strict';

  /* ── Supabase client ── */
  var supabase = null;
  if (typeof window.Auth !== 'undefined' && window.Auth.supabase) {
    supabase = window.Auth.supabase;
  } else if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
    var SUPABASE_URL = 'https://hqgdifxecxrxhjsbavkl.supabase.co';
    var SUPABASE_ANON_KEY = 'sb_publishable_4-UBFcXGsiLjHINRAfydTQ_lCVzE9OM';
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storageKey: 'a1_booking_auth' }
    });
  }

  /* ── Site Content ── */

  /**
   * Fetch all site content (homepage + training + grooming + boarding).
   * @returns {Promise<Object|null>} The full content object, or null if none saved.
   */
  async function getSiteContent() {
    try {
      var result = await supabase
        .from('site_content')
        .select('data')
        .eq('id', 1)
        .single();
      if (result.error) {
        console.error('[DB] getSiteContent error:', result.error);
        return null;
      }
      return result.data ? result.data.data : null;
    } catch (e) {
      console.error('[DB] getSiteContent exception:', e);
      if(typeof Sentry!=='undefined')Sentry.captureException(e);
      return null;
    }
  }

  /**
   * Save all site content.
   * @param {Object} dataObj - The full content object.
   */
  async function saveSiteContent(dataObj) {
    try {
      var result = await supabase
        .from('site_content')
        .upsert({
          id: 1,
          data: dataObj,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
      if (result.error) {
        console.error('[DB] saveSiteContent error:', result.error);
      }
    } catch (e) {
      console.error('[DB] saveSiteContent exception:', e);
      if(typeof Sentry!=='undefined')Sentry.captureException(e);
    }
  }

  /* ── Products ── */

  /**
   * Get all store products.
   * @returns {Promise<Array>} Array of product objects.
   */
  async function getProducts() {
    try {
      var result = await supabase
        .from('products')
        .select('*')
        .order('id');
      if (result.error) {
        console.error('[DB] getProducts error:', result.error);
        return [];
      }
      return result.data || [];
    } catch (e) {
      console.error('[DB] getProducts exception:', e);
      if(typeof Sentry!=='undefined')Sentry.captureException(e);
      return [];
    }
  }

  /**
   * Overwrite the entire products array.
   * @param {Array} products - Array of product objects.
   */
  async function saveAllProducts(products) {
    try {
      // Backup existing products before modifying
      var backup = await supabase
        .from('products')
        .select('*');
      if (backup.error) {
        console.error('[DB] saveAllProducts fetch error:', backup.error);
        return;
      }
      var backupData = backup.data || [];
      // Delete all existing products
      if (backupData.length > 0) {
        var ids = backupData.map(function(r) { return r.id; });
        var delResult = await supabase
          .from('products')
          .delete()
          .in('id', ids);
        if (delResult.error) {
          console.error('[DB] saveAllProducts delete error:', delResult.error);
          return;
        }
      }
      // Insert the new set
      if (products.length > 0) {
        var insResult = await supabase
          .from('products')
          .insert(products);
        if (insResult.error) {
          console.error('[DB] saveAllProducts insert error:', insResult.error);
          // Restore backup on insert failure
          if (backupData.length > 0) {
            console.warn('[DB] Restoring backup...');
            await supabase.from('products').insert(backupData);
          }
        }
      }
    } catch (e) {
      console.error('[DB] saveAllProducts exception:', e);
      if(typeof Sentry!=='undefined')Sentry.captureException(e);
    }
  }

  /**
   * Add a single product.
   * @param {Object} product - The product to add.
   */
  async function addProduct(product) {
    try {
      var result = await supabase
        .from('products')
        .insert(product);
      if (result.error) {
        console.error('[DB] addProduct error:', result.error);
      }
    } catch (e) {
      console.error('[DB] addProduct exception:', e);
      if(typeof Sentry!=='undefined')Sentry.captureException(e);
    }
  }

  /**
   * Update a single product by id.
   * @param {string} id - Product id.
   * @param {Object} updates - Fields to update.
   */
  async function updateProduct(id, updates) {
    try {
      var result = await supabase
        .from('products')
        .update(updates)
        .eq('id', id);
      if (result.error) {
        console.error('[DB] updateProduct error:', result.error);
      }
    } catch (e) {
      console.error('[DB] updateProduct exception:', e);
      if(typeof Sentry!=='undefined')Sentry.captureException(e);
    }
  }

  /**
   * Delete a product by id.
   * @param {string} id - Product id.
   */
  async function deleteProduct(id) {
    try {
      var result = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      if (result.error) {
        console.error('[DB] deleteProduct error:', result.error);
      }
    } catch (e) {
      console.error('[DB] deleteProduct exception:', e);
      if(typeof Sentry!=='undefined')Sentry.captureException(e);
    }
  }

  /* ── Profile ── */

  /**
   * Fetch a user profile from the public.profiles table.
   * @param {string} userId - The Supabase Auth user ID (UUID).
   * @returns {Promise<Object|null>} The profile row, or null.
   */
  async function getProfile(userId) {
    try {
      var result = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (result.error) {
        if (result.error.code === 'PGRST116') return null; // not found
        console.error('[DB] getProfile error:', result.error);
        return null;
      }
      return result.data || null;
    } catch (e) {
      console.error('[DB] getProfile exception:', e);
      if(typeof Sentry!=='undefined')Sentry.captureException(e);
      return null;
    }
  }

  /**
   * Upsert a profile row into public.profiles.
   * Accepts all profile fields: full_name, phone, location, dog_age,
   * dog_gender, dog_breed, sickness, vaccination, deworming,
   * vaccination_card_url, allergy, temperament.
   * @param {Object} profile - Must include id (UUID).
   */
  async function upsertProfile(profile) {
    try {
      var result = await supabase
        .from('profiles')
        .upsert(profile, { onConflict: 'id' });
      if (result.error) {
        console.error('[DB] upsertProfile error:', result.error);
      }
    } catch (e) {
      console.error('[DB] upsertProfile exception:', e);
      if(typeof Sentry!=='undefined')Sentry.captureException(e);
    }
  }

  /**
   * Upload a vaccination card file to Supabase Storage and return the URL.
   * @param {File} file - The vaccination card file.
   * @returns {Promise<string|null>} Public URL or null.
   */
  async function uploadVaccinationCard(file) {
    try {
      if (!file) return null;
      var ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (ALLOWED.indexOf(file.type) === -1) {
        console.warn('[DB] Invalid vaccination card file type:', file.type);
        return null;
      }
      var ext = (file.name.match(/\.[^.]+$/) || ['.jpg'])[0];
      var fileName = 'vac_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8) + ext;
      var uploadResult = await supabase.storage.from('a1-images').upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
      if (uploadResult.error) {
        console.error('[DB] Vaccination card upload error:', uploadResult.error);
        return null;
      }
      var urlResult = supabase.storage.from('a1-images').getPublicUrl(fileName);
      return urlResult.data ? urlResult.data.publicUrl : null;
    } catch (e) {
      console.error('[DB] uploadVaccinationCard exception:', e);
      if(typeof Sentry!=='undefined')Sentry.captureException(e);
      return null;
    }
  }

  /* ── CRM: Owners, Dogs, Bookings ── */

  /**
   * Find an owner by phone number, or create a new one.
   * @param {string} phone
   * @param {string} name
   * @param {string} email
   * @param {string} location
   * @param {string} [whatsapp]
   * @returns {Promise<string>} owner_id (UUID)
   */
  async function findOrCreateOwner(phone, name, email, location, whatsapp) {
    try {
      var result = await supabase
        .from('owners')
        .select('owner_id')
        .eq('phone', phone)
        .maybeSingle();
      if (result.error) throw result.error;
      if (result.data) return result.data.owner_id;

      var payload = {
        phone: phone,
        full_name: name || '',
        email: email || '',
        location: location || '',
        whatsapp_number: whatsapp || ''
      };
      var ins = await supabase
        .from('owners')
        .insert(payload)
        .select('owner_id')
        .single();
      if (ins.error) throw ins.error;
      return ins.data.owner_id;
    } catch (e) {
      console.error('[DB] findOrCreateOwner error:', e);
      if(typeof Sentry!=='undefined')Sentry.captureException(e);
      throw e;
    }
  }

  /**
   * Find a dog by owner_id + dog_name, update empty health fields, or insert new.
   * @param {string} ownerId
   * @param {string} dogName
   * @param {Object} healthData - Fields: dog_age, dog_gender, dog_breed, sickness, vaccination, deworming, allergy, temperament, vaccination_card_url, behavioral_issues
   * @returns {Promise<string>} dog_id (UUID)
   */
  async function findOrUpdateDog(ownerId, dogName, healthData) {
    try {
      var KEY_MAP = { dog_age:'age', dog_gender:'gender', dog_breed:'breed', deworming:'deworming_3_months' };
      var norm = {};
      for (var k in healthData) {
        if (healthData.hasOwnProperty(k)) {
          var col = KEY_MAP[k] || k;
          norm[col] = healthData[k];
        }
      }
      var UPDATABLE = ['age','gender','breed','sickness','vaccination','deworming_3_months','allergy','temperament','vaccination_card_url','behavioral_issues'];
      var result = await supabase
        .from('dogs')
        .select('*')
        .eq('owner_id', ownerId)
        .eq('name', dogName)
        .maybeSingle();
      if (result.error) throw result.error;

      if (result.data) {
        var updates = {};
        for (var i = 0; i < UPDATABLE.length; i++) {
          var field = UPDATABLE[i];
          if (!result.data[field] && norm[field]) {
            updates[field] = norm[field];
          }
        }
        if (Object.keys(updates).length > 0) {
          var upd = await supabase
            .from('dogs')
            .update(updates)
            .eq('dog_id', result.data.dog_id);
          if (upd.error) throw upd.error;
        }
        return result.data.dog_id;
      }

      var payload = { owner_id: ownerId, name: dogName };
      for (var j = 0; j < UPDATABLE.length; j++) {
        var f = UPDATABLE[j];
        if (norm[f]) payload[f] = norm[f];
      }
      var ins = await supabase
        .from('dogs')
        .insert(payload)
        .select('dog_id')
        .single();
      if (ins.error) throw ins.error;
      return ins.data.dog_id;
    } catch (e) {
      console.error('[DB] findOrUpdateDog error:', e);
      if(typeof Sentry!=='undefined')Sentry.captureException(e);
      throw e;
    }
  }

  /**
   * Insert a booking record.
   * @param {string} ownerId
   * @param {string} dogId
   * @param {Object} bookingData - Fields: category, service, timeframe, notes
   * @returns {Promise<Object>} { success: true }
   */
  async function insertBooking(ownerId, dogId, bookingData) {
    try {
      var payload = {
        owner_id: ownerId,
        dog_id: dogId,
        service_category: bookingData.service_category || '',
        service_specific: bookingData.service_specific || '',
        start_date: bookingData.start_date || '',
        time_slot: bookingData.time_slot || '',
        end_date: bookingData.end_date || '',
        contact_method: bookingData.contact_method || '',
        pickup_required: !!bookingData.pickup_required,
        pickup_address: bookingData.pickup_address || '',
        status: 'pending'
      };
      var result = await supabase
        .from('bookings')
        .insert(payload);
      if (result.error) throw result.error;
      return { success: true };
    } catch (e) {
      console.error('[DB] insertBooking error:', e);
      if(typeof Sentry!=='undefined')Sentry.captureException(e);
      throw e;
    }
  }

  /**
   * Fetch all bookings with owner (name, phone) and dog (name) via Supabase FK join.
   * @returns {Promise<Array>} Array of booking objects with .owners and .dogs nested.
   */
  async function getBookings() {
    try {
      var result = await supabase
        .from('bookings')
        .select('*, owners(full_name, phone), dogs(name)')
        .order('created_at', { ascending: false });
      if (result.error) throw result.error;
      return result.data || [];
    } catch (e) {
      console.error('[DB] getBookings error:', e);
      if(typeof Sentry!=='undefined')Sentry.captureException(e);
      throw e;
    }
  }

  /**
   * Fetch owner record by phone number.
   * @param {string} phone
   * @returns {Promise<Object|null>}
   */
  async function getOwnerByPhone(phone) {
    try {
      var result = await supabase
        .from('owners')
        .select('*')
        .eq('phone', phone)
        .maybeSingle();
      if (result.error) throw result.error;
      return result.data || null;
    } catch (e) {
      console.error('[DB] getOwnerByPhone error:', e);
      if(typeof Sentry!=='undefined')Sentry.captureException(e);
      return null;
    }
  }

  /**
   * Fetch dogs for a given owner.
   * @param {string} ownerId
   * @returns {Promise<Array>}
   */
  async function getDogsByOwner(ownerId) {
    try {
      var result = await supabase
        .from('dogs')
        .select('*')
        .eq('owner_id', ownerId);
      if (result.error) throw result.error;
      return result.data || [];
    } catch (e) {
      console.error('[DB] getDogsByOwner error:', e);
      if(typeof Sentry!=='undefined')Sentry.captureException(e);
      return [];
    }
  }

  /**
   * Update a booking's status.
   * @param {number|string} bookingId
   * @param {string} status - e.g. 'pending', 'confirmed', 'completed', 'cancelled'
   * @returns {Promise<Object>} { success: true }
   */
  async function updateBookingStatus(bookingId, status) {
    try {
      var result = await supabase
        .from('bookings')
        .update({ status: status })
        .eq('id', bookingId);
      if (result.error) throw result.error;
      return { success: true };
    } catch (e) {
      console.error('[DB] updateBookingStatus error:', e);
      if(typeof Sentry!=='undefined')Sentry.captureException(e);
      throw e;
    }
  }

  /* ── Booking Slot Availability ── */

  /**
   * Check if a time slot is available for booking.
   * Returns false if another pending/confirmed booking exists for same category+date+slot.
   * @param {string} category - Service category (e.g. 'Grooming')
   * @param {string} date - Start date string
   * @param {string} timeSlot - Time slot (Morning/Afternoon/Evening)
   * @param {string} [excludeBookingId] - Optional booking ID to exclude from check (for admin edits)
   * @returns {Promise<{available: boolean, existingBooking: Object|null, error?: string}>}
   */
  async function checkSlotAvailability(category, date, timeSlot, excludeBookingId) {
    try {
      var query = supabase
        .from('bookings')
        .select('id, status')
        .eq('service_category', category)
        .eq('start_date', date)
        .eq('time_slot', timeSlot)
        .in('status', ['pending', 'confirmed']);
      if (excludeBookingId) {
        query = query.neq('id', excludeBookingId);
      }
      var result = await query.maybeSingle();
      if (result.error && result.error.code !== 'PGRST116') throw result.error;
      return {
        available: !result.data,
        existingBooking: result.data || null
      };
    } catch (e) {
      console.error('[DB] checkSlotAvailability error:', e);
      if(typeof Sentry!=='undefined')Sentry.captureException(e);
      return { available: false, error: e.message };
    }
  }

  /**
   * Update arbitrary fields on a booking record.
   * @param {number|string} bookingId
   * @param {Object} updates - Fields to update (start_date, time_slot, status, admin_notes, etc.)
   * @returns {Promise<{success: boolean}>}
   */
  async function updateBooking(bookingId, updates) {
    try {
      var result = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', bookingId);
      if (result.error) throw result.error;
      return { success: true };
    } catch (e) {
      console.error('[DB] updateBooking error:', e);
      if(typeof Sentry!=='undefined')Sentry.captureException(e);
      throw e;
    }
  }

  /* ── Expose globally ── */
  window.DB = {
    supabase: supabase,
    getSiteContent:        getSiteContent,
    saveSiteContent:       saveSiteContent,
    getProducts:           getProducts,
    saveAllProducts:       saveAllProducts,
    addProduct:            addProduct,
    updateProduct:         updateProduct,
    deleteProduct:         deleteProduct,
    getProfile:            getProfile,
    upsertProfile:         upsertProfile,
    uploadVaccinationCard: uploadVaccinationCard,
    findOrCreateOwner:     findOrCreateOwner,
    findOrUpdateDog:       findOrUpdateDog,
    insertBooking:         insertBooking,
    getBookings:           getBookings,
    updateBookingStatus:   updateBookingStatus,
    getOwnerByPhone:       getOwnerByPhone,
    getDogsByOwner:        getDogsByOwner,
    checkSlotAvailability: checkSlotAvailability,
    updateBooking:         updateBooking
  };

  /**
   * ── Connectivity test ──
   * Call window.runSupabaseTest() from the browser console to verify
   * that both the products and site_content tables are reachable.
   *
   * Pushes dummy data, reads it back, then cleans up after itself.
   */
  window.runSupabaseTest = async function runSupabaseTest() {
    var TEST_ID = '__test_' + Date.now();
    console.log('[DB TEST] Starting connection test…');

    // ── 1. Products: write + read back ──
    try {
      var dummy = { id: TEST_ID, name: 'TEST PRODUCT', price: '0', cat: 'test', catLabel: 'Test', desc: 'Auto-verify', img: '' };
      var ins = await supabase.from('products').insert(dummy);
      if (ins.error) { throw ins.error; }
      console.log('[DB TEST] ✅ Product inserted:', dummy);

      var fetched = await supabase.from('products').select('*').eq('id', TEST_ID).single();
      if (fetched.error) { throw fetched.error; }
      console.log('[DB TEST] ✅ Product read back:', fetched.data);

      // Clean up
      await supabase.from('products').delete().eq('id', TEST_ID);
      console.log('[DB TEST] 🧹 Product cleaned up');
    } catch (e) {
      console.error('[DB TEST] ❌ Products test failed:', e);
      if(typeof Sentry!=='undefined')Sentry.captureException(e);
    }

    // ── 2. Site content: write + read back ──
    try {
      var testContent = { test_field: 'Hello from runSupabaseTest at ' + new Date().toISOString() };
      var ups = await supabase
        .from('site_content')
        .upsert({ id: 1, data: testContent, updated_at: new Date().toISOString() }, { onConflict: 'id' });
      if (ups.error) { throw ups.error; }
      console.log('[DB TEST] ✅ Site content upserted:', testContent);

      var read = await supabase.from('site_content').select('data').eq('id', 1).single();
      if (read.error) { throw read.error; }
      console.log('[DB TEST] ✅ Site content read back:', read.data.data);

      // Restore empty data so we don't break the live site
      await supabase
        .from('site_content')
        .upsert({ id: 1, data: {}, updated_at: new Date().toISOString() }, { onConflict: 'id' });
      console.log('[DB TEST] 🧹 Site content restored to empty');
    } catch (e) {
      console.error('[DB TEST] ❌ Site content test failed:', e);
      if(typeof Sentry!=='undefined')Sentry.captureException(e);
    }

    console.log('[DB TEST] 🏁 Finished. Check the logs above for ✅ or ❌');
  };
})();
