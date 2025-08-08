const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Multer for file uploads
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Cloudinary configuration
const cloudinary = require('cloudinary').v2;

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Routes

// Upload endpoint for images
app.post('/api/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Convert buffer to base64
        const fileStr = req.file.buffer.toString('base64');
        const fileUri = `data:${req.file.mimetype};base64,${fileStr}`;

        // Upload to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(fileUri, {
            folder: 'photo-album',
            resource_type: 'image'
        });

        console.log('Upload successful:', uploadResult.secure_url);

        // Optimize delivery URL
        const optimizeUrl = cloudinary.url(uploadResult.public_id, {
            fetch_format: 'auto',
            quality: 'auto'
        });

        // Return the URLs
        res.json({
            url: uploadResult.secure_url,
            optimized_url: optimizeUrl,
            public_id: uploadResult.public_id
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

// Get all pictures from Cloudinary (if needed later)
app.get('/api/pictures', async (req, res) => {
    try {
        // Since we're not storing picture metadata, return empty array
        res.json([]);
    } catch (error) {
        console.error('Pictures API error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Test endpoint to verify Cloudinary connection
app.get('/api/test-cloudinary', async (req, res) => {
    try {
        // Test upload with a sample image URL
        const uploadResult = await cloudinary.uploader.upload(
            'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg', 
            {
                public_id: 'test-shoes',
                folder: 'photo-album'
            }
        );

        // Generate optimized URL
        const optimizeUrl = cloudinary.url('photo-album/test-shoes', {
            fetch_format: 'auto',
            quality: 'auto'
        });

        // Generate auto-crop URL
        const autoCropUrl = cloudinary.url('photo-album/test-shoes', {
            crop: 'auto',
            gravity: 'auto',
            width: 500,
            height: 500,
        });

        res.json({
            message: 'Cloudinary connection successful!',
            original_url: uploadResult.secure_url,
            optimized_url: optimizeUrl,
            auto_crop_url: autoCropUrl,
            public_id: uploadResult.public_id
        });

    } catch (error) {
        console.error('Cloudinary test error:', error);
        res.status(500).json({ error: 'Cloudinary connection failed', details: error.message });
    }
});

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Backend server is running!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
