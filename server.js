const express = require('express');
const axios = require('axios');
const multer = require('multer');
const fs = require('fs');
const FormData = require('form-data');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Middleware to parse JSON bodies
app.use(express.json());

// Endpoint for image upload
app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Read the uploaded file
    const imagePath = req.file.path;
    const imageBuffer = fs.readFileSync(imagePath);

    // Create form-data for imgbb API
    const form = new FormData();
    form.append('key', process.env.IMGBB_API_KEY);
    form.append('image', imageBuffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });
    form.append('expiration', 600); // Optional: expires in 10 minutes

    // Debug: Log API key and file details
    console.log('API Key:', process.env.IMGBB_API_KEY);
    console.log('File:', req.file);

    // Make request to imgbb API
    const response = await axios.post('https://api.imgbb.com/1/upload', form, {
      headers: {
        ...form.getHeaders(), // Set multipart/form-data headers
      },
    });

    // Delete the local file after upload
    fs.unlinkSync(imagePath);

    // Send the image URL back to the client
    res.json({
      success: true,
      image_url: response.data.data.url,
    });
  } catch (error) {
    console.error('Error details:', error.message);
    if (error.response) {
      console.error('imgbb API response:', error.response.data);
    }
    res.status(500).json({ error: 'Failed to upload image', details: error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});