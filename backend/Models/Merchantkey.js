// models/Merchant.js
const mongoose = require('mongoose');
const crypto = require('crypto');

const merchantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  websiteUrl: {
    type: String,
    required: true,
    trim: true
  },
  apiKey: {
    type: String,
    unique: true,
    default: () => crypto.randomBytes(10).toString('hex')
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

merchantSchema.pre('save', function(next) {
  if (this.apiKey.length !== 20) {
    this.apiKey = crypto.randomBytes(10).toString('hex');
  }
  next();
});

module.exports = mongoose.model('MerchantKey', merchantSchema);