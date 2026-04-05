import express from 'express';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import { getApps } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { initFirebase } from '../db/firebase.js';
import { isStoragePathOwnedByUser } from '../utils/storage-path.js';
import path from 'path';

const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseBucket = process.env.SUPABASE_BUCKET_NAME || 'uploads';

const supabase =
  supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Warning: Supabase credentials not found. Supabase uploads will be skipped if Firebase Storage is not used.');
}

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
});

router.use(authenticateToken);

function useFirebaseStorage(): boolean {
  return Boolean(process.env.FIREBASE_STORAGE_BUCKET);
}

router.post('/upload', upload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileExt = path.extname(req.file.originalname);
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExt}`;
    const objectPath = `${req.user!.email}/${fileName}`;

    if (useFirebaseStorage()) {
      initFirebase();
      if (getApps().length === 0) {
        return res.status(500).json({ error: 'Firebase not initialized' });
      }
      const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
      if (!bucketName) {
        return res.status(500).json({ error: 'FIREBASE_STORAGE_BUCKET is not set' });
      }
      const bucket = getStorage().bucket(bucketName);
      const file = bucket.file(objectPath);
      await file.save(req.file.buffer, {
        contentType: req.file.mimetype,
        resumable: false,
      });
      const [readUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 365 * 24 * 3600 * 1000,
      });
      return res.json({
        url: readUrl,
        filename: fileName,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });
    }

    if (!supabase) {
      return res.status(500).json({ error: 'Configure Firebase Storage (FIREBASE_STORAGE_BUCKET) or Supabase storage.' });
    }

    const { error: uploadError } = await supabase.storage.from(supabaseBucket).upload(objectPath, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: false,
    });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return res.status(500).json({ error: uploadError.message || 'File upload failed' });
    }

    const { data: urlData } = supabase.storage.from(supabaseBucket).getPublicUrl(objectPath);
    res.json({
      url: urlData.publicUrl,
      filename: fileName,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    res.status(500).json({ error: error.message || 'File upload failed' });
  }
});

router.post('/signed-url', async (req: AuthRequest, res) => {
  try {
    const { uri } = req.body;
    if (!uri) {
      return res.status(400).json({ error: 'File URI is required' });
    }

    if (uri.includes('firebasestorage.googleapis.com') && process.env.FIREBASE_STORAGE_BUCKET) {
      initFirebase();
      const bucketName = process.env.FIREBASE_STORAGE_BUCKET;
      if (!bucketName) {
        return res.status(500).json({ error: 'FIREBASE_STORAGE_BUCKET is not set' });
      }
      const urlObj = new URL(uri);
      const bucketInPath = urlObj.pathname.match(/\/v0\/b\/([^/]+)\/o\//);
      if (bucketInPath && bucketInPath[1] !== bucketName) {
        return res.status(400).json({ error: 'Invalid storage location' });
      }
      const pathMatch = urlObj.pathname.match(/\/o\/(.+)/);
      const objectPath = pathMatch ? decodeURIComponent(pathMatch[1]) : '';
      if (!objectPath) {
        return res.status(400).json({ error: 'Invalid Firebase Storage URI' });
      }
      if (!isStoragePathOwnedByUser(objectPath, req.user!.email)) {
        return res.status(403).json({ error: 'Access denied' });
      }
      const bucket = getStorage().bucket(bucketName);
      const [signedUrl] = await bucket.file(objectPath).getSignedUrl({
        action: 'read',
        expires: Date.now() + 3600 * 1000,
      });
      return res.json({ signed_url: signedUrl });
    }

    if (!supabase) {
      return res.status(500).json({ error: 'Storage backend not configured' });
    }

    const urlObj = new URL(uri);
    const rawSegment = urlObj.pathname.split(`/${supabaseBucket}/`)[1];
    if (!rawSegment) {
      return res.status(400).json({ error: 'Invalid file URI' });
    }
    const filePath = decodeURIComponent(rawSegment);
    if (!isStoragePathOwnedByUser(filePath, req.user!.email)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(supabaseBucket)
      .createSignedUrl(filePath, 3600);

    if (signedUrlError) {
      console.error('Signed URL error:', signedUrlError);
      return res.status(500).json({ error: signedUrlError.message || 'Failed to generate signed URL' });
    }

    res.json({ signed_url: signedUrlData.signedUrl });
  } catch (error: any) {
    console.error('Signed URL error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate signed URL' });
  }
});

export default router;
