const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  estimatedTime: { type: Number, required: true }, 
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  enrolledUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

module.exports = mongoose.model('Module', moduleSchema);