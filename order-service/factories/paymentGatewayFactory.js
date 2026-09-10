import VNPayAdapter from '../adapters/VNPayAdapter.js';

class PaymentGatewayFactory {
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

export default PaymentGatewayFactory;
