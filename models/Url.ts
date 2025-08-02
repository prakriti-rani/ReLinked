import mongoose from 'mongoose';

const urlSchema = new mongoose.Schema({
  originalUrl: {
    type: String,
    required: true,
  },
  shortCode: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  customAlias: {
    type: String,
    sparse: true,
    unique: true,
  },
  title: {
    type: String,
  },
  description: {
    type: String,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Allow anonymous URLs
    default: null,
  },
  clicks: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  expiresAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  tags: [String],
  password: {
    type: String,
    required: false, // Optional password protection
  },
  metadata: {
    aiSuggestions: String,
    isAnalyzed: { type: Boolean, default: false },
    riskLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
  },
  qrCode: {
    type: String, // Base64 encoded QR code
  },
});

// Indexes for better performance
urlSchema.index({ userId: 1, createdAt: -1 });
urlSchema.index({ shortCode: 1 });
urlSchema.index({ customAlias: 1 }, { sparse: true });
urlSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Safe model creation that works during build
let Url: any;
try {
  Url = mongoose.models.Url || mongoose.model('Url', urlSchema);
} catch (error) {
  // During build time, mongoose might not be available
  Url = null;
}

export default Url;
