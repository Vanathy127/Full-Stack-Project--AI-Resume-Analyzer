const express = require('express');
const multer = require('multer');
const auth = require('../middleware/auth');
const extractText = require('../utils/extractText');
const analyze = require('../utils/analyzer');
const Analysis = require('../models/Analysis');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/', auth, upload.single('resume'), async (req, res) => {
  try {
    const jd = (req.body.jd || '').trim();
    if (!req.file) return res.status(400).json({ message: 'Upload your resume first.' });
    if (jd.length < 20) return res.status(400).json({ message: 'Paste the job description.' });

    const resumeText = await extractText(req.file);
    if (resumeText.trim().length < 50) {
      return res.status(422).json({
        message: "We couldn't read text from this file. If it's a scanned or image-based PDF, upload the original DOCX or a text-based PDF."
      });
    }

    const result = await analyze(resumeText, jd);
    await Analysis.create({ user: req.userId, fileName: req.file.originalname, ...result });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Analysis failed. Try again.' });
  }
});

router.get('/history', auth, async (req, res) => {
  const items = await Analysis.find({ user: req.userId }).sort({ createdAt: -1 }).limit(20);
  res.json(items);
});

module.exports = router;