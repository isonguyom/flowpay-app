# FlowPay

FlowPay is a full-stack payment and wallet management platform that allows users to manage multi-currency wallets, make cross-currency payments, track transactions, and receive real-time updates via webhooks and WebSockets.

The system supports:

* Authentication with refresh tokens
* Multi-currency wallets
* Payments with fees and FX conversion
* Transaction history
* Idempotent payment handling
* Real-time transaction updates
* Rate limiting and request throttling
* Feature flags
* Dockerized and local development setups

---

## Tech Stack

**Backend**

* Node.js
* Express.js
* MongoDB (Mongoose)
* JWT-based auth with refresh tokens
* Stripe (Payments)
* WebSockets(Socket.io)
* Docker

**Frontend**

* Vue 3 (Composition API)
* Pinia Store
* Tailwind CSS
* Axios
* Vue Router


---

##  Local Setup (Without Docker)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/flowpay.git
cd flowpay
```

## 2. Environment Variables

Create a `.env` file in the **backend** and **frontend** directories using the sample `.env.example` in both directories.

### 3. Backend setup

```bash
cd backend
npm install
npm run dev
```

Backend will run on:

```
http://localhost:8000
```

### 4. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on:

```
http://localhost:5173
```

---

##  Docker Setup (Recommended)

### 1. Ensure Docker is running

Make sure you have **Docker** and **Docker Compose** installed.

### 2. Build and start containers

From the project root:

```bash
docker-compose up --build
```

### 3. Access the app

* Backend: `http://localhost:8000`
* Frontend: `http://localhost:5173`
* MongoDB runs internally in Docker

To stop containers:

```bash
docker-compose down
```