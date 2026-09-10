import { createProxyMiddleware } from 'http-proxy-middleware';

export const createServiceProxy = (serviceName, targetUrl, extraOptions = {}) => {
  return createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    onProxyReq: (proxyReq) => {
      proxyReq.setHeader('X-Gateway-Request', 'true');
      proxyReq.setHeader('X-Service-Name', serviceName);
    },
    onProxyRes: (proxyRes) => {
      proxyRes.headers['X-Service-Name'] = serviceName;
    },
    onError: (err, req, res) => {
      console.error(`[Gateway Proxy Error] Service ${serviceName} unreachable:`, err.message);
      if (!res.headersSent) {
        res.status(502).json({
          success: false,
          error: 'Bad Gateway',
          service: serviceName,
          message: `The ${serviceName} is currently unavailable.`
        });
      }
    },
    ...extraOptions
  });
};
