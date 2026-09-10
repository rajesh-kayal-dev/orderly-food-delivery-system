import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.GATEWAY_PORT || 8000;
const SERVICES = {
    BACKEND: process.env.BACKEND_URL || 'http://localhost:5001',
    ORDER_SERVICE: process.env.ORDER_SERVICE_URL || 'http://localhost:5002',
    IDENTITY_SERVICE: process.env.IDENTITY_SERVICE_URL || 'http://localhost:5003',
    RESTAURANT_SERVICE: process.env.RESTAURANT_SERVICE_URL || 'http://localhost:5004',
};

app.use(helmet({
    contentSecurityPolicy: false,
}));

app.use(morgan('dev'));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: { error: 'Too many requests from this IP, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

app.use(cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
    credentials: true
}));

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'API Gateway is Healthy', uptime: process.uptime() });
});

app.use('/api/auth', createProxyMiddleware({
    target: SERVICES.IDENTITY_SERVICE,
    changeOrigin: true,
    onProxyReq: (proxyReq) => {
        proxyReq.setHeader('X-Gateway-Request', 'true');
        proxyReq.setHeader('X-Service-Name', 'identity-service');
    },
    onProxyRes: (proxyRes) => {
        proxyRes.headers['X-Service-Name'] = 'identity-service';
    },
    onError: (err, req, res) => {
        console.error('Proxy Error (Identity Service):', err.message);
        res.status(502).json({ 
            error: 'Bad Gateway', 
            details: 'The identity service is currently unavailable.' 
        });
    }
}));

app.use(['/api/orders', '/api/payments'], createProxyMiddleware({
    target: SERVICES.ORDER_SERVICE,
    changeOrigin: true,
    onProxyReq: (proxyReq) => {
        proxyReq.setHeader('X-Gateway-Request', 'true');
        proxyReq.setHeader('X-Service-Name', 'order-service');
    },
    onProxyRes: (proxyRes) => {
        proxyRes.headers['X-Service-Name'] = 'order-service';
    },
    onError: (err, req, res) => {
        console.error('Proxy Error (Order Service):', err.message);
        res.status(502).json({ 
            error: 'Bad Gateway', 
            details: 'The order service is currently unavailable.' 
        });
    }
}));

app.use('/api/cart', createProxyMiddleware({
    target: SERVICES.ORDER_SERVICE,
    changeOrigin: true,
    onProxyReq: (proxyReq) => {
        proxyReq.setHeader('X-Gateway-Request', 'true');
        proxyReq.setHeader('X-Service-Name', 'order-service');
    },
    onProxyRes: (proxyRes) => {
        proxyRes.headers['X-Service-Name'] = 'order-service';
    },
    onError: (err, req, res) => {
        console.error('Proxy Error (Cart Service):', err.message);
        res.status(502).json({ 
            error: 'Bad Gateway', 
            details: 'The cart service (via order service) is currently unavailable.' 
        });
    }
}));

app.use('/api/admin/orders', createProxyMiddleware({
    target: SERVICES.ORDER_SERVICE,
    changeOrigin: true,
    onProxyReq: (proxyReq) => {
        proxyReq.setHeader('X-Gateway-Request', 'true');
        proxyReq.setHeader('X-Service-Name', 'order-service');
    },
    onProxyRes: (proxyRes) => {
        proxyRes.headers['X-Service-Name'] = 'order-service';
    },
    onError: (err, req, res) => {
        console.error('Proxy Error (Admin Orders):', err.message);
        res.status(502).json({ error: 'Bad Gateway' });
    }
}));

app.use('/api/admin', createProxyMiddleware({
    target: SERVICES.IDENTITY_SERVICE,
    changeOrigin: true,
    onProxyReq: (proxyReq) => {
        proxyReq.setHeader('X-Gateway-Request', 'true');
        proxyReq.setHeader('X-Service-Name', 'identity-service');
    },
    onProxyRes: (proxyRes) => {
        proxyRes.headers['X-Service-Name'] = 'identity-service';
    },
    onError: (err, req, res) => {
        console.error('Proxy Error (Admin Identity):', err.message);
        res.status(502).json({ error: 'Bad Gateway' });
    }
}));

app.use(['/api/restaurants', '/api/menu'], createProxyMiddleware({
    target: SERVICES.RESTAURANT_SERVICE,
    changeOrigin: true,
    onProxyReq: (proxyReq) => {
        proxyReq.setHeader('X-Gateway-Request', 'true');
        proxyReq.setHeader('X-Service-Name', 'restaurant-service');
    },
    onProxyRes: (proxyRes) => {
        proxyRes.headers['X-Service-Name'] = 'restaurant-service';
    },
    onError: (err, req, res) => {
        console.error('Proxy Error (Restaurant Service):', err.message);
        res.status(502).json({ 
            error: 'Bad Gateway', 
            details: 'The restaurant service is currently unavailable.' 
        });
    }
}));

app.use('/api/notifications', createProxyMiddleware({
    target: 'http://localhost:5005',
    changeOrigin: true,
    onError: (err, req, res) => {
        console.error('Proxy Error (Notification Service):', err.message);
        res.status(502).json({ error: 'Bad Gateway' });
    }
}));

app.use('/api', createProxyMiddleware({
    target: SERVICES.BACKEND,
    changeOrigin: true,
    onProxyReq: (proxyReq) => {
        proxyReq.setHeader('X-Gateway-Request', 'true');
    },
    onError: (err, req, res) => {
        console.error('Proxy Error (API):', err.message);
        res.status(502).json({ 
            error: 'Bad Gateway', 
            details: 'The backend service is currently unavailable.' 
        });
    }
}));

const socketProxy = createProxyMiddleware({
    target: 'http://localhost:5005',
    changeOrigin: true,
    ws: true,
    onError: (err) => {
        console.error('Proxy Error (Socket):', err.message);
    }
});

app.use('/socket.io', socketProxy);

const server = app.listen(PORT, () => {
    console.log(`Orderly API Gateway running at http://localhost:${PORT}`);
    console.log(`Proxying /socket.io to: http://localhost:5005`);
});

server.on('upgrade', (req, socket, head) => {
    if (req.url.startsWith('/socket.io')) {
        socketProxy.upgrade(req, socket, head);
    }
});
