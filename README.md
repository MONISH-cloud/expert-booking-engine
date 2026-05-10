# ⚡ ExpertBook: Real-Time High-Concurrency Booking System

**ExpertBook** is a production-grade booking engine designed for real-time expert discovery and atomic slot reservations. Built for scale, the system leverages a decoupled architecture to ensure data integrity even when multiple users compete for the same time slot simultaneously.

---

## 🛠️ The Tech Stack
* **Frontend:** React 18 (Vite) + Tailwind CSS
* **Backend:** Node.js + Express.js
* **Real-Time:** Socket.io (Bi-directional state synchronization)
* **Database:** MongoDB Atlas (Cloud)
* **State Management:** Context API + Custom Axios Interceptors

---

## 🏗️ Architectural Highlights

### 1. Atomic Booking & Race Condition Protection
I implemented **"Conflict-Aware"** backend logic. Using **MongoDB Compound Unique Indexes** and Mongoose transactions, the system physically prevents double-booking. If two users attempt to book the same millisecond, the database rejects the second request at the driver level, maintaining 100% data integrity.

### 2. Real-Time State Sync
The system utilizes **Socket.io** to bridge the gap between clients. When a slot is booked, the server broadcasts an event to all connected clients, triggering an "optimistic" UI update or a state-refresh. This ensures that availability is always live without requiring a manual page reload.

### 3. Resilience & Environment Management
The system is built to be environment-agnostic. During development, I reconfigured the architecture to **Port 5001** (Backend) and **Port 5175** (Frontend) to bypass macOS AirPlay port conflicts, utilizing environment variables to ensure seamless cross-origin communication.

### 4. Pro-Grade API Handling
The frontend features a custom **Axios Interceptor** layer. It doesn't just fetch data; it catches `409 Conflict` errors and provides structured feedback to the UI, allowing for a "fail-gracefully" user experience via custom modals and state rollbacks.

---

## 🚀 Quick Start

### 1. Prerequisites
* Node.js (v18+)
* MongoDB Atlas Account

### 2. Backend Setup
```bash
cd server
npm install

Create a .env file:
PORT=5001
MONGO_URI=your_mongodb_atlas_uri
CLIENT_URL=http://localhost:5175

Seed the Database:
npm run seed  # Populates 50 experts with randomized slots
npm run dev   # Starts server on Port 5001


3. Frontend Setup

cd client
npm install
npm run dev   # Starts Vite on Port 5175

Core Features

Dynamic Search: Debounced search bar to prevent API spam.
Category Filtering: Instant filtering across multiple professional industries.
Instant Availability: See slots turn "Booked" in real-time.
Skeleton Loading: Enhanced UX with CSS-animated skeleton cards during data fetching.

Developed By
Monish
Computer Science & Engineering | RV University
Specializing in High-Concurrency Systems & Scalable Web Architecture
---

### ⬆️ How to Push this to GitHub
Once you have saved the file above, run these three commands in your terminal to update the repo:

```bash
git add README.md
git commit -m "docs: finalize project manifesto with technical architecture and correct ports"
git push origin main
