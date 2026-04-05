import express from 'express';
import multer from 'multer';
import { put } from '@vercel/blob';
import { getApp, getApps } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { initFirebase } from '../db/firebase.js';
import { isStoragePathOwnedByUser, isVercelBlobPathOwnedByUser } from '../utils/storage-path.js';
import path from 'path';

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
});

router.use(authenticateToken);

function useVercelBlob(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}

/** Default bucket matches firebase.ts init: env or `{projectId}.appspot.com` */
function firebaseBucketName(): string {
  const fromEnv = process.env.FIREBASE_STORAGE_BUCKET?.trim();
  if (fromEnv) return fromEnv;
  const pid = getApp().options.projectId;
  if (!pid) {
    throw new Error('Firebase projectId missing');
  }
  return `${pid}.appspot.com`;
}

router.post(
  '/upload',
  (req, res, next) => {
    upload.single('file')(req, res, (err: unknown) => {
      if (err) {
        const msg = err instanceof Error ? err.message : 'Upload failed';
        return res.status(400).json({ error: msg });
      }
      next();
    });
  },
  async (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const fileExt = path.extname(req.file.originalname);
      const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExt}`;
      const emailPath = `${req.user!.email}/${fileName}`;

      if (useVercelBlob()) {
        try {
          const objectPath = `${req.user!.id}/${fileName}`;
          const blob = await put(objectPath, req.file.buffer, {
            access: 'public',
            contentType: req.file.mimetype,
            addRandomSuffix: false,
            token: process.env.BLOB_READ_WRITE_TOKEN,
          });
          return res.json({
            url: blob.url,
            filename: fileName,
            size: req.file.size,
            mimetype: req.file.mimetype,
          });
        } catch (blobErr) {
          console.error('Vercel Blob upload failed, trying Firebase:', blobErr);
        }
      }

      const objectPath = emailPath;

      try {
        initFirebase();
      } catch (e) {
        console.error('initFirebase in upload:', e);
      }

      if (getApps().length > 0) {
        let bucketName: string;
        try {
          bucketName = firebaseBucketName();
        } catch (e: any) {
          return res.status(500).json({ error: e?.message || 'Firebase bucket not configured' });
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

      return res.status(500).json({
        error:
          'File storage is not configured. Set BLOB_READ_WRITE_TOKEN (Vercel Blob) and/or Firebase Admin credentials with Storage enabled.',
      });
    } catch (error: any) {
      console.error('File upload error:', error);
      res.status(500).json({ error: error?.message || 'File upload failed' });
    }
  }
);

router.post('/signed-url', async (req: AuthRequest, res) => {
  try {
    const { uri } = req.body;
    if (!uri) {
      return res.status(400).json({ error: 'File URI is required' });
    }

    if (uri.includes('blob.vercel-storage.com')) {
      const urlObj = new URL(uri);
      const objectPath = decodeURIComponent(urlObj.pathname.replace(/^\/+/, ''));
      if (!objectPath) {
        return res.status(400).json({ error: 'Invalid Vercel Blob URI' });
      }
      if (!isVercelBlobPathOwnedByUser(objectPath, req.user!.id, req.user!.email)) {
        return res.status(403).json({ error: 'Access denied' });
      }
      return res.json({ signed_url: uri });
    }

    if (uri.includes('firebasestorage.googleapis.com') && getApps().length > 0) {
      initFirebase();
      let bucketName: string;
      try {
        bucketName = firebaseBucketName();
      } catch (e: any) {
        return res.status(500).json({ error: e?.message || 'Firebase bucket not configured' });
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

    return res.status(400).json({ error: 'Unsupported storage URL (use Vercel Blob or Firebase Storage)' });
  } catch (error: any) {
    console.error('Signed URL error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate signed URL' });
  }
});

export default router;
