import mongoose from 'mongoose';

const SubscriptionSchema = new mongoose.Schema({
  plan: {
    type: String,
    required: true,
    enum: ['daily', 'monthly'] 
  },
  price: {
    type: Number,
    required: true
  },
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: false
  },
  status: {
    type: String,
    default: 'active',
    enum: ['active', 'canceled']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Subscription = mongoose.model('Subscription', SubscriptionSchema);

export default Subscription;

