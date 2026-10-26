const express = require('express');
const cors = require('cors');
const multer = require('multer');
const libre = require('libreoffice-convert');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

app.use(cors());

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

app.post('/convert', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const fileExt = path.extname(req.file.originalname).toLowerCase();
  
  if (fileExt === '.pdf') {
    // If it's already a PDF, just send it back
    res.setHeader('Content-Type', 'application/pdf');
    return res.sendFile(path.resolve(req.file.path), () => {
      fs.unlinkSync(req.file.path); // clean up
    });
  }

  if (fileExt !== '.ppt' && fileExt !== '.pptx') {
    fs.unlinkSync(req.file.path);
    return res.status(400).send('Invalid file format. Only PPT, PPTX, and PDF are allowed.');
  }

  const enterPath = req.file.path;
  const extend = '.pdf';

  // Read the uploaded file
  const file = fs.readFileSync(enterPath);

  // Convert it to PDF
  libre.convert(file, extend, undefined, (err, done) => {
    // Clean up the uploaded file
    fs.unlinkSync(enterPath);

    if (err) {
      console.error(`Error converting file: ${err}`);
      return res.status(500).send('Error converting file. Ensure LibreOffice is installed and accessible on the server.');
    }

    // Send the converted PDF buffer back to the client
    res.setHeader('Content-Type', 'application/pdf');
    res.send(done);
  });
});

app.listen(port, () => {
  console.log(`Classroom Conversion Backend listening at http://localhost:${port}`);
  console.log('Ensure LibreOffice is installed on this machine for PPT -> PDF conversion to work.');
});
