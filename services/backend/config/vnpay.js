import { VNPay, ignoreLogger, ProductCode, VnpLocale, dateFormat } from 'vnpay';

const vnpay = new VNPay({
  tmnCode: process.env.VNP_TMNCODE,
  secureSecret: process.env.VNP_HASHSECRET,
  vnpayHost: process.env.VNP_URL || 'https://sandbox.vnpayment.vn',
  testMode: (process.env.VNP_TESTMODE || 'true') === 'true',
  hashAlgorithm: 'SHA512',
  loggerFn: ignoreLogger,
});

export default {
  vnpay,
  ProductCode,
  VnpLocale,
  dateFormat,
};