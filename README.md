# ChatApp

A production-grade, distributed real-time chat application with end-to-end encryption, group messaging, and video calling.

Live: [chat.stockimagesearch.online](https://chat.stockimagesearch.online/)

---

## Features

- **Real-time messaging** — WebSocket-based one-to-one and group chat, typing indicators, online presence, replies, unread counts
- **Encrypted transport** — RSA handshake + per-session AES-GCM encryption of every socket frame
- **Voice & video calling** — WebRTC peer-to-peer calls with ringing, accept/decline, busy/offline handling, mute and camera toggles
- **Group management** — Create groups, add/remove members, promote admins, rename, leave or delete
- **Profile photos** — Pick a built-in avatar or upload a photo (Cloudinary)
- **Authentication** — JWT access + refresh tokens in http-only cookies, email verification, OTP-based password reset
- **Resilient connections** — Automatic reconnect with backoff, offline message queue, dead-connection detection, "open in another window" takeover
- **Modern UI** — Responsive (mobile → desktop), light/dark/system themes, accessible controls
- **Scalable architecture** — Multiple socket server instances with Redis Streams message routing

---

## Architecture

The application is split into three services:

```
┌─────────────────┐     REST API      ┌──────────────────┐
│   Frontend      │ ◄───────────────► │   API Server     │
│  React + Vite   │   (auth, users,   │   Express.js     │
│  Port: 5173     │    groups, etc.)  │   Port: 8000     │
│                 │                   └───────┬──────────┘
│                 │    WebSocket              │
│                 │ ◄─────────────────────┐   │ MongoDB
│                 │  (real-time messages, │   │ Redis
│                 │   video signaling)    │   │ Cloudinary
└─────────────────┘                       │   │
                                 ┌────────▼───▼─────┐
                                 │  Socket Server   │
                                 │  Go + Gin        │
                                 │  Port: 3000/3001 │
                                 └──────────────────┘
                                          │
                           ┌──────────────┼──────────────┐
                           ▼              ▼              ▼
                        MongoDB         Redis        Cloudinary
```

| Service | Stack | Role |
|---|---|---|
| **Frontend** | React 19, Vite, Redux Toolkit, Tailwind CSS 4 | SPA — connects to API Server (REST) and Socket Server (WebSocket) directly |
| **API Server** | Node.js, Express 5, MongoDB, Redis | Auth, user profiles, group management, message history |
| **Socket Server** | Go 1.23, Gin, gorilla/websocket | WebSocket hub for real-time messaging and video call signaling |

---

## Project Structure

```
chatApp/
├── frontend/                   # React + Vite SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/          # Login, Register, ForgotPassword
│   │   │   ├── message/       # Sidebar, chat interface
│   │   │   ├── group/         # Group creation/management
│   │   │   └── videocall/     # WebRTC video call UI
│   │   ├── store/             # Redux slices
│   │   ├── helper/            # Utility functions
│   │   ├── constance/         # App constants
│   │   ├── socket.js          # WebSocket client
│   │   └── webrtc.js          # WebRTC implementation
│   └── package.json
│
├── api_server/                 # Express REST API
│   ├── src/
│   │   ├── controllers/       # user, message, group
│   │   ├── routes/            # /api/v1/users, /message, /group
│   │   ├── models/            # User, Message, Group, Verification (Mongoose)
│   │   ├── middleware/        # JWT auth, file upload
│   │   ├── db/                # MongoDB + Redis connections
│   │   └── utils/             # Cloudinary, email, API responses
│   ├── Dockerfile
│   └── package.json
│
├── socket_server/              # Go WebSocket + signaling server
│   ├── helpers/
│   │   ├── Socket.go          # WebSocket connection handling
│   │   ├── Mongodal.go        # MongoDB operations
│   │   ├── redis.go           # Redis operations
│   │   ├── redisStream.go     # Redis Streams message queue
│   │   ├── rsa.go             # RSA encryption
│   │   ├── Aes.go             # AES-GCM encryption
│   │   ├── scheduler.go       # Connection cleanup scheduler
│   │   ├── controller.go      # HTTP controllers
│   │   └── logger.go          # Uber Zap logging
│   ├── models/                # Go data models
│   ├── router/                # Gin router setup
│   ├── main.go
│   ├── Dockerfile
│   └── go.mod
│
└── docker-compose.yml          # Multi-service production setup
```

---

## Tech Stack

### Frontend
| Package | Version | Purpose |
|---|---|---|
| React | 19.1.0 | UI framework |
| Vite | 6.3.5 | Build tool |
| Redux Toolkit | 2.8.1 | State management |
| Tailwind CSS | 4 | Utility-first styling, light/dark themes |
| Web Crypto API + crypto-js (MD5 key derivation) | — | Client-side encryption |

### API Server
| Package | Version | Purpose |
|---|---|---|
| Express | 5.1.0 | HTTP framework |
| Mongoose | 8.1.3 | MongoDB ODM |
| Redis | 5.0.1 | Caching |
| jsonwebtoken | 9.0.2 | JWT auth |
| bcryptjs | 3.0.2 | Password hashing |
| Cloudinary | 2.6.1 | Media uploads |
| Email Worker API (HTTP) | — | Email (OTP, notifications) via `fetch`, no SMTP |
| multer | 1.4.5-lts.2 | File upload handling |

### Socket Server
| Package | Version | Purpose |
|---|---|---|
| Gin | 1.10.0 | HTTP/WebSocket framework |
| gorilla/websocket | 1.5.3 | WebSocket connections |
| mongo-driver | 1.17.1 | MongoDB driver |
| redigo | 1.9.2 | Redis client |
| golang-jwt | 3.2.2 | JWT validation |
| uber-go/zap | 1.27.0 | Structured logging |

---

## API Reference

### Users — `/api/v1/users`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/register` | — | Register new user (sends a verification code) |
| POST | `/verify-email` | — | Confirm the verification code and log in |
| POST | `/resend-verification` | — | Send a new verification code |
| POST | `/login` | — | Login |
| POST | `/refresh-token` | Refresh cookie | Rotate the access/refresh tokens |
| POST | `/forgot-password` | — | Initiate password reset |
| POST | `/check-otp` | — | Check a password-reset code |
| POST | `/reset-password` | — | Reset password with OTP (revokes existing sessions) |
| POST | `/logout` | ✓ | Logout |
| GET | `/info` | ✓ | Get user info |
| GET | `/user` | ✓ | Get current user profile |
| POST | `/user-edit` | ✓ | Update profile (username/email changes need an OTP) |
| POST | `/user-edit-otp` | ✓ | Send OTP for username/email change |
| POST | `/list` | ✓ | Search users |
| POST | `/avatar` | ✓ | Pick a built-in avatar |
| POST | `/avatar-upload` | ✓ | Upload avatar to Cloudinary |

### Messages — `/api/v1/message`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/all` | ✓ | Get message history (paginated) |
| POST | `/contacts` | ✓ | Get contact list |

### Groups — `/api/v1/group`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/new` | ✓ | Create group |
| POST | `/delete` | ✓ | Delete group (creator only) |
| POST | `/leave` | ✓ | Leave group |
| POST | `/add/member` | ✓ | Add member |
| POST | `/add/admin` | ✓ | Add admin |
| POST | `/remove/member` | ✓ | Remove member |
| POST | `/remove/admin` | ✓ | Remove admin |
| POST | `/description` | ✓ | Update description |
| POST | `/name` | ✓ | Update name |
| POST | `/check-group-name` | ✓ | Check name availability |

### Socket Server — Gin
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/ping` | — | Health check |
| GET | `/publickey` | — | Get RSA public key |
| GET | `/user/key` | RSA+Cookie | Get AES session key |
| GET | `/ws` | Token | WebSocket connection |

---

## Environment Variables

### API Server
See `api_server/.env.example` for the full list.
```env
PORT=8000
MONGODB_URI=mongodb+srv://...
MONGO_DB=chatzz
REDIS_HOST=localhost:6379
REDIS_USERNAME=
REDIS_PASSWORD=your_redis_password
REDIS_PREFIX=chatapp:
ACCESS_TOKEN_SECRET=your_jwt_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_secret
REFRESH_TOKEN_EXPIRY=10d
CORS_ORIGIN=http://localhost:5173
COOKIE_DOMAIN=                  # parent domain shared by all services in production
COOKIE_SAMESITE=none
COOKIE_SECURE=true              # false only for plain-http local development
TRUST_PROXY=1                   # reverse proxies in front of the API (0 if exposed directly)
TEST_USERS_ENABLED=false        # true = seed alice.test / bob.test / carol.test + "Test users" login tab
EMAIL_WORKER_URL=http://email-worker:3000
EMAIL_WORKER_KEY=ew_xxxxxxxx
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NODE_ENV=development
```

### Socket Server
```env
PORT=8000
PORT_GIN=3000
GIN_MODE=debug
MONGODB_URI=mongodb+srv://...
MONGO_DB=chatzz
REDIS_HOST=localhost:6379
REDIS_USERNAME=
REDIS_PASSWORD=your_redis_password
REDIS_PREFIX=chatapp:
ACCESS_TOKEN_SECRET=your_jwt_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_secret
REFRESH_TOKEN_EXPIRY=10d
CORS_ORIGIN=http://localhost:5173
VM_ID=vm1
```

### Frontend
```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_WS_URL=http://localhost:3000
VITE_GIN_URL=http://localhost:3000
# optional TURN server, needed for calls across strict NATs
VITE_TURN_URL=turn:turn.example.com:3478
VITE_TURN_USERNAME=
VITE_TURN_CREDENTIAL=
```

---

## Getting Started

### Prerequisites
- Node.js 22+
- Go 1.23+
- MongoDB instance (local or Atlas)
- Redis instance (local or Redis Cloud)
- Cloudinary account (for media uploads)

### 1. Clone the repository
```bash
git clone <repo-url>
cd chatApp
```

### 2. Start the API Server
```bash
cd api_server
cp .env.example .env   # fill in your values
npm install
npm run dev
```

### 3. Start the Socket Server
```bash
cd socket_server
cp .env.example .env   # fill in your values
go mod download
go run main.go
```

### 4. Start the Frontend
```bash
cd frontend
cp .env.example .env.local   # fill in your values
npm install
npm run dev
```

Frontend will be available at `http://localhost:5173`.

### Test users

Set `TEST_USERS_ENABLED=true` on the API server to get three shared demo
accounts — `alice.test`, `bob.test` and `carol.test` — plus a "Test Lounge"
group and a few starter messages. They are created (or reset) at startup and
appear in a **Test users** tab on the login page, where one click signs you in.
Open a second browser or private window as another test user to try chat and
calls. Anyone can use these accounts, so their profiles and passwords can't be
changed; leave the flag off in production unless you want a public demo.

---

## Docker Deployment

### Full stack (production)
```bash
# From project root — starts 2× socket server + 1× API server
docker compose up -d
```

### Socket server only (local dev)
```bash
cd socket_server
docker compose up -d
```

### Build images manually
```bash
docker build -t chatapp-api ./api_server
docker build -t chatapp-socket ./socket_server
```

The socket server Docker image uses a multi-stage build (Go binary compiled in `golang:alpine`, run in `alpine:3.21`) with a non-root user for security.

---

## Security

- **JWT auth** — Access + rotating refresh tokens in HTTP-only cookies; password resets revoke existing sessions
- **Socket authentication** — The WebSocket handshake must present the session key issued by `/user/key` (which requires a valid JWT), so a token cannot be forged with the public RSA key
- **RSA + AES-GCM** — RSA-OAEP protects the handshake; every socket frame is AES-GCM encrypted with a per-session key
- **Password hashing** — bcryptjs
- **One-time codes** — Cryptographically random, stored hashed, expire after 15 minutes, max 5 attempts, single use
- **Email verification** — Accounts must verify their email before they can sign in
- **Abuse protection** — Rate limiting on auth/OTP/email endpoints, request-size limits, MongoDB-operator injection guard, input type validation
- **Authorization** — Group history, details and admin actions are restricted to members/admins; group messages are only accepted from members
- **Uploads** — Image-only allowlist, 5 MB limit, server-generated file names
- **No account enumeration** — Login, password reset and resend endpoints answer the same way whether or not an account exists
- **Headers** — Helmet security headers; CORS strict origin allowlist

---

## Scaling

- Two socket server instances run in parallel behind a load balancer
- Redis Streams used as a distributed message queue across instances
- Each instance registers itself via a `VM_ID` in Redis for instance-aware routing
- Group member sets cached in Redis for fast fan-out
- MongoDB handles durable message and user storage
