# Orderly - Modern Food Delivery Microservices Platform

Orderly is a production-grade, microservices-based online food delivery system built with **Node.js**, **Express (ES Modules)**, **Prisma ORM**, **Neon PostgreSQL**, **Socket.IO**, and **React 19 + Vite**.

---

## Monorepo Architecture

```
FoodFlow/
├── apps/
│   ├── frontend/             # React 19 Customer, Restaurant, Driver & Admin Portals
│   └── gateway/              # Express API Gateway, Rate Limiter & Reverse Proxy (Port 8000)
│
├── services/
│   ├── identity-service/     # Auth, JWT RS256, User Profiles & Admin Approvals (Port 5003)
│   ├── restaurant-service/   # Restaurant Profiles, Menus & Categories (Port 5004)
│   ├── order-service/        # Carts, Checkout, Orders & Kitchen Operations (Port 5002)
│   ├── notification-service/ # Realtime Socket.IO & Transactional Email Dispatch (Port 5005)
│   └── backend/              # Legacy monolith & driver dispatch engine (Port 5001)
│
├── infrastructure/
│   ├── docker/               # Production multi-stage Dockerfiles
│   └── kubernetes/           # Kubernetes manifests & deployment templates
│
├── packages/
│   └── shared/               # Shared constants, enums & response contracts
│
├── docs/                     # Architectural documentation & API specifications
├── scripts/                  # Health-check, dev runner, and maintenance scripts
├── docker-compose.yml        # Full-stack container orchestration
└── package.json              # Monorepo management scripts
```

---

## Service Mapping & Ports

| Service | Port | Database / Technology | Responsibility |
| :--- | :---: | :--- | :--- |
| **API Gateway** | `8000` | Express Proxy Middleware | Single entry point, rate limiting, routing |
| **Identity Service** | `5003` | Neon PostgreSQL (Prisma) + RS256 JWT | Authentication, RBAC, Admin Approvals |
| **Restaurant Service** | `5004` | Neon PostgreSQL (Prisma) | Restaurant catalog, menus, categories |
| **Order Service** | `5002` | Neon PostgreSQL (Prisma) | Cart, checkout, orders, operations |
| **Notification Service** | `5005` | Socket.IO + Nodemailer | Realtime events, order updates, email alerts |
| **Frontend App** | `5173` | React 19 + Vite + Tailwind | Modern user interfaces |

---

## Getting Started

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Start All Services Locally
```bash
npm run dev:all
# Or run with Windows batch script:
start.bat
```

### 3. Verify Health
```bash
powershell -ExecutionPolicy Bypass -File ./scripts/health-check.ps1
```
