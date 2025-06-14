const express = require('express');
const axios = require('axios');
const multer = require('multer');
const fs = require('fs');
const FormData = require('form-data');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Configure middleware
app.use(cors());
app.use(express.json());
const upload = multer({ dest: 'uploads/' });

// Endpoint for image upload
app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    console.log('Request received. File:', req.file);
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const imagePath = req.file.path;
    const imageBuffer = fs.readFileSync(imagePath);

    const form = new FormData();
    form.append('key', process.env.IMGBB_API_KEY);
    form.append('image', imageBuffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });
    form.append('expiration', 600);

    console.log('API Key:', process.env.IMGBB_API_KEY);
    console.log('File details:', {
      path: imagePath,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

    console.log('Uploading to imgbb...');
    const response = await axios.post('https://api.imgbb.com/1/upload', form, {
      headers: {
        ...form.getHeaders(),
      },
      timeout: 30000, // 30-second timeout
    });

    console.log('imgbb response:', response.data);

    // Clean up file
    try {
      fs.unlinkSync(imagePath);
    } catch (unlinkError) {
      console.error('File cleanup error:', unlinkError.message);
    }

    res.json({
      success: true,
      image_url: response.data.data.url,
    });
  } catch (error) {
    console.error('Error details:', error.message);
    if (error.response) {
      console.error('imgbb API response:', error.response.data);
    } else if (error.code) {
      console.error('Axios error code:', error.code);
    }
    res.status(500).json({ error: 'Failed to upload image', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
