# Neplance — Freelancing Marketplace for Nepal

A full-stack freelancing platform built for the Nepali market, supporting both **digital remote work** and **on-site physical jobs** — with **blockchain-backed contracts** as a trust layer for milestone payments and tamper-resistant agreement history.

**Live demo:** [neplance.vercel.app](https://neplance.vercel.app)


## Why Neplance

Existing freelancing platforms (Upwork, Fiverr, Freelancer.com) are built for an international, digital-only workforce. **They don't serve Nepal's reality**, where:

- A lot of skilled work is **on-site and physical** (electricians, carpenters, plumbers, photographers, event staff)
- Trust between strangers is **the single biggest barrier** to remote-arranged work
- International payment rails are friction-heavy for both clients and freelancers

Neplance addresses both. It supports digital *and* on-site job posting in one unified flow, and it uses **blockchain-anchored contracts (Foedus)** so that every agreement and milestone payout is verifiable and tamper-resistant — solving the trust problem without relying on a centralized escrow company.

---

## Demo Access

```
Client account:
  Email:    [add demo client credentials]
  Password:

Freelancer account:
  Email:    [add demo freelancer credentials]
  Password:
```

> You can also register your own account from the signup page.



---

## Features

### For Clients
- Post jobs (digital or on-site) with budget, skills required, location, and deadline
- Receive and compare proposals from freelancers
- Hire and sign milestone-based contracts
- Track work progress and release milestone payments
- Rate and review freelancers post-completion

### For Freelancers
- Browse and filter jobs by category, location, type (remote vs on-site), and budget
- Submit tailored proposals with cover letters and bid amounts
- Manage active contracts and milestones from a single dashboard
- Build a reputation through verified job completions and client ratings

### Platform-Wide
- **JWT-based authentication** with secure refresh-token rotation
- **Role-based access control** separating client and freelancer permissions
- **Blockchain-anchored contracts** via the custom **Foedus** chain — every signed agreement and milestone payout produces an on-chain record with a verifiable hash
- **In-app messaging** between clients and freelancers
- **Profile management** with skills, portfolio, and verification badges

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, React, Tailwind CSS |
| Backend | Node.js, Express |
| Database | MongoDB (Mongoose ODM) |
| Auth | JWT with refresh-token rotation |
| Contracts | Foedus — custom blockchain for contract anchoring |
| Deployment | Vercel (frontend), [add backend host] |

**Backend architecture highlights:**
- **20+ REST endpoints** organized by domain (auth, jobs, proposals, contracts, users, messages)
- **Mongoose schemas** for users (client / freelancer discriminator), jobs, proposals, contracts, milestones, and messages
- **Middleware-driven auth** with role guards on protected routes
- **Modular controller pattern** keeping route handlers thin and business logic testable

---

## Local Setup

**Requirements:** Node.js 18+, MongoDB connection string

### 1. Clone the repo

```bash
git clone https://github.com/dibyaadhikaree/Neplance.git
cd Neplance
```

### 2. Install frontend and backend

```bash
# Frontend
cd client
npm install

# Backend
cd ../server
npm install
```

### 3. Set up environment variables

**`server/.env`:**
```
MONGODB_URI=your_mongo_connection_string
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
PORT=5000
```

**`client/.env.local`:**
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 4. Run both servers

```bash
# Terminal 1 - backend
cd server && npm run dev

# Terminal 2 - frontend
cd client && npm run dev
```

Frontend runs on `http://localhost:3000`, backend on `http://localhost:5000`.

---

## Architecture

```
              ┌────────────────────────┐
              │     Client (Next.js)   │
              │                        │
              │  - Server Components   │
              │  - Tailwind UI         │
              │  - JWT in HTTP-only    │
              │    cookies             │
              └────────────┬───────────┘
                           │ REST
                           ▼
              ┌────────────────────────┐
              │   Backend (Express)    │
              │                        │
              │  - Auth middleware     │
              │  - Role guards         │
              │  - Modular controllers │
              └─────┬──────────────┬───┘
                    │              │
                    ▼              ▼
            ┌──────────────┐  ┌──────────────┐
            │   MongoDB    │  │    Foedus    │
            │              │  │  Blockchain  │
            │  Users       │  │              │
            │  Jobs        │  │  Contract    │
            │  Proposals   │  │  hashes      │
            │  Contracts   │  │  Milestone   │
            │  Messages    │  │  events      │
            └──────────────┘  └──────────────┘
```

**Data flow for a contract:**
1. Client accepts a freelancer's proposal → Express creates a `Contract` document in MongoDB
2. Contract terms are hashed and the hash is anchored on the Foedus blockchain → tx ID is stored on the Contract document
3. When a milestone is paid out, the payout event is also anchored on-chain
4. Either party can later verify the contract has not been altered by recomputing the hash and comparing against the on-chain record

---

## Team & My Contributions

Neplance was a **final-year capstone project** built by a team. My ownership covered:

- **Frontend architecture** — Next.js App Router, page-level data flow, all client- and server-rendered routes
- **Backend architecture** — Express server structure, 20+ REST endpoints, Mongoose schema design, JWT auth with refresh-token rotation, role-based middleware
- **Integration with the Foedus blockchain layer** — wiring the contract-signing and milestone payout flows to the on-chain anchoring service built by my teammates

The custom **Foedus blockchain** itself was built by teammates specialized in distributed systems.

---
