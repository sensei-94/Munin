# Munin Internal Dashboard

A full-stack app using **React** (frontend) and **Node.js + Express** (backend).

---

## ⚙️ Setup

```bash

# Backend setup
cd server && npm install

# Frontend setup
cd ../client && npm install
```

Create `.env` in `/server`:

```env
PORT=5000
```

`/client`:

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🧪 Run Locally

```bash
# Start backend
cd server && npm run dev

# Start frontend
cd client && npm start  # or npm run dev
```

---

## 📁 Structure

```
/client   # React frontend
/server   # Node.js backend
```

---

## 🚀 Scripts

**Backend**
- `npm run dev`: Dev mode (nodemon)

**Frontend**
- `npm start`: Start React
- `npm run build`: Production build

---
