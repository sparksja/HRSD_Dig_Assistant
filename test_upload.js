// Test file upload simulation
const fs = require('fs');
const path = require('path');

// Simulate the file upload process
console.log('Testing file upload simulation...');

// Create uploads directory
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory');
}

// Simulate file data from multer
const mockFile = {
  originalname: 'test2.pdf',
  size: 228915,
  mimetype: 'application/pdf',
  path: path.join('attached_assets', 'test2.pdf')
};

console.log('Mock file:', mockFile);

// Simulate the storage process from routes
const timestamp = Date.now();
const fileId = `${timestamp}`;
const safeFileName = `${fileId}_${mockFile.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
const finalPath = path.join(uploadsDir, safeFileName);

console.log('Will store file as:', finalPath);

// Test file copy
try {
  if (fs.existsSync(mockFile.path)) {
    fs.copyFileSync(mockFile.path, finalPath);
    console.log('✓ File copied successfully!');
    
    const storedFile = {
      id: fileId,
      originalName: mockFile.originalname,
      storedName: safeFileName,
      size: mockFile.size,
      type: mockFile.mimetype,
      storedPath: finalPath,
      uploadDate: new Date().toISOString()
    };
    
    console.log('File storage object:', JSON.stringify(storedFile, null, 2));
    
    // Test file access
    const stats = fs.statSync(finalPath);
    console.log('File size on disk:', stats.size, 'bytes');
    
  } else {
    console.log('❌ Source file not found:', mockFile.path);
  }
} catch (error) {
  console.error('❌ Error copying file:', error);
}