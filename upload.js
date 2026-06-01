/*
 * upload.js — Image upload layer (Supabase Storage)
 *
 * Uploads files to the 'a1-images' bucket using the Supabase client
 * exposed by db.js (window.DB.supabase).
 *
 * Bucket must exist with public-read policy in Supabase dashboard.
 */

(function() {
  'use strict';

  var BUCKET = 'a1-images';

  /**
   * Upload an image file to Supabase Storage.
   * @param {File} file - The image file selected by the user
   * @returns {Promise<string>} The public URL of the uploaded image
   */
  async function uploadImageToCloud(file) {
    // Guard: make sure db.js loaded first
    var supabase = window.DB && window.DB.supabase;
    if (!supabase) {
      var msg = 'upload.js: window.DB.supabase not found. Did db.js load first?';
      console.error('[UPLOAD] ' + msg);
      throw new Error(msg);
    }

    // Generate a unique file name: timestamp + original extension
    var ext = (file.name.match(/\.[^.]+$/) || ['.jpg'])[0];
    var fileName = Date.now() + '_' + Math.random().toString(36).slice(2, 8) + ext;

    try {
      console.log('[UPLOAD] Starting upload:', fileName, '(' + (file.size / 1024).toFixed(1) + 'KB)');

      var uploadResult = await supabase.storage
        .from(BUCKET)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadResult.error) {
        throw uploadResult.error;
      }

      console.log('[UPLOAD] ✅ Upload complete:', fileName);

      // Get the public URL
      var publicUrlResult = supabase.storage
        .from(BUCKET)
        .getPublicUrl(fileName);

      if (publicUrlResult.error) {
        throw publicUrlResult.error;
      }

      var url = publicUrlResult.data.publicUrl;
      console.log('[UPLOAD] Public URL:', url);
      return url;

    } catch (e) {
      console.error('[UPLOAD] ❌ Upload failed:', e.message || e);
      throw e;
    }
  }

  window.uploadImageToCloud = uploadImageToCloud;
})();
