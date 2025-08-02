import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema({
  urlId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Url',
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  ip: {
    type: String,
    required: true,
  },
  userAgent: {
    type: String,
  },
  referer: {
    type: String,
  },
  country: {
    type: String,
  },
  city: {
    type: String,
  },
  device: {
    type: String,
    enum: ['desktop', 'mobile', 'tablet', 'unknown'],
    default: 'unknown',
  },
  browser: {
    type: String,
  },
  os: {
    type: String,
  },
});

// Indexes for analytics queries
analyticsSchema.index({ urlId: 1, timestamp: -1 });
analyticsSchema.index({ timestamp: -1 });

const Analytics = mongoose.models.Analytics || mongoose.model('Analytics', analyticsSchema);

export default Analytics;
