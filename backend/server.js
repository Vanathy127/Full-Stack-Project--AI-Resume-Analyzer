
require('node:dns/promises').setServers(['1.1.1.1', '8.8.8.8']);

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/analyze', require('./routes/analyze'));

// never serve backend source files
app.use('/backend', (req, res) => res.status(404).end());
// serve the frontend (index.html, login.html ... live in the repo root)
app.use(express.static(path.join(__dirname, '..')));

app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ message: 'File is over 5 MB.' });
  console.error(err);
  res.status(500).json({ message: err.message || 'Server error.' });
});

const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log('Server running at http://localhost:' + PORT));
  })
  .catch(err => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });