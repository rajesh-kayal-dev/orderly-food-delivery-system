import express from 'express';

/**
 * rawBody middleware — captures the raw request body as a Buffer.
 * MUST be applied before express.json() on the webhook route only.
 * Razorpay requires raw body bytes for HMAC signature verification.
 */
export const captureRawBody = (req, res, next) => {
  const chunks = [];
  req.on('data', (chunk) => chunks.push(chunk));
  req.on('end', () => {
    req.rawBody = Buffer.concat(chunks);
    // Also parse JSON so controllers can still read req.body
    try {
      req.body = JSON.parse(req.rawBody.toString('utf8'));
    } catch {
      req.body = {};
    }
    next();
  });
  req.on('error', next);
};
