import express from 'express';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { sql } from '../db/connection.js';
import path from 'path';

const router = express.Router();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseBucket = process.env.SUPABASE_BUCKET_NAME || 'uploads';

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Warning: Supabase credentials not found. File uploads will fail.');
}

const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Configure multer for memory storage (we'll upload directly to Supabase)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
  // Allow any MIME type (no fileFilter restriction)
});

// Apply authentication
router.use(authenticateToken);

// Upload file
router.post('/upload', upload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!supabase) {
      return res.status(500).json({ error: 'Supabase storage not configured' });
    }

    // Generate unique filename
    const fileExt = path.extname(req.file.originalname);
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${fileExt}`;
    const filePath = `${req.user!.email}/${fileName}`;

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(supabaseBucket)
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false, // Don't overwrite existing files
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return res.status(500).json({ error: uploadError.message || 'File upload failed' });
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(supabaseBucket)
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    res.json({
      url: publicUrl,
      filename: fileName,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    res.status(500).json({ error: error.message || 'File upload failed' });
  }
});

// Get signed URL (for private file access)
router.post('/signed-url', async (req: AuthRequest, res) => {
  try {
    const { uri } = req.body;

    if (!uri) {
      return res.status(400).json({ error: 'File URI is required' });
    }

    if (!supabase) {
      return res.status(500).json({ error: 'Supabase storage not configured' });
    }

    // Extract file path from URL
    const urlObj = new URL(uri);
    const filePath = urlObj.pathname.split(`/${supabaseBucket}/`)[1];

    if (!filePath) {
      return res.status(400).json({ error: 'Invalid file URI' });
    }

    // Generate signed URL (valid for 1 hour)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(supabaseBucket)
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (signedUrlError) {
      console.error('Signed URL error:', signedUrlError);
      return res.status(500).json({ error: signedUrlError.message || 'Failed to generate signed URL' });
    }

    res.json({
      signed_url: signedUrlData.signedUrl,
    });
  } catch (error: any) {
    console.error('Signed URL error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate signed URL' });
  }
});

export default router;

