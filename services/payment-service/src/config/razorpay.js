import Razorpay from 'razorpay';
import env from './env.js';

if (!env.razorpay.keyId || !env.razorpay.keySecret) {
  throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in environment variables');
}

const razorpay = new Razorpay({
  key_id: env.razorpay.keyId,
  key_secret: env.razorpay.keySecret
});

export default razorpay;
