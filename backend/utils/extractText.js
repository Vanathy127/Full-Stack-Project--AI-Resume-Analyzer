const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

module.exports = async function extractText(file) {
  const name = file.originalname.toLowerCase();
  if (name.endsWith('.pdf')) {
    const data = await pdfParse(file.buffer);
    return data.text;
  }
  if (name.endsWith('.docx')) {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value;
  }
  throw new Error('Only PDF and DOCX files are supported.');
};