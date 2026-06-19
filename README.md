<div align="center">

<br/>

```
   ██████╗██╗      ██████╗ ██╗   ██╗██████╗ ███████╗██╗  ██╗ █████╗ ██████╗ ███████╗
  ██╔════╝██║     ██╔═══██╗██║   ██║██╔══██╗██╔════╝██║  ██║██╔══██╗██╔══██╗██╔════╝
  ██║     ██║     ██║   ██║██║   ██║██║  ██║███████╗███████║███████║██████╔╝█████╗  
  ██║     ██║     ██║   ██║██║   ██║██║  ██║╚════██║██╔══██║██╔══██║██╔══██╗██╔══╝  
  ╚██████╗███████╗╚██████╔╝╚██████╔╝██████╔╝███████║██║  ██║██║  ██║██║  ██║███████╗
   ╚═════╝╚══════╝ ╚═════╝  ╚═════╝ ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
```

### ⚡ A high-performance, secure cloud file-sharing client — built for resilience.

<br/>

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Axios](https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white)](https://axios-http.com/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

<br/>

[🚀 Features](#-features) · [🔒 Engineering Deep Dive](#-engineering-spotlight-interceptor-request-queuing) · [🛠️ Tech Stack](#%EF%B8%8F-technology-stack) · [💻 Getting Started](#-getting-started) · [📁 Project Structure](#-project-structure) · [🔗 Backend](#-backend)

<br/>

---

</div>

## 🚀 Features

<table>
<tr>
<td width="50%">

### 🖱️ Drag & Drop File Upload
A fully managed visual interaction lifecycle with responsive drop-zone scaling, real-time file validation alerts, and smooth state transitions across `onDragOver`, `onDragLeave`, and `onDrop` events.

</td>
<td width="50%">

### 🔗 Share Link Widget
Dynamic link output generation with native clipboard support via `navigator.clipboard`. One click — the link is copied and the user is immediately confirmed with visual feedback.

</td>
</tr>
<tr>
<td width="50%">

### 📧 Email Distribution Component
A modular, fully decoupled email dispatch card that connects securely to link-sharing microservices. Isolated transaction logic keeps the component clean and independently testable.

</td>
<td width="50%">

### 🌙 Adaptive Dark Mode
High-contrast, fluid visual design built entirely with Tailwind CSS utility classes — no extra stylesheets, no overrides. Looks great in every environment, day or night.

</td>
</tr>
</table>

<br/>

---

## 🔒 Engineering Spotlight: Interceptor Request Queuing

> The core resilience pattern that makes CloudShare production-grade.

Instead of crashing or abruptly redirecting users to a login screen when a session token expires, CloudShare handles recovery **silently and securely — entirely behind the scenes**.

### ⚠️ The Race Condition Problem

When the application mounts under `React.StrictMode` (or when a dashboard triggers multiple background data-fetches simultaneously), several parallel requests can hit the backend at the **exact same millisecond**.

If the user's access token is expired, **every single request fails** with `401 Unauthorized`.

Without a dedicated solution, this cascades into parallel calls to the `/refresh-token` endpoint — corrupting the backend's strict token-rotation safety rules and crashing the application.

```
❌ Without Queuing:

  Request A ──► 401 ──► refresh() ──►┐
  Request B ──► 401 ──► refresh() ──►┼──► Token rotation conflict 💥
  Request C ──► 401 ──► refresh() ──►┘
```

<br/>

### ✅ The Asynchronous Promise Queue Solution

CloudShare implements a **locking array buffer** inside its custom Axios configuration instance, resolving the race condition in three clean steps:

```
✅ With Queuing:

  Request A ──► 401 ──► isRefreshing = true ──► /refresh-token ──► ✓ new token
  Request B ──► 401 ──► isRefreshing? YES ──► pushed to failedQueue[ ]
  Request C ──► 401 ──► isRefreshing? YES ──► pushed to failedQueue[ ]
                                                        │
                                         ┌──────────────┘
                                         ▼
                              flushQueue(newToken) ──► Resolve all, re-execute ✓
```

<br/>

**Step 1 — Gatekeeper Lock**

The first `401` error to arrive flips a boolean flag (`isRefreshing = true`) and initiates a **single** background recovery call to `/refresh-token`.

**Step 2 — The Waiting Room**

Any other requests that fail concurrently encounter the `isRefreshing` lock. Instead of hitting the backend again, they are captured as **unfulfilled JavaScript Promises** and pushed into a `failedQueue` array.

**Step 3 — Flushing & Re-execution**

The moment the single refresh call succeeds, the queue helper walks the array, resolves all held promises with the new session token, and **re-executes all original requests seamlessly**. The user never notices an interruption.

<br/>

```javascript
// src/services/api.js — Simplified conceptual view

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    error ? prom.reject(error) : prom.resolve(token);
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // 📥 Park the request — it will be retried once refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return axiosInstance(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axiosInstance.post('/refresh-token');
        processQueue(null, data.accessToken); // ✅ Flush & re-execute all queued requests
        return axiosInstance(originalRequest);
      } catch (err) {
        processQueue(err, null); // ❌ Flush with error, redirect to login
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
```

<br/>

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Core Framework** | React.js (Functional Components & Hooks) | UI rendering & component lifecycle |
| **Client Networking** | Axios (Custom Instances + Interceptors) | HTTP requests, async buffering, session recovery |
| **Global State** | Context API & Custom Auth Hooks | Authentication state across the component tree |
| **Styling** | Tailwind CSS + PostCSS | Utility-first, dark-mode-ready UI |

<br/>

---

## 💻 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) installed locally
- A running instance of the [CloudShare Backend API](https://github.com/PRIYANSHUPAUL786125/file-sharing-test)

<br/>

### 1. Clone & Install

```bash
git clone <your-repository-url>
cd cloudshare-frontend
npm install
```

### 2. Configure the API Endpoint

Open `src/services/api.js` and update the `baseURL` to point at your running backend server:

```javascript
// src/services/api.js
const axiosInstance = axios.create({
  baseURL: 'http://localhost:3000/api', // ← update this
  withCredentials: true,
});
```

### 3. Run the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the port shown in your terminal).

<br/>

---

## 📁 Project Structure

```
cloudshare-frontend/
│
├── public/
│
└── src/
    ├── components/
    │   └── ShareEmail.jsx      # 📧 Decoupled email input form & validation card
    │                           #    Isolated transaction logic for link dispatch
    │
    ├── services/
    │   └── api.js              # ⚙️  Custom Axios instance
    │                           #    Interceptor promise-queue logic
    │                           #    Authentication hooks & session recovery
    │
    └── pages/
        └── Home.jsx            # 🏠 Main landing page
                                #    Drag-and-drop state manager
                                #    Share link widget & UI orchestration
```

<br/>

---

## 🔗 Backend

This frontend is designed to work with a dedicated Node.js backend API. You can find the companion repository here:

**➡️ [file-sharing-test (Backend)](https://github.com/PRIYANSHUPAUL786125/file-sharing-test)**

The backend handles file storage, token issuance, token rotation, the `/refresh-token` endpoint, and email dispatch services that this client depends on.

<br/>

---

<div align="center">

Built with ❤️ using React, Axios, and Tailwind CSS.

</div>
