<div align="center">

# 🎬 CINEVERSE

### **Modern IPTV Playlist Manager & Low-Latency Live Web Streaming Platform**

[![GitHub](https://img.shields.io/badge/GitHub-rajaaravv-181717?style=flat-square&logo=github)](https://github.com/rajaaravv)
[![Java](https://img.shields.io/badge/Java-21-ED8B00?style=flat-square&logo=openjdk&logoColor=white)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.3.4-6DB33F?style=flat-square&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Design System](https://img.shields.io/badge/Design_Theme-Vercel_Monochrome_Geist-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com/font)
[![HLS.js](https://img.shields.io/badge/HLS.js-Live_Streaming-FF6B6B?style=flat-square)](https://github.com/video-dev/hls.js)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

<p align="center">
  <b>Cineverse</b> is an ultra-fast, cloud-ready IPTV platform engineered with a decoupled <b>Java 21 Spring Boot 3.3</b> backend and a <b>React 18 + TypeScript</b> frontend styled in the <b>Vercel Monochrome (Geist)</b> design system.
</p>

[Key Features](#-key-features) • [Tech Stack](#-technology-stack) • [Quick Start](#-quick-start) • [Docker Deployment](#-docker-deployment) • [API Reference](#-api-endpoints) • [Author](#-author)

---

</div>

## ✨ Key Features

- **⚡ Low-Latency HLS Web Player (`hls.js`)**: Real-time HTTP Live Streaming engine supporting live streams and VOD with automatic reconnection, buffer recovery, volume controls, and picture-in-picture.
- **🖤 Vercel Monochrome Design Theme**: Clean, minimal aesthetics using the **Geist** typeface, Geist Mono, 100% semantic CSS variable tokens (`oklch`), subtle borders, and zero hardcoded colors.
- **📂 High-Throughput M3U / M3U8 Stream Parser**: Parses remote M3U URL feeds and uploaded `.m3u` files, extracting stream resolutions, `group-title`, `tvg-logo`, and channel metadata.
- **🌟 Smart Spotlight Hero Banner**: Automatically detects and showcases your most recently watched channel or trending live streams with 1-click instant resume.
- **🔍 Command Palette Search (`Ctrl + K` / `Cmd + K`)**: Fast global modal search across all imported channels and categories with keyboard shortcuts.
- **⭐ Starred Favorites Shelf**: Pin channels to your personalized shelf for instant one-click streaming.
- **⏱️ Watch History Tracking**: Automatic stream session logging with relative timestamps (`Just now`, `5m ago`) and full history management.
- **🔐 Stateless JWT Authentication**: Secure BCrypt password hashing, token validation, user profile management, and a 1-click Instant Demo Sign-In.

---

## 🛠️ Technology Stack

### **Frontend**
| Technology | Description |
| :--- | :--- |
| **React 18.3** | Component-driven UI architecture with custom hooks |
| **TypeScript 5.5** | Strongly-typed models, API definitions, and compile-time safety |
| **Vite 5.4** | Next-generation frontend build tooling and HMR dev server |
| **Tailwind CSS 3.4** | Utility-first styling with shadcn/ui semantic design tokens |
| **Geist & Geist Mono** | Modern typography for clean UI readability and tabular metrics |
| **HLS.js** | JavaScript HLS client for HTML5 video playback |
| **Lucide React** | Lightweight, consistent monochrome iconography |
| **Axios** | Promise-based HTTP client with automatic JWT bearer interceptors |

### **Backend**
| Technology | Description |
| :--- | :--- |
| **Java 21** | Modern LTS Java runtime with virtual threads support |
| **Spring Boot 3.3.4** | Enterprise REST API microservice framework |
| **Spring Security 6** | Stateless authentication with custom filters |
| **JJWT 0.12.6** | JSON Web Token (HMAC-SHA256) session management |
| **Spring Data JPA & Hibernate** | Object-relational persistence layer |
| **H2 & PostgreSQL** | Dual profile support: In-memory H2 (Dev) & PostgreSQL (Prod) |
| **Springdoc OpenAPI (Swagger)** | Interactive API documentation (`/swagger-ui.html`) |
| **Maven 3.9** | Dependency and lifecycle management |

---

## 📁 Repository Structure

```text
Cineverse/
├── backend/                      # Java 21 / Spring Boot 3.3 API
│   ├── src/main/java/com/streamhub/
│   │   ├── config/               # Security, JWT, Swagger, Data Seeders
│   │   ├── controller/           # REST Endpoints (Auth, Channels, Playlists, etc.)
│   │   ├── dto/                  # Request / Response Data Transfer Objects
│   │   ├── entity/               # JPA Entities (User, Channel, Playlist, History)
│   │   ├── exception/            # Global Exception Handling
│   │   ├── parser/               # High-speed M3U/M3U8 Streaming Parser
│   │   ├── repository/           # Spring Data JPA Repositories
│   │   └── service/              # Core Business Logic Services
│   └── pom.xml                   # Maven Build Config
│
├── frontend/                     # React 18 / Vite / TypeScript App
│   ├── src/
│   │   ├── api/                  # Axios REST API Client Modules
│   │   ├── components/           # UI Components (Player, Cards, Modals, Docks)
│   │   ├── context/              # Global React Contexts (AuthContext, PlayerContext)
│   │   ├── pages/                # Views (Home, Channels, Playlists, Favorites, Profile)
│   │   ├── types/                # TypeScript Interfaces & Models
│   │   └── index.css             # Vercel Monochrome CSS Variables (:root & .dark)
│   ├── index.html                # HTML5 Shell with Geist Font CDN
│   ├── tailwind.config.js        # Semantic Tailwind Configuration
│   └── package.json              # Frontend Dependencies
│
├── sample-playlists/             # Pre-configured legal IPTV playlists for testing
├── docker-compose.yml            # Multi-container Docker deployment
├── run-backend.ps1               # Quick-start script for Backend
└── run-frontend.ps1              # Quick-start script for Frontend
```

---

## 🚀 Quick Start

### Prerequisites
- **JDK 21** installed and configured in `PATH`
- **Node.js (v18+ or v20+)** & **npm**
- **Apache Maven (3.9+)** (or use included wrappers)

### 1. Clone the Repository
```bash
git clone https://github.com/rajaaravv/Cineverse.git
cd Cineverse
```

### 2. Start the Backend API
```bash
cd backend
mvn spring-boot:run
```
*The Spring Boot server will start at `http://localhost:8080`.*
- **Swagger Documentation**: `http://localhost:8080/swagger-ui.html`
- **OpenAPI Schema**: `http://localhost:8080/api-docs`
- **H2 Console (Dev)**: `http://localhost:8080/h2-console`

### 3. Start the Frontend Web App
```bash
cd frontend
npm install
npm run dev
```
*The React application will launch at `http://localhost:5173`.*

---

## 🐳 Docker Deployment

Run the entire application stack (PostgreSQL + Spring Boot Backend + React Frontend) with a single command:

```bash
docker-compose up -d --build
```

| Service | URL / Port |
| :--- | :--- |
| **Cineverse Web App** | `http://localhost:3000` |
| **Backend REST API** | `http://localhost:8080` |
| **PostgreSQL Database** | `localhost:5432` |

To stop the containers:
```bash
docker-compose down
```

---

## 📡 API Endpoints

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new user account |
| `POST` | `/api/auth/login` | Authenticate and obtain JWT token |
| `POST` | `/api/auth/logout` | Invalidate current session |

### 📂 Playlists (`/api/playlists`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/playlists` | List all playlists for authenticated user |
| `POST` | `/api/playlists` | Import M3U playlist via URL or raw content |
| `POST` | `/api/playlists/upload` | Upload `.m3u` / `.m3u8` playlist file |
| `PUT` | `/api/playlists/{id}` | Rename existing playlist |
| `POST` | `/api/playlists/{id}/refresh` | Refresh channels from original source URL |
| `DELETE` | `/api/playlists/{id}` | Delete playlist and associated channels |

### 📺 Channels (`/api/channels`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/channels` | Paginated channel catalog with category filters |
| `GET` | `/api/channels/search` | Search channels by query string |
| `GET` | `/api/channels/categories` | List categories with live channel counts |
| `GET` | `/api/channels/{id}` | Get channel stream details |

### ⭐ Favorites & Watch History
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/favorites` | List all starred favorite channels |
| `POST` | `/api/favorites/{channelId}` | Add channel to favorites |
| `DELETE` | `/api/favorites/{channelId}` | Remove channel from favorites |
| `GET` | `/api/history` | Get recent watch history |
| `POST` | `/api/history/{channelId}` | Record stream view event |
| `DELETE` | `/api/history` | Clear all watch history |

---

## ⌨️ Player Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Space` | Play / Pause Stream |
| `F` | Toggle Fullscreen Mode |
| `M` | Mute / Unmute Audio |
| `Arrow Up` / `Arrow Down` | Adjust Volume Up / Down |
| `Esc` | Exit Fullscreen / Close Player Drawer |
| `Ctrl + K` / `Cmd + K` | Open Command Palette Channel Search |

---

## 👤 Author

**Aravind / rajaaravv**
- GitHub: [@rajaaravv](https://github.com/rajaaravv)
- Project: [Cineverse](https://github.com/rajaaravv/Cineverse)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — free for personal, educational, and commercial use.
