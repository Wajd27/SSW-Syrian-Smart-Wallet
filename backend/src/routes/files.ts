import express from 'express';
import multer from 'multer';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { sql } from '../db/connection.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // In production, use cloud storage (Vercel Blob, AWS S3, etc.)
    // For now, we'll use a simple approach
    cb(null, process.env.UPLOAD_DIR || './uploads');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB default
  },
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Apply authentication
router.use(authenticateToken);

// Upload file
router.post('/upload', upload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // In production, upload to cloud storage and get URL
    // For now, return a placeholder URL
    const fileUrl = `/uploads/${req.file.filename}`;
    
    // In a real implementation, you would:
    // 1. Upload to Vercel Blob Storage, AWS S3, or similar
    // 2. Get the public URL
    // 3. Store the URL in the database if needed

    res.json({
      url: fileUrl,
      filename: req.file.filename,
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

    // In production, generate a signed URL from your storage provider
    // For now, return the URI as-is (insecure, but works for development)
    // In production with Vercel Blob:
    // const signedUrl = await blob.generateSignedUrl(uri, { expiresIn: 3600 });
    
    res.json({
      signed_url: uri, // Replace with actual signed URL in production
    });
  } catch (error: any) {
    console.error('Signed URL error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate signed URL' });
  }
});

export default router;

