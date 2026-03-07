# Dokumentasi Stack Teknologi - Storify

## 📱 Platform
- **Web Application** - Progressive Web App (PWA)
- **Mobile Application** - Android (melalui Capacitor)

---

## 🎨 Frontend Stack

### Core Framework & Bahasa
- **React** 18.3.1 - Library UI utama
- **TypeScript** 5.6.3 - Strongly-typed JavaScript
- **Vite** 7.3.0 - Build tool dan dev server yang cepat

### Routing & State Management
- **Wouter** 3.3.5 - Minimalist router untuk React
- **TanStack React Query** 5.60.5 - Server state management dan data fetching
- **React Context API** - Global state (Audio, Theme)

### UI Components & Styling
- **Tailwind CSS** 3.4.17 - Utility-first CSS framework
- **Radix UI** - Headless UI components:
  - Dialog, Dropdown, Popover, Toast
  - Accordion, Tabs, Navigation Menu
  - Form controls (Select, Checkbox, Switch, Slider)
  - Avatar, Progress, Scroll Area
- **shadcn/ui Pattern** - Customizable component patterns
- **Framer Motion** 11.18.2 - Animation library
- **Lucide React** - Icon library
- **React Icons** - Additional icon set

### Form Handling & Validation
- **React Hook Form** 7.55.0 - Form state management
- **Zod** 3.24.2 - Schema validation
- **@hookform/resolvers** - Form validation resolvers

### Specialized Libraries
- **PDF.js** (pdfjs-dist 3.11.174) - PDF rendering
- **@react-pdf-viewer** 3.12.0 - PDF viewer components
- **Recharts** 2.15.2 - Charts dan visualisasi data
- **Date-fns** 3.6.0 - Date manipulation
- **QRCode.react** 4.2.0 - QR code generation untuk QRIS
- **CMDK** - Command menu interface
- **Vaul** - Drawer/bottom sheet component
- **Embla Carousel React** - Carousel/slider

### Theme & Styling
- **next-themes** 0.4.6 - Dark/light mode support
- **class-variance-authority** - Variants management
- **tailwind-merge** - Tailwind class merging
- **tailwindcss-animate** - Animation utilities

---

## 🔧 Backend Stack

### Runtime & Framework
- **Node.js** - JavaScript runtime
- **Express** 5.0.1 - Web framework
- **TypeScript** 5.6.3 - Type safety

### Database & ORM
- **PostgreSQL** - Relational database
- **Drizzle ORM** 0.39.3 - Type-safe ORM
- **Drizzle-Zod** 0.7.0 - Schema validation dari Drizzle
- **pg** 8.16.3 - PostgreSQL client

### Authentication & Session
- **Passport.js** 0.7.0 - Authentication middleware
- **passport-local** 1.0.0 - Local strategy authentication
- **express-session** 1.19.0 - Session management
- **connect-pg-simple** 10.0.0 - PostgreSQL session store
- **memorystore** 1.6.7 - Memory-based session store (development)
- **OpenID Client** 6.8.1 - OAuth/OpenID Connect support

### API & Middleware
- **CORS** 2.8.6 - Cross-Origin Resource Sharing
- **WebSocket (ws)** 8.18.0 - Real-time communication

### Cloud Storage & External Services
- **Tencent Cloud COS SDK** 2.15.4 - Object storage (audio, PDF files)
- **DOKU Payment Gateway** - Payment processing
- **QRIS** - Quick Response Code Indonesian Standard untuk pembayaran

### Utilities
- **memoizee** 0.4.17 - Function memoization untuk caching
- **xlsx** 0.18.5 - Excel file processing (import buku)
- **zod-validation-error** 3.4.0 - Better validation error messages

---

## 📱 Mobile (Capacitor)

### Capacitor Core
- **@capacitor/cli** 7.4.5 - Capacitor CLI
- **@capacitor/core** 8.0.2 - Capacitor core library
- **@capacitor/android** 8.0.2 - Android platform

### Native Features
- **@capacitor/app** 8.0.0 - App lifecycle, deep linking
- **@capacitor/status-bar** 8.0.0 - Status bar styling
- **@capacitor/splash-screen** 8.0.0 - Splash screen management
- **@capacitor/haptics** 8.0.0 - Haptic feedback

### Configuration
- Android Scheme: HTTPS
- Mixed Content: Enabled
- Web Debugging: Disabled (production)
- App ID: `asia.storify.app`

---

## 🛠️ Development Tools

### Build & Bundling
- **Vite** 7.3.0 - Frontend build tool
- **esbuild** 0.25.0 - JavaScript bundler (fast)
- **tsx** 4.20.5 - TypeScript execution untuk scripts

### Code Quality
- **TypeScript** 5.6.3 - Type checking
- ESLint rules dari Vite plugin

### Database Tools
- **drizzle-kit** 0.31.8 - Database migrations dan schema management

### Environment & Scripts
- **dotenv-cli** 11.0.0 - Environment variables management
- **cross-env** 10.1.0 - Cross-platform environment variables

### Asset Processing
- **sharp** 0.34.5 - Image processing (icon generation)

---

## 📦 Struktur Proyek

```
Storify-Insights/
├── client/              # Frontend React application
│   ├── src/
│   │   ├── components/ # Reusable React components
│   │   ├── pages/      # Page components (routes)
│   │   ├── context/    # React Context providers
│   │   ├── hooks/      # Custom React hooks
│   │   ├── lib/        # Utilities dan helpers
│   │   └── App.tsx     # Root component
│   └── index.html      # HTML template
│
├── server/             # Backend Express application
│   ├── auth/          # Authentication logic
│   ├── routes.ts      # API routes definition
│   ├── db.ts          # Database connection
│   ├── cos.ts         # Cloud Object Storage integration
│   ├── doku.ts        # DOKU payment integration
│   └── index.ts       # Server entry point
│
├── shared/            # Shared code (frontend & backend)
│   ├── schema.ts      # Database schema (Drizzle)
│   ├── routes.ts      # Shared routes definition
│   └── models/        # Shared data models
│
├── db/                # Database schemas
├── migrations/        # Database migrations
├── script/            # Utility scripts
│   ├── build.ts
│   ├── upload-audio-to-cos.ts
│   ├── upload-pdf-to-cos.ts
│   └── import-books.ts
│
├── android/           # Android native project (Capacitor)
└── deploy/            # Deployment configurations
    ├── nginx/
    └── systemd/
```

---

## 🚀 Scripts & Commands

### Development
```bash
npm run dev              # Start development server
npm run dev:unix        # Start dev (Unix systems)
npm run check           # Type checking
```

### Building
```bash
npm run build           # Build full-stack application
npm run build:web       # Build frontend only
npm run cap:build       # Build dan sync ke Android
npm run cap:sync        # Sync web assets ke Android
npm run cap:open        # Open Android Studio
```

### Production
```bash
npm run start           # Start production server
npm run start:unix      # Start production (Unix)
```

### Database
```bash
npm run db:push         # Push schema changes ke database
```

### Utilities
```bash
npm run upload:pdf      # Upload PDF files ke COS
npm run update:pdf      # Update PDF URLs in database
```

---

## 🔐 Environment Variables

File `.env` diperlukan dengan konfigurasi:

- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key
- Tencent COS credentials (SecretId, SecretKey, Bucket, Region)
- DOKU API credentials
- OAuth/OpenID credentials (jika digunakan)

---

## 🌐 Deployment

### Web Application
- **Server**: Express.js di production mode
- **Process Manager**: systemd (lihat `deploy/systemd/`)
- **Reverse Proxy**: Nginx (lihat `deploy/nginx/`)
- **Domain**: storify.asia

### Android Application
- Build melalui Capacitor
- Output: AAB file untuk Google Play Store
- Location: `release/storify-v1.0.aab`

---

## 📚 Fitur Utama

### Audio Playback
- Streaming audio dari Tencent COS
- Global audio player
- Audio controls dan progress tracking

### PDF Reading
- Embedded PDF viewer
- PDF storage di cloud
- Pagination dan zoom controls

### Payment Integration
- DOKU payment gateway
- QRIS payment support
- Subscription management

### User Management
- Local authentication (email/password)
- Session-based auth
- Profile management

### Data Management
- Book library management
- Favorites system
- User activity tracking
- Listening statistics

---

## 🔄 Data Flow

```
Client (React) 
    ↕ (HTTP/WebSocket)
Server (Express)
    ↕ (Drizzle ORM)
Database (PostgreSQL)

Client ←→ Tencent COS (Audio/PDF files)
Server ←→ DOKU API (Payment processing)
```

---

## 📱 Supported Platforms

- **Web Browsers**: Chrome, Firefox, Safari, Edge (modern versions)
- **Mobile Web**: iOS Safari, Chrome Mobile
- **Native Android**: Android 7.0+ (API level 24+)

---

## 🎯 Design Patterns & Best Practices

### Frontend
- Component composition dengan Radix UI
- Custom hooks untuk reusable logic
- Context API untuk global state
- React Query untuk server state
- Form validation dengan Zod schemas

### Backend
- RESTful API design
- Middleware pattern (Express)
- Repository pattern (database layer)
- Session-based authentication
- Type-safe database queries (Drizzle)

### Code Organization
- Monorepo structure
- Shared types antara frontend-backend
- Path aliases (`@/`, `@shared/`, `@assets/`)
- TypeScript strict mode

---

## 📖 Dokumentasi Terkait

- [LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md) - Setup development environment
- [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment guide
- [PDF_FEATURE.md](PDF_FEATURE.md) - PDF feature documentation
- [PLAYSTORE_DEPLOYMENT.md](PLAYSTORE_DEPLOYMENT.md) - Android deployment
- [COS_CORS_CONFIG.md](COS_CORS_CONFIG.md) - Cloud storage CORS setup

---

**Version**: 1.0.0  
**Last Updated**: March 2026  
**Aplikasi**: Storify - Platform buku audio digital
