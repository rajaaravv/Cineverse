# StreamHub - Modern IPTV Playlist Manager & Live Web Player

StreamHub is a full-stack IPTV web application that allows users to import M3U playlists, browse channels by category, search live streams, organize favorites, track watch history, and stream live TV directly in the browser using [Hls.js](https://github.com/video-dev/hls.js).

---

## Architecture & Tech Stack

- **Frontend**:
  - React 18 with TypeScript
  - Vite for ultra-fast bundling and development
  - Tailwind CSS for modern cinema dark UI
  - HLS.js for live HTTP Live Streaming playback (HLS / MPEG-TS)
  - Lucide React icons
  - Axios with JWT token interceptors & React Router v6
- **Backend**:
  - Java 21 & Spring Boot 3.3.4
  - Spring Security 6 & JJWT (HMAC-SHA256 Bearer tokens)
  - Spring Data JPA & Hibernate
  - High-throughput streaming M3U parser (URL & file uploads)
  - Dual-profile configuration: PostgreSQL (prod) & H2 in-memory (dev)
  - Springdoc OpenAPI (Swagger UI)
- **Deployment**:
  - Docker & Docker Compose
  - Nginx reverse proxy

---

## Core Features

1. **User Authentication & Profiles**:
   - Secure registration, login, and profile updates (username & password changes).
   - Password encryption with BCrypt.
   - Built-in `demo` account (`demo` / `demo123`) for instant testing.
2. **Playlist Management**:
   - Import M3U via accessible HTTP/HTTPS URL or file upload (`.m3u` / `.m3u8`).
   - One-click Curated Demo Channels button with pre-vetted, legal public IPTV streams (Bloomberg, France 24, DW, Red Bull TV, NASA TV, etc.).
   - Rename playlists, refresh channels from the original URL, and delete playlists.
3. **Channel Discovery & Browser**:
   - Instant debounced search by channel name or category.
   - Dynamic category pills with channel counts.
   - Sort alphabetically (A-Z, Z-A).
   - Pagination and channel logo fallback placeholders.
4. **Live TV Player**:
   - Real-time video player using HLS.js with live sync.
   - Auto-reconnect with exponential backoff on stream interruptions.
   - Volume slider & mute control.
   - Channel switching drawer and next/previous channel buttons.
   - Picture-in-Picture (PiP) and Fullscreen mode.
   - Keyboard shortcuts (`Space`, `F`, `M`, `ArrowUp/Down`, `ArrowLeft/Right`, `Esc`).
5. **Favorites & Watch History**:
   - Pin favorite channels with a single click.
   - Dedicated favorites page.
   - Automatic watch history logging with "Resume Watching" action and clear history.

---

## Quick Start (Local Development)

### 1. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The frontend will start at `http://localhost:5173`.

### 2. Backend Setup
```bash
cd backend
mvn spring-boot:run
```
*(Or if using Maven wrapper: `./mvnw spring-boot:run`)*

The backend will start at `http://localhost:8080`.
- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/api-docs`
- H2 Console (dev profile): `http://localhost:8080/h2-console`

---

## Docker Deployment (Full Stack)

To run the complete platform (PostgreSQL + Spring Boot + React/Nginx) with a single command:

```bash
docker-compose up -d --build
```

Access the application:
- **StreamHub Web App**: `http://localhost:3000`
- **Backend API**: `http://localhost:8080`
- **PostgreSQL Database**: Port `5432`

---

## API Reference

### Authentication
- `POST /api/auth/register` - Create a new user account
- `POST /api/auth/login` - Authenticate user and receive JWT token
- `POST /api/auth/logout` - Invalidate session

### User Profile
- `GET /api/user/profile` - Get user details, playlist count, and favorite count
- `PUT /api/user/profile` - Update username or password

### Playlists
- `GET /api/playlists` - List user's playlists
- `POST /api/playlists` - Import playlist via URL or raw content
- `POST /api/playlists/upload` - Upload M3U file
- `PUT /api/playlists/{id}` - Rename playlist
- `POST /api/playlists/{id}/refresh` - Refresh playlist from original URL
- `DELETE /api/playlists/{id}` - Delete playlist

### Channels
- `GET /api/channels` - List channels with filters (`category`, `playlistId`, `page`, `size`)
- `GET /api/channels/search` - Search channels (`query`, `category`, `playlistId`)
- `GET /api/channels/{id}` - Get channel details
- `GET /api/channels/categories` - List categories with channel counts

### Favorites
- `GET /api/favorites` - Get favorite channels
- `POST /api/favorites/{channelId}` - Add to favorites
- `DELETE /api/favorites/{channelId}` - Remove from favorites

### Watch History
- `GET /api/history` - Get recently played channels
- `POST /api/history/{channelId}` - Record channel play event
- `DELETE /api/history` - Clear watch history
