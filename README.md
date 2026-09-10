# Orderly — Distributed Food Delivery Platform

Orderly is a modern, microservices-based food delivery platform designed for high-concurrency order placement, real-time tracking, and automated driver dispatching. Built with Node.js, Express, React (Vite), Socket.IO, and Sequelize ORM.

---

## ?? Key Features

- **API Gateway Pattern**: Single entry point (`Port 8000`) for all client requests, proxying requests cleanly to internal microservices.
- **Identity & Auth Microservice**: Secure JWT authentication and Role-Based Access Control (`CUSTOMER`, `RESTAURANT`, `DELIVERY_PARTNER`, `ADMIN`).
- **Automated Order Dispatch Engine**: Candidate ranking based on geospatial bounding-box queries, driver ratings, and atomic database transaction locks (`LOCK.UPDATE`) to prevent double assignment.
- **Real-Time Websocket Updates**: Socket.IO event broadcasting for instant order status tracking from kitchen to customer.
- **Modular Microservices Architecture**: Decoupled domain services for Order management, Restaurant menus, Notifications, and Authentication.

---

## ??? Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, Vite, TailwindCSS, Redux Toolkit |
| **Backend Runtime** | Node.js, Express.js |
| **Architecture** | API Gateway & Microservices (`gateway`, `identity-service`, `order-service`, `restaurant-service`, `notification-service`) |
| **Database** | PostgreSQL / MSSQL / MySQL |
| **ORM** | Sequelize ORM |
| **Authentication** | JWT (JSON Web Token) + Role Authorization |
| **Real-time Engine** | Socket.IO |

---

## ?? Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/rajesh-kayal-dev/orderly-food-delivery-system.git
cd orderly-food-delivery-system
```

### 2. Start All Services (Windows Batch Launcher)

Launch all microservices and the frontend in separate terminal windows with a single command:

```cmd
.\start.bat
```

> - **Frontend Application**: [http://localhost:5173](http://localhost:5173)
> - **API Gateway**: [http://localhost:8000](http://localhost:8000)

### 3. Stop All Services

To terminate all running services and close terminal windows cleanly:

```cmd
.\stop.bat
```

---

## ?? Architecture & Microservices Structure

```text
orderly-food-delivery-system/
+-- gateway/              # API Gateway Microservice (Port 8000)
+-- identity-service/     # Auth & Identity Microservice (Port 5003)
+-- restaurant-service/   # Restaurant & Catalog Microservice (Port 5004)
+-- order-service/        # Order Management & Payment Microservice (Port 5002)
+-- notification-service/ # Real-time Socket.IO & Notification Microservice (Port 5005)
+-- backend/              # Monolith Backend & Seeder Engine (Port 5000/5001)
+-- frontend/             # React (Vite) Single Page Application (Port 5173)
+-- start.bat             # Batch launcher for all services
+-- stop.bat              # Batch process terminator
```

---

## ? Real-Time Socket.IO Events

| Event | Direction | Description |
|---|---|---|
| `join` | Client -> Server | Joins user to private real-time notification room |
| `join_deliveries` | Driver -> Server | Subscribes driver to available dispatch offers pool |
| `NEW_ORDER` | Server -> Kitchen | Notifies restaurant of newly placed customer order |
| `ORDER_STATUS_UPDATED` | Server -> Client | Broadcasts live order state (`cooking`, `ready`, `picked_up`, `delivered`) |
| `AVAILABLE_DELIVERY` | Server -> Driver | Pushes sequential delivery offer to nearby drivers |

---

## ?? Default Seed Test Accounts

After running the database seeder (`node seed.js` inside `backend/` or `order-service/`):

| Role | Email | Password |
|---|---|---|
| **Customer** | `customer@test.com` | `password123` |
| **Restaurant** | `restaurant@test.com` | `password123` |
| **Delivery Partner** | `driver@test.com` | `password123` |
| **Admin** | `admin@test.com` | `password123` |
