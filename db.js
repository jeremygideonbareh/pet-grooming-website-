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
  var SUPABASE_URL = 'https://hqgdifxecxrxhjsbavkl.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_4-UBFcXGsiLjHINRAfydTQ_lCVzE9OM';

  var supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
      return [];
    }
  }

  /**
   * Overwrite the entire products array.
   * @param {Array} products - Array of product objects.
   */
  async function saveAllProducts(products) {
    try {
      // Fetch existing IDs to delete
      var existing = await supabase
        .from('products')
        .select('id');
      if (existing.error) {
        console.error('[DB] saveAllProducts fetch error:', existing.error);
        return;
      }
      if (existing.data && existing.data.length > 0) {
        var ids = existing.data.map(function(r) { return r.id; });
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
        }
      }
    } catch (e) {
      console.error('[DB] saveAllProducts exception:', e);
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
    }
  }

  /* ── Expose globally ── */
  window.DB = {
    supabase: supabase,  // exposed so upload.js can reuse the same client
    getSiteContent:  getSiteContent,
    saveSiteContent: saveSiteContent,
    getProducts:     getProducts,
    saveAllProducts: saveAllProducts,
    addProduct:      addProduct,
    updateProduct:   updateProduct,
    deleteProduct:   deleteProduct
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
    }

    console.log('[DB TEST] 🏁 Finished. Check the logs above for ✅ or ❌');
  };
})();
