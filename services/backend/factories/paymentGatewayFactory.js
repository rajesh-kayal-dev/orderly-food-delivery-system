import VNPayAdapter from '../adapters/VNPayAdapter.js';

export default class PaymentGatewayFactory {
  static create(gatewayName) {
    const normalized = String(gatewayName || '').toLowerCase();

    switch (normalized) {
      case 'vnpay':
        return new VNPayAdapter();
      default:
        throw new Error(`Unsupported payment gateway: ${gatewayName}`);
    }
  }
}
