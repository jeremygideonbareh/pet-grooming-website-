/*
 * upload.js — Image upload layer (Supabase Storage)
 *
 * Uploads files to the 'a1-images' bucket using the Supabase client
 * exposed by db.js (window.DB.supabase).
 *
 * Includes client-side type validation (JPG/PNG/WebP only)
 * and auto-compression for images larger than 2MB.
 *
 * Bucket must exist with public-read policy in Supabase dashboard.
 */

(function() {
  'use strict';

  var BUCKET = 'a1-images';
  var ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
  var MAX_SIZE_BYTES = 2 * 1024 * 1024;       // 2 MB
  var COMPRESS_MAX_WIDTH = 1200;               // px
  var COMPRESS_QUALITY = 0.8;                  // 0–1

  /**
   * Upload an image file to Supabase Storage.
   * @param {File} file - The image file selected by the user
   * @returns {Promise<string>} The public URL of the uploaded image
   */
  async function uploadImageToCloud(file) {
    // ── 1. Type validation ──
    if (ALLOWED_TYPES.indexOf(file.type) === -1) {
      throw new Error('Invalid file type. Please upload a JPG, PNG, or WebP.');
    }

    // ── 2. Compress if needed ──
    var blob = file;
    if (file.size > MAX_SIZE_BYTES) {
      try {
        blob = await compressImage(file);
        console.log('[UPLOAD] Compressed:',
          (file.size / 1024).toFixed(1) + 'KB →',
          (blob.size / 1024).toFixed(1) + 'KB');
      } catch (e) {
        console.warn('[UPLOAD] Compression failed, uploading original:', e);
        if(typeof Sentry!=='undefined')Sentry.captureException(e);
        blob = file;
      }
    }

    // ── 3. Guard: make sure db.js loaded first ──
    var supabase = window.DB && window.DB.supabase;
    if (!supabase) {
      var msg = 'upload.js: window.DB.supabase not found. Did db.js load first?';
      console.error('[UPLOAD] ' + msg);
      throw new Error(msg);
    }

    // Generate a unique file name: timestamp + random string + MIME-based extension
    var mimeExt = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
    var ext = mimeExt[file.type] || '.jpg';
    var fileName = Date.now() + '_' + Math.random().toString(36).slice(2, 8) + ext;

    try {
      console.log('[UPLOAD] Starting upload:', fileName, '(' + (blob.size / 1024).toFixed(1) + 'KB)');

      var uploadResult = await supabase.storage
        .from(BUCKET)
        .upload(fileName, blob, {
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
      if(typeof Sentry!=='undefined')Sentry.captureException(e);
      throw e;
    }
  }

  /**
   * Compress an image File to a smaller WebP/JPEG blob.
   * Resizes so the longest side ≤ COMPRESS_MAX_WIDTH.
   */
  function compressImage(file) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var url = URL.createObjectURL(file);

      img.onload = function () {
        URL.revokeObjectURL(url);

        var w = img.naturalWidth;
        var h = img.naturalHeight;

        // Scale down so the longest side ≤ COMPRESS_MAX_WIDTH
        if (w > COMPRESS_MAX_WIDTH || h > COMPRESS_MAX_WIDTH) {
          var ratio = Math.min(COMPRESS_MAX_WIDTH / w, COMPRESS_MAX_WIDTH / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }

        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, w, h);

        // Output WebP if supported, else JPEG
        var mime = (canvas.toDataURL('image/webp').indexOf('image/webp') !== -1) ? 'image/webp' : 'image/jpeg';

        canvas.toBlob(function (blob) {
          if (blob) resolve(blob);
          else reject(new Error('Canvas toBlob returned null'));
        }, mime, COMPRESS_QUALITY);
      };

      img.onerror = function () {
        URL.revokeObjectURL(url);
        if(typeof Sentry!=='undefined')Sentry.captureException(new Error('Failed to decode image'));
        reject(new Error('Failed to decode image'));
      };

      img.src = url;
    });
  }

  window.uploadImageToCloud = uploadImageToCloud;
})();
