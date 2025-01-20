import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  deployments: { 
    type: [String], 
    default: [] 
  }
}, { timestamps: true });

const logSchema = new mongoose.Schema({
  deploymentId: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['info', 'error'], required: true },
  timestamp: { type: Date, default: Date.now }
});

export const User = mongoose.model('User', userSchema);
export const Log = mongoose.model('Log', logSchema); 