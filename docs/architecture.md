# Orderly (FoodFlow) Monorepo Architecture

## Directory Organization

```
orderly-food-delivery-system/
├── apps/
│   ├── frontend/            # React 19 + Vite + Tailwind Customer, Driver & Restaurant Portal
│   └── gateway/             # Express API Gateway, Rate Limiter & WebSocket Proxy (Port 8000)
│
├── services/
│   ├── identity-service/    # Auth, JWT RS256, User Profiles & Admin Approvals (Port 5003)
│   ├── restaurant-service/  # Restaurant Profiles, Menus & Categories (Port 5004)
│   ├── order-service/       # Carts, Checkout, Orders & Restaurant Ops (Port 5002)
│   ├── notification-service/# Realtime Socket.IO & Transactional Email Dispatch (Port 5005)
│   └── backend/             # Legacy driver dispatch and location engine (Port 5001)
│
├── packages/
│   └── shared/              # Shared constants, enums, and API response helpers
│
├── infrastructure/
│   ├── docker/              # Production Dockerfiles for all apps and services
│   └── kubernetes/          # Kubernetes Deployment and Service templates
│
├── docs/                    # Architectural and API documentation
├── scripts/                 # Monorepo management and utility scripts
├── docker-compose.yml       # Monorepo local orchestration configuration
└── package.json             # Root monorepo scripts & dependencies
```

## Service Communication

- **Frontend Client (`apps/frontend`)** communicates exclusively through the **API Gateway (`apps/gateway`)** on `http://localhost:8000/api`.
- **API Gateway** dynamically proxies requests to individual microservices with standard headers and fallback Bad Gateway (502) error handling.
- **Microservices** use functional Express architectures (`app.js` / `server.js` separation, centralized error middleware, and Prisma client pools).
- **Database**: Cloud PostgreSQL on Neon DB with Prisma ORM.
