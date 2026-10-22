const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileName: String,
  score: Number,
  summary: String,
  found: [String],
  missing: [String],
  suggestions: [String]
}, { timestamps: true });

module.exports = mongoose.model('Analysis', analysisSchema);