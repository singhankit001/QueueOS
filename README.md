<div align="center">
  <br />
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/layers.svg" alt="QueueOS Logo" width="80" height="80" />
  <h1>QueueOS</h1>
  <p>
    <strong>A Premium, Real-Time Queue Management Platform</strong>
  </p>
  <p>
    <a href="#features">Features</a> •
    <a href="#architecture">Architecture</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#quick-start">Quick Start</a>
  </p>
</div>

---

**QueueOS** is an enterprise-grade Queue Management System designed to handle high-throughput queue operations with zero latency. It brings a modern, highly-polished user interface inspired by the best SaaS products in the market, coupled with a robust, type-safe, and real-time backend.

## 🌟 Features

- **Real-Time Synchronization**: WebSockets (Socket.io) ensures all clients see the exact same queue state instantly.
- **ACID Compliant Reordering**: Safe token re-ordering with Prisma Interactive Serializable Transactions to prevent race conditions.
- **Enterprise UI/UX**: A dark-mode first, glassmorphic design system heavily inspired by Linear and Vercel. 
- **Role-Based Access**: Secure JWT authentication and session management.
- **Analytics & Metrics**: Real-time insights into average wait times, total served, and queue throughput.
- **Audit Logs**: Immutable activity logging for complete operational transparency.

## 🏗 Architecture

QueueOS is built on a decoupled Client-Server architecture:

- **Client**: Next.js 14 App Router, React Query for caching, Framer Motion for micro-interactions, and Tailwind CSS for styling.
- **Server**: Express.js with TypeScript, Zod for runtime validation, and Socket.io for duplex communication.
- **Database**: PostgreSQL with Prisma ORM.

### ER Diagram
Please see [ER_DIAGRAM.md](./ER_DIAGRAM.md) for the complete data model.

## 🛠 Tech Stack

**Frontend**
- Next.js (React 18)
- Tailwind CSS & Radix UI
- Framer Motion
- React Query & Zustand
- Socket.io-client

**Backend**
- Node.js & Express
- TypeScript
- Prisma ORM
- Zod
- Socket.io
- JSON Web Tokens (JWT)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/queueos.git
   cd queueos
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Update your DATABASE_URL and JWT_SECRET in .env
   npx prisma db push
   npx prisma generate
   npm run dev
   ```

3. **Setup Frontend**
   ```bash
   cd ../frontend
   npm install
   cp .env.example .env.local
   # Update NEXT_PUBLIC_API_URL if necessary
   npm run dev
   ```

4. **Access the Application**
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:5001/api`

## 🛡 Security & Reliability

QueueOS is built with security and reliability as first-class citizens:
- **Strict Typing**: End-to-end type safety with TypeScript and Zod.
- **Serializable Transactions**: Prevention of dirty reads and phantom writes during high-concurrency token modifications.
- **Protected Routes**: Middleware-enforced JWT verification for all sensitive endpoints.

## 📜 License

Copyright © 2024 QueueOS. All rights reserved.
