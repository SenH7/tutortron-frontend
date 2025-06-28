// test-upload.js - Test script to verify file upload with a real PDF
const fs = require('fs');
const PDFDocument = require('pdfkit');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testDirectUpload() {
    console.log('Testing direct upload to Flask backend...\n');

    const filename = 'test-document.pdf';

    // Create a real PDF file
    await new Promise((resolve, reject) => {
        const doc = new PDFDocument();
        const stream = fs.createWriteStream(filename);

        doc.pipe(stream);
        doc.fontSize(14).text(`Test Document for Tutortron`, { underline: true });
        doc.moveDown();
        doc.text(`This is a test document containing information about mathematics.`);
        doc.moveDown();
        doc.text(`Topics covered include algebra, calculus, and geometry.`);
        doc.moveDown();
        doc.text(`• Algebra deals with mathematical symbols and rules for manipulating symbols.`);
        doc.text(`• Calculus is the mathematical study of continuous change.`);
        doc.text(`• Geometry is concerned with properties of space and figures.`);
        doc.end();

        stream.on('finish', () => {
            console.log(`✓ Created real PDF file: ${filename}`);
            resolve();
        });
        stream.on('error', reject);
    });


    console.log(`✓ Created real PDF file: ${filename}`);

    try {
        // Test 1: Direct upload to Flask backend
        console.log('\n--- Test 1: Direct Upload to Flask Backend ---');
        const formData = new FormData();
        const fileBuffer = fs.readFileSync(filename);

        formData.append('file', fileBuffer, {
            filename: filename,
            contentType: 'application/pdf',
        });

        console.log('Sending to: http://localhost:5001/upload');
        const response = await fetch('http://localhost:5001/upload', {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders(),
        });

        console.log('Response status:', response.status);
        const data = await response.text();
        console.log('Response:', data);
    } catch (error) {
        console.error('Error in Test 1:', error.message);
    }

    // Test 2: Upload through Next.js API
    console.log('\n--- Test 2: Upload through Next.js API ---');
    try {
        const formData2 = new FormData();
        formData2.append('file', fs.createReadStream(filename), {
            filename: filename,
            contentType: 'application/pdf',
        });

        console.log('Sending to: http://localhost:3000/api/upload');
        const response2 = await fetch('http://localhost:3000/api/upload', {
            method: 'POST',
            body: formData2,
            headers: formData2.getHeaders(),
        });

        console.log('Response status:', response2.status);
        const data2 = await response2.text();
        console.log('Response:', data2);
    } catch (error) {
        console.error('Error in Test 2:', error.message);
    }

    // Cleanup
    fs.unlinkSync(filename);
    console.log('\n✓ Cleaned up test file');
}

// Run the test
testDirectUpload().catch(console.error);

// Instructions:
// 1. Run: npm install pdfkit form-data node-fetch@2
// 2. Ensure Flask (port 5001) and Next.js (port 3000) servers are running
// 3. Run this script with: node test-upload.js
