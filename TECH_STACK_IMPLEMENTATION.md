# � Google Login Implementation Guide

Panduan lengkap implementasi Google OAuth Login menggunakan tech stack: **React + TypeScript + Express + PostgreSQL + Drizzle ORM**.

---

## 📋 Daftar Isi

1. [Overview & Arsitektur](#overview--arsitektur)
2. [Prerequisites & Setup Google Cloud Console](#prerequisites--setup-google-cloud-console)
3. [Backend Implementation (Express + google-auth-library)](#backend-implementation-express--google-auth-library)
4. [Frontend Implementation (React + @react-oauth/google)](#frontend-implementation-react--react-oauthgoogle)
5. [Database Schema Setup](#database-schema-setup)
6. [Session vs JWT Authentication](#session-vs-jwt-authentication)
7. [Integration dengan Sistem Auth Existing](#integration-dengan-sistem-auth-existing)
8. [Testing & Debugging](#testing--debugging)
9. [Security Best Practices](#security-best-practices)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview & Arsitektur

### Google OAuth Flow Diagram
```
┌──────────────┐     1. Click "Login with Google"     ┌──────────────────┐
│   User       │ ─────────────────────────────────────>│   Frontend       │
│   Browser    │                                       │   (React)        │
└──────────────┘                                       └────────┬─────────┘
                                                                │
                                                                │ 2. Open Google
                                                                │    OAuth Popup
                                                                ▼
                                                       ┌──────────────────┐
                                                       │  Google OAuth    │
                                                       │  (accounts.      │
                                                       │   google.com)    │
                                                       └────────┬─────────┘
                                                                │
                                                                │ 3. User logs in
                                                                │    & authorizes
                                                                │ 4. Returns ID
                                                                │    Token (JWT)
                                                                ▼
                                                       ┌──────────────────┐
                                                       │   Frontend       │
                                                       │   onSuccess()    │
                                                       │   receives       │
                                                       │   credential     │
                                                       └────────┬─────────┘
                                                                │
                                                                │ 5. POST to
                                                                │    /api/auth/google
                                                                │    {credential:"..."}
                                                                ▼
┌──────────────┐                                      ┌──────────────────┐
│  PostgreSQL  │ <─── 7. Find/Create User ────────────│   Backend        │
│  Database    │                                      │   (Express)      │
│              │ ───> 8. Return User ─────────────────>│                  │
└──────────────┘                                      └────────┬─────────┘
                                                                │
                                                                │ 6. Verify ID Token
                                                                │    with Google API
                                                                │
                                                       ┌────────▼─────────┐
                                                       │  google-auth-    │
                                                       │  library         │
                                                       │  OAuth2Client    │
                                                       └──────────────────┘
                                                                │
                                                                │ 9. Generate
                                                                │    Session/JWT
                                                                ▼
┌──────────────┐                                      ┌──────────────────┐
│   User       │ <──── 10. Return token + user ───────│   Backend        │
│   Browser    │                                      │   Response       │
│              │ ───> 11. Store in localStorage ─────>│                  │
│              │ ───> 12. Redirect to Dashboard       │                  │
└──────────────┘                                      └──────────────────┘
```

### Tech Stack untuk Google Login

**Frontend:**
- `@react-oauth/google` ^0.13.4 - Google OAuth wrapper untuk React
- `@tanstack/react-query` - Data fetching & caching
- React 18 + TypeScript

**Backend:**
- `google-auth-library` ^10.5.0 - Verify Google ID Token
- Express.js - HTTP server
- `drizzle-orm` - Database ORM
- `pg` - PostgreSQL client

**Database:**
- PostgreSQL dengan tabel `sit_users`
- Kolom `google_id` untuk linking Google account

### Authentication Strategies

Project ini mendukung **2 strategi autentikasi**:

1. **Session-based** (Passport.js + express-session)
   - Cookie-based authentication
   - Server-side session storage di PostgreSQL
   - Digunakan untuk traditional routes

2. **JWT-based** (jsonwebtoken)
   - Token-based authentication
   - Stateless authentication
   - Digunakan untuk API routes (sudah diimplementasi di `auth.google.ts`)

---

## ⚙️ Prerequisites & Setup Google Cloud Console

### 1️⃣ System Requirements

**Required Software:**
```bash
# Node.js 18+ sudah terinstall
node --version  # Should be >= 18.0.0

# PostgreSQL dengan database sudah setup
psql --version
```

**Required npm packages** (sudah ada di package.json):
```json
{
  "dependencies": {
    "@react-oauth/google": "^0.13.4",
    "google-auth-library": "^10.5.0",
    "jsonwebtoken": "^9.0.3"
  }
}
```

### 2️⃣ Google Cloud Console Setup

#### Step 1: Buat/Pilih Project

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Nama project: **KPN EUDR Platform** (atau sesuai keinginan)
4. Click "Create"

#### Step 2: Enable Google+ API / Google Identity Services

1. Di sidebar, pilih **"APIs & Services"** → **"Library"**
2. Search: **"Google+ API"** atau **"Google Identity Services"**
3. Click "Enable"

#### Step 3: Configure OAuth Consent Screen

1. Pilih **"APIs & Services"** → **"OAuth consent screen"**
2. User Type:
   - **External** - untuk aplikasi public (semua user bisa login)
   - **Internal** - hanya untuk Google Workspace organization
3. Click **"Create"**

4. **Fill OAuth Consent Screen:**
   ```
   App name: KPN EUDR Platform
   User support email: your-email@kpnplatform.com
   App logo: [Optional - upload logo 120x120px]
   Application home page: https://yourdomain.com
   Developer contact: your-email@kpnplatform.com
   ```

5. **Scopes**: Click "Add or Remove Scopes"
   - Default scopes yang diperlukan:
     - `openid`
     - `email`
     - `profile`
   - Click "Update" → "Save and Continue"

6. **Test users** (jika External dalam Development mode):
   - Add email addresses untuk testing
   - Example: `developer@example.com`

7. Click **"Save and Continue"**

#### Step 4: Create OAuth 2.0 Credentials

1. Pilih **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. Application type: **Web application**
4. Name: `KPN EUDR Web Client`

5. **Authorized JavaScript origins** (tambahkan semua):
   ```
   http://localhost:5000
   http://localhost:5173
   https://yourdomain.com
   https://www.yourdomain.com
   ```

6. **Authorized redirect URIs** (opsional untuk web app, tapi tambahkan):
   ```
   http://localhost:5000
   https://yourdomain.com
   ```

7. Click **"Create"**

8. **💾 SIMPAN CREDENTIALS** yang muncul:
   ```
   Client ID: 123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
   Client Secret: GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx
   ```

⚠️ **PENTING**: 
- **Client ID** akan digunakan di frontend dan backend
- **Client Secret** sebaiknya tidak digunakan untuk web apps (hanya untuk server-to-server)
- Simpan credentials di tempat aman!

### 3️⃣ Environment Variables Setup

**File: `.env`** (di root project):
```env
# ===== GOOGLE OAUTH CREDENTIALS =====
# Client ID (digunakan di frontend dan backend)
VITE_GOOGLE_CLIENT_ID="123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com"

# Client Secret (optional, tidak digunakan untuk web apps)
GOOGLE_CLIENT_SECRET="GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx"

# ===== JWT SECRET (untuk generate token setelah Google login) =====
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters-long"

# ===== DATABASE (harus sudah ada) =====
DATABASE_URL="postgresql://username:password@localhost:5432/eudr_db"

# ===== SESSION SECRET (jika pakai session-based auth) =====
SESSION_SECRET="your-session-secret-key-32-chars-min"
```

⚠️ **IMPORTANT NOTES**:
- **`VITE_GOOGLE_CLIENT_ID`** harus ada prefix `VITE_` karena digunakan di frontend Vite
- Jangan commit `.env` ke Git (pastikan ada di `.gitignore`)
- Untuk production, gunakan secret manager (GCP Secret Manager, AWS Secrets, Replit Secrets, dll)
- Generate JWT_SECRET dengan: `openssl rand -base64 32`

---

## � Backend Implementation (Express + google-auth-library)

### 1️⃣ Install Dependencies (jika belum)

```bash
npm install google-auth-library jsonwebtoken
npm install --save-dev @types/jsonwebtoken
```

### 2️⃣ Backend Structure

```
server/
├── auth.google.ts       # ← Google OAuth handler (SUDAH ADA)
├── auth.ts              # ← Passport local auth (existing)
├── auth-middleware.ts   # ← Auth middleware (existing)
├── db.ts                # ← Database connection
├── index.ts             # ← Main server file
└── schema/
    └── index.ts         # ← Database schema (sit_users table)
```

### 3️⃣ Google Auth Implementation

**File: `server/auth.google.ts`** (sudah ada, ini adalah implementasinya):

```typescript
import { Express } from "express";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { db } from "./db";
import { sit_users } from "./schema";
import { eq } from "drizzle-orm";

// Initialize Google OAuth2 Client
const client = new OAuth2Client(process.env.VITE_GOOGLE_CLIENT_ID);

export function setupGoogleAuth(app: Express) {
    // ===== POST /api/auth/google =====
    // Endpoint untuk verify Google ID Token dan login/register user
    app.post("/api/auth/google", async (req, res) => {
        try {
            const { credential } = req.body;
            
            // Validate request
            if (!credential) {
                return res.status(400).json({ 
                    message: "Missing Google credential" 
                });
            }

            // ===== STEP 1: Verify Google ID Token =====
            // Ini penting untuk security - verify bahwa token benar-benar dari Google
            console.log("🔍 Verifying Google ID Token...");
            const ticket = await client.verifyIdToken({
                idToken: credential,
                audience: process.env.VITE_GOOGLE_CLIENT_ID,
            });

            const payload = ticket.getPayload();
            if (!payload) {
                return res.status(401).json({ 
                    message: "Invalid Google token" 
                });
            }

            // Extract user information dari Google
            const {
                email,
                name,
                picture,
                sub: googleId,  // Google User ID (unique & permanent)
            } = payload;

            console.log(`✅ Google user verified: ${email} (${googleId})`);

            // ===== STEP 2: Find user by google_id =====
            let [user] = await db
                .select()
                .from(sit_users)
                .where(eq(sit_users.google_id, googleId))
                .limit(1);

            // ===== STEP 3: If not found, try matching by email =====
            if (!user && email) {
                console.log("👤 User not found by google_id, checking email...");
                [user] = await db
                    .select()
                    .from(sit_users)
                    .where(eq(sit_users.email, email))
                    .limit(1);

                // Link Google account to existing user
                if (user) {
                    console.log("🔗 Linking Google account to existing user");
                    await db
                        .update(sit_users)
                        .set({
                            google_id: googleId,
                            avatar_url: picture,
                        })
                        .where(eq(sit_users.id, user.id));
                    
                    // Refresh user data
                    [user] = await db
                        .select()
                        .from(sit_users)
                        .where(eq(sit_users.id, user.id))
                        .limit(1);
                }
            }

            // ===== STEP 4: If still not found → create new user =====
            if (!user) {
                console.log("➕ Creating new user from Google account");
                const [created] = await db
                    .insert(sit_users)
                    .values({
                        username: email,              // Use email as username
                        email,
                        full_name: name,
                        google_id: googleId,
                        avatar_url: picture,
                        // Note: no password since this is Google login
                    })
                    .returning();

                user = created;
            }

            // ===== STEP 5: Generate JWT token (sama seperti login biasa) =====
            const token = jwt.sign(
                {
                    id: user.id,
                    username: user.username,
                },
                process.env.JWT_SECRET!,
                { expiresIn: "1d" }  // Token berlaku 1 hari
            );

            console.log(`✅ Login successful: User ID ${user.id}`);

            // ===== STEP 6: Return response =====
            res.json({
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    full_name: user.full_name,
                    email: user.email,
                    avatar_url: user.avatar_url,
                },
            });

        } catch (err: any) {
            console.error("❌ Google auth error:", err);
            
            // Handle specific errors
            if (err.message?.includes("Token used too late")) {
                return res.status(401).json({ 
                    message: "Google token expired. Please try again." 
                });
            }
            
            res.status(401).json({ 
                message: "Google authentication failed",
                error: process.env.NODE_ENV === "development" ? err.message : undefined
            });
        }
    });
}
```

### 4️⃣ Register Google Auth di Server

**File: `server/index.ts`** (tambahkan):

```typescript
import express from "express";
import { setupAuth } from "./auth";              // Existing local auth
import { setupGoogleAuth } from "./auth.google"; // ← NEW: Google OAuth
// ... other imports

const app = express();

// ... middleware setup

// ===== AUTHENTICATION SETUP =====
setupAuth(app);         // Local authentication (username/password)
setupGoogleAuth(app);   // ← Google OAuth authentication

// ... other code

server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🔐 Authentication: Local + Google OAuth`);
});
```

### 5️⃣ Alternatif: Session-based Auth (instead of JWT)

Jika Anda ingin menggunakan session-based auth (dengan Passport.js):

**File: `server/auth.google-session.ts`** (alternatif):

```typescript
import { Express } from "express";
import { OAuth2Client } from "google-auth-library";
import { db } from "./db";
import { sit_users } from "./schema";
import { eq } from "drizzle-orm";

const client = new OAuth2Client(process.env.VITE_GOOGLE_CLIENT_ID);

export function setupGoogleAuth(app: Express) {
    app.post("/api/auth/google", async (req, res) => {
        try {
            const { credential } = req.body;
            if (!credential) {
                return res.status(400).json({ message: "Missing Google credential" });
            }

            // Verify Google token
            const ticket = await client.verifyIdToken({
                idToken: credential,
                audience: process.env.VITE_GOOGLE_CLIENT_ID,
            });

            const payload = ticket.getPayload();
            if (!payload) return res.sendStatus(401);

            const { email, name, picture, sub: googleId } = payload;

            // Find or create user (same as before)
            let [user] = await db
                .select()
                .from(sit_users)
                .where(eq(sit_users.google_id, googleId))
                .limit(1);

            if (!user && email) {
                [user] = await db
                    .select()
                    .from(sit_users)
                    .where(eq(sit_users.email, email))
                    .limit(1);

                if (user) {
                    await db
                        .update(sit_users)
                        .set({ google_id: googleId, avatar_url: picture })
                        .where(eq(sit_users.id, user.id));
                }
            }

            if (!user) {
                const [created] = await db
                    .insert(sit_users)
                    .values({
                        username: email,
                        email,
                        full_name: name,
                        google_id: googleId,
                        avatar_url: picture,
                    })
                    .returning();
                user = created;
            }

            // ===== SESSION-BASED LOGIN =====
            // Login user menggunakan req.login() dari Passport
            req.login(user, (err) => {
                if (err) {
                    return res.status(500).json({ message: "Login failed" });
                }

                res.json({
                    message: "Login successful",
                    user: {
                        id: user.id,
                        username: user.username,
                        full_name: user.full_name,
                        email: user.email,
                        avatar_url: user.avatar_url,
                    },
                });
            });

        } catch (err) {
            console.error("Google auth error:", err);
            res.status(401).json({ message: "Google authentication failed" });
        }
    });
}
```

**Pilih salah satu**: JWT (stateless) atau Session (stateful) berdasarkan kebutuhan aplikasi Anda.

---

## ⚛️ Frontend Implementation (React + @react-oauth/google)

### 1️⃣ Install Dependencies (jika belum)

```bash
npm install @react-oauth/google
```

### 2️⃣ Frontend Structure

```
client/src/
├── main.tsx                    # ← Wrap dengan GoogleOAuthProvider
├── App.tsx                     # ← Main app component
├── pages/
│   ├── auth-page.tsx          # ← Login page dengan Google button
│   └── dashboard-page.tsx     # ← Protected page
├── hooks/
│   └── use-auth.tsx           # ← Auth context & hooks
└── lib/
    └── api.ts                 # ← API client functions
```

### 3️⃣ Setup GoogleOAuthProvider

**File: `client/src/main.tsx`**:

```typescript
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google"; // ← Import
import App from "./App";
import "./index.css";

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      {/* ===== WRAP dengan GoogleOAuthProvider ===== */}
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <App />
      </GoogleOAuthProvider>
    </QueryClientProvider>
  </StrictMode>
);
```

⚠️ **IMPORTANT**: `import.meta.env.VITE_GOOGLE_CLIENT_ID` harus sudah di-set di file `.env`

### 4️⃣ Login Page dengan Google Button

**File: `client/src/pages/auth-page.tsx`** (atau sesuai nama file existing):

```typescript
import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // ===== GOOGLE LOGIN SUCCESS HANDLER =====
  const handleGoogleSuccess = async (credentialResponse: any) => {
    setIsLoading(true);
    
    try {
      // Send credential to backend
      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          credential: credentialResponse.credential,
        }),
        credentials: "include", // Important for session cookies
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Google login failed");
      }

      const data = await response.json();

      // ===== STORE TOKEN & USER (JWT-based) =====
      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Session-based: tidak perlu localStorage, session sudah di-set

      // Show success message
      toast({
        title: "Login Successful",
        description: `Welcome back, ${data.user.full_name || data.user.username}!`,
      });

      // Redirect to dashboard
      setTimeout(() => {
        setLocation("/dashboard");
      }, 500);

    } catch (error: any) {
      console.error("Google login error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "Failed to authenticate with Google",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ===== GOOGLE LOGIN ERROR HANDLER =====
  const handleGoogleError = () => {
    console.error("Google login failed");
    toast({
      title: "Login Failed",
      description: "Failed to authenticate with Google. Please try again.",
      variant: "destructive",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Welcome to KPN EUDR Platform
          </CardTitle>
          <CardDescription className="text-center">
            Sign in to access the platform
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* ===== GOOGLE LOGIN BUTTON ===== */}
          <div className="flex justify-center">
            {isLoading ? (
              <Button disabled className="w-full">
                <span className="animate-spin mr-2">⏳</span>
                Signing in...
              </Button>
            ) : (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap={false}  // Set true untuk One Tap auto-login
                theme="outline"
                size="large"
                text="signin_with"
                shape="rectangular"
              />
            )}
          </div>

          {/* Optional: Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          {/* Optional: Local Login Form */}
          <form onSubmit={(e) => {
            e.preventDefault();
            // Handle local login
          }}>
            {/* Username/Email input */}
            {/* Password input */}
            {/* Login button */}
          </form>

          {/* Info Alert */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md text-sm">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <p className="text-blue-700 dark:text-blue-300">
              Sign in with your Google account to access EUDR compliance tools, 
              plot management, and deforestation monitoring.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 5️⃣ GoogleLogin Component Props Reference

```typescript
<GoogleLogin
  onSuccess={(response) => {
    // response.credential = JWT ID Token dari Google
    console.log(response.credential);
  }}
  onError={() => {
    console.log('Login Failed');
  }}
  
  // ===== OPTIONAL PROPS =====
  useOneTap={true}           // Enable One Tap auto-sign-in
  auto_select={false}         // Auto-select account jika hanya 1
  
  // UI Customization
  theme="outline"             // "outline" | "filled_blue" | "filled_black"
  size="large"                // "large" | "medium" | "small"
  text="signin_with"          // "signin_with" | "signup_with" | "continue_with" | "signin"
  shape="rectangular"         // "rectangular" | "pill" | "circle" | "square"
  logo_alignment="left"       // "left" | "center"
  width="300"                 // Custom width in pixels
  
  // Context
  context="signin"            // "signin" | "signup" | "use"
/>
```

### 6️⃣ Protect Routes dengan Auth Check

**File: `client/src/components/protected-route.tsx`**:

```typescript
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [, setLocation] = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check for JWT token
    const token = localStorage.getItem("auth_token");
    
    if (!token) {
      // No token, redirect to login
      setLocation("/auth");
      return;
    }

    // Optional: Verify token dengan backend
    fetch("/api/auth/user", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Invalid token");
        setIsChecking(false);
      })
      .catch(() => {
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");
        setLocation("/auth");
      });
  }, [setLocation]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}
```

**Usage:**
```typescript
import { ProtectedRoute } from "@/components/protected-route";

function App() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      
      <Route path="/dashboard">
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      </Route>
      
      <Route path="/plots">
        <ProtectedRoute>
          <PlotsPage />
        </ProtectedRoute>
      </Route>
    </Switch>
  );
}
```

### 7️⃣ Use Auth Hook (Optional tapi Recommended)

**File: `client/src/hooks/use-auth.tsx`**:

```typescript
import { createContext, useContext, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("auth_token")
  );

  // Fetch current user
  const { data: user, isLoading } = useQuery({
    queryKey: ["auth", "user"],
    queryFn: async () => {
      if (!token) return null;
      
      const res = await fetch("/api/auth/user", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Not authenticated");
      return res.json();
    },
    enabled: !!token,
    retry: false,
  });

  const logout = async () => {
    // Clear local storage
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    setToken(null);
    
    // Clear React Query cache
    queryClient.clear();
    
    // Optional: Call logout endpoint
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout error:", err);
    }
    
    // Redirect to login
    window.location.href = "/auth";
  };

  const value: AuthContextType = {
    user: user || null,
    isLoading,
    isAuthenticated: !!user,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
```

**Usage dalam component:**
```typescript
import { useAuth } from "@/hooks/use-auth";

function DashboardPage() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <div>Not authenticated</div>;
  }

  return (
    <div>
      <h1>Welcome, {user?.full_name}!</h1>
      {user?.avatar_url && (
        <img src={user.avatar_url} alt="Avatar" className="rounded-full w-10 h-10" />
      )}
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

---

## 🗄️ Database Schema Setup

### 1️⃣ Required Table Schema

**File: `shared/schema.ts`** atau `server/schema/index.ts`:

```typescript
import { pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";

export const sit_users = pgTable("sit_users", {
  id: serial("id").primaryKey(),
  
  // Basic fields
  username: varchar("username", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  full_name: text("full_name"),
  
  // Authentication fields
  password: text("password"),  // Hashed password (null for Google-only users)
  
  // ===== GOOGLE OAUTH FIELDS ===== (REQUIRED)
  google_id: varchar("google_id", { length: 255 }).unique(),  // Google sub ID
  avatar_url: text("avatar_url"),  // Google profile picture
  
  // Timestamps
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow(),
});
```

### 2️⃣ Migration untuk Add google_id Column (jika table sudah ada)

**Option A: Using Drizzle Kit**

```bash
# Generate migration
npx drizzle-kit generate

# Apply migration
npx drizzle-kit push
```

**Option B: Manual SQL**

```sql
-- Add google_id column
ALTER TABLE sit_users 
ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;

-- Add avatar_url column
ALTER TABLE sit_users 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create index untuk performa
CREATE INDEX IF NOT EXISTS idx_sit_users_google_id 
ON sit_users(google_id);
```

### 3️⃣ Verify Table Structure

```sql
-- Check table structure
\d sit_users

-- Expected columns:
-- id, username, email, full_name, password, google_id, avatar_url, created_at, updated_at
```

---

## 🔄 Session vs JWT Authentication

Project ini mendukung 2 strategi authentication. Pilih salah satu yang sesuai kebutuhan:

### 📋 Comparison Table

| Feature | Session-based (Passport.js) | JWT-based (jsonwebtoken) |
|---------|----------------------------|--------------------------|
| **Storage** | Server-side (PostgreSQL) | Client-side (localStorage) |
| **Stateless** | ❌ No (stateful) | ✅ Yes |
| **Scalability** | Medium (need sticky sessions) | High (no server state) |
| **Security** | High (httpOnly cookies) | Medium (XSS vulnerable) |
| **Auto-logout** | ✅ Yes (session expiry) | ⚠️ Manual (token expiry) |
| **Revocation** | ✅ Easy (delete session) | ❌ Hard (need blacklist) |
| **Best for** | Traditional web apps | APIs, Mobile apps, SPA |

### 🤖 Current Implementation

**Project ini menggunakan**: **JWT-based** di `server/auth.google.ts`

**Alasan**:
- Stateless (cocok untuk API)
- Lebih sederhana untuk SPA
- Sudah implemented dan working

### 🔄 Jika Ingin Pakai Session-based

1. Gunakan implementasi alternatif di bagian Backend (auth.google-session.ts)
2. Make sure `express-session` dan `connect-pg-simple` sudah installed
3. Setup session di `server/index.ts`:

```typescript
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";

const PgStore = connectPgSimple(session);

app.use(
  session({
    store: new PgStore({
      pool: pool,
      tableName: "session",
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());
```

4. Update frontend untuk tidak menggunakan localStorage:
```typescript
// Hapus localStorage.setItem()
// Session akan otomatis tersimpan di cookie
```

---

## 🔗 Integration dengan Sistem Auth Existing

### 1️⃣ Local Auth + Google OAuth (Hybrid)

Project sudah memiliki local authentication (Passport.js) di `server/auth.ts`. Google OAuth adalah **tambahan** sehingga user bisa login dengan 2 cara:

**Flow:**
1. User A: Register dengan email/password → Login dengan email/password
2. User B: Login dengan Google → Auto-create account
3. User A: Bisa link Google account ke existing account (by email matching)

**Implementation already in place:**
- ✅ `server/auth.ts` - Local authentication
- ✅ `server/auth.google.ts` - Google OAuth
- ✅ Email matching logic untuk link accounts

**Testing:**
```bash
# Test local login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'

# Test Google login (after getting credential from frontend)
curl -X POST http://localhost:5000/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{"credential":"eyJhbGc..."}'
```

### 2️⃣ User Linking Strategy

**Scenario A: User dengan Email Existing**
```
1. User mendaftar manual: email@example.com, password: xxx
2. User login dengan Google (same email)
3. Backend detects email match → links Google account
4. Result: User sekarang bisa login 2 cara (local atau Google)
```

**Scenario B: User Baru (Google-only)**
```
1. User belum pernah daftar
2. User login dengan Google
3. Backend creates new user dengan google_id
4. Result: User hanya bisa login via Google (no password)
```

**Database state:**
```sql
-- User A (can login both ways)
id | username          | email            | password | google_id
1  | email@example.com | email@example.com| hashed   | 123456789

-- User B (Google-only)
id | username             | email             | password | google_id
2  | newuser@gmail.com    | newuser@gmail.com | NULL     | 987654321
```

---

## 🧪 Testing & Debugging

### 1️⃣ Test Environment Setup

**Verify environment variables:**
```bash
# Check if VITE_GOOGLE_CLIENT_ID is set
echo $VITE_GOOGLE_CLIENT_ID

# Or in PowerShell
$env:VITE_GOOGLE_CLIENT_ID

# Should output: 123456789012-xxx.apps.googleusercontent.com
```

**Test backend separately:**
```bash
# Start server
npm run dev

# In another terminal, test health endpoint
curl http://localhost:5000/api/health
# Should return: {"status":"ok","timestamp":"..."}
```

### 2️⃣ Browser DevTools Debugging

**Console Logging:**

Frontend (in `auth-page.tsx`):
```typescript
const handleGoogleSuccess = async (credentialResponse: any) => {
  console.log("🔐 Google credential received:", credentialResponse);
  console.log("📝 Credential length:", credentialResponse.credential.length);
  
  // Send to backend
  const response = await fetch("/api/auth/google", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential: credentialResponse.credential }),
  });
  
  console.log("📡 Backend response status:", response.status);
  const data = await response.json();
  console.log("✅ Backend response data:", data);
};
```

Backend (in `auth.google.ts`):
```typescript
// Already has console.log statements:
console.log("🔍 Verifying Google ID Token...");
console.log(`✅ Google user verified: ${email} (${googleId})`);
console.log("👤 User not found by google_id, checking email...");
console.log("🔗 Linking Google account to existing user");
console.log("➕ Creating new user from Google account");
console.log(`✅ Login successful: User ID ${user.id}`);
```

**Network Tab:**
1. Open Chrome DevTools → Network tab
2. Filter: `Fetch/XHR`
3. Click "Login with Google"
4. Look for request to `/api/auth/google`
5. Check:
   - Request payload (should have `credential`)
   - Response (should have `token` and `user`)
   - Status code (should be 200)

**Application Tab:**
1. Chrome DevTools → Application tab
2. Check "Local Storage":
   - `auth_token` - Should contain JWT
   - `user` - Should contain user JSON
3. Check "Cookies" (if using session):
   - `connect.sid` - Should be present

### 3️⃣ Test with cURL

**Get Google credential manually** (for testing):
1. Frontend → Click Google Login
2. Copy credential from Console log
3. Test backend with cURL:

```bash
# Test Google login endpoint
curl -X POST http://localhost:5000/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{
    "credential": "eyJhbGciOiJSUzI1NiIsImtpZCI6IjA1M..."
  }' \
  -v

# Expected response:
# {
#   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
#   "user": {
#     "id": 1,
#     "username": "user@example.com",
#     "full_name": "John Doe",
#     "email": "user@example.com",
#     "avatar_url": "https://lh3.googleusercontent.com/..."
#   }
# }
```

### 4️⃣ Database Verification

```sql
-- Check if user was created
SELECT id, username, email, google_id, avatar_url, created_at
FROM sit_users
ORDER BY created_at DESC
LIMIT 5;

-- Check specific Google user
SELECT * FROM sit_users WHERE google_id IS NOT NULL;

-- Check users with both local and Google auth
SELECT * FROM sit_users 
WHERE password IS NOT NULL 
AND google_id IS NOT NULL;
```

### 5️⃣ Common Issues & Solutions

**Issue: "Google Client ID not found"**
```
Error: process.env.VITE_GOOGLE_CLIENT_ID is undefined
```
**Solution:**
- Check `.env` file has `VITE_GOOGLE_CLIENT_ID=...`
- Restart dev server after adding/changing .env
- Verify prefix `VITE_` is present

**Issue: "Token verification failed"**
```
Error: Token used too late
```
**Solution:**
- Clear browser cache and cookies
- Try logging in again with Google
- Check server time is correct (NTP sync)

**Issue: "Duplicate key value violates unique constraint"**
```
Error: duplicate key value violates unique constraint "sit_users_email_unique"
```
**Solution:**
- User already exists with same email
- Check if google_id matching is working
- Verify email matching logic in backend

**Issue: "CORS error"**
```
Access to fetch at '...' from origin '...' has been blocked by CORS
```
**Solution:**
- Add credentials: "include" in fetch options
- Check CORS setup in server (allow credentials)
- Verify Authorized JavaScript origins in Google Console

---

## 🔒 Security Best Practices

### 1️⃣ Environment Variables

**DO:**
- ✅ Use `.env` file (gitignored)
- ✅ Use secret managers in production (GCP Secret Manager, AWS Secrets)
- ✅ Rotate secrets periodically
- ✅ Use different values for dev/staging/prod

**DON'T:**
- ❌ Commit `.env` to Git
- ❌ Share credentials in Slack/email
- ❌ Use production credentials in development
- ❌ Log credentials in console

### 2️⃣ JWT Token Security

**DO:**
- ✅ Use strong secret (min 32 characters)
- ✅ Set reasonable expiry (1d - 7d)
- ✅ Store in httpOnly cookies (better) or localStorage
- ✅ Validate token on every request

**DON'T:**
- ❌ Use weak secrets ("secret", "password")
- ❌ Store sensitive data in JWT payload
- ❌ Make tokens never expire
- ❌ Expose JWT_SECRET to client

**Example secure JWT generation:**
```typescript
const token = jwt.sign(
  {
    id: user.id,
    username: user.username,
    // DON'T include: password, ssn, credit_card
  },
  process.env.JWT_SECRET!, // Strong random secret
  {
    expiresIn: "1d",
    algorithm: "HS256",
  }
);
```

### 3️⃣ Google OAuth Security

**DO:**
- ✅ Always verify ID token on backend
- ✅ Check `audience` matches your Client ID
- ✅ Use HTTPS in production
- ✅ Keep Google Client Secret confidential

**DON'T:**
- ❌ Trust credential without verification
- ❌ Skip audience validation
- ❌ Use HTTP in production
- ❌ Expose Client Secret to client

**Secure verification:**
```typescript
// GOOD ✅
const ticket = await client.verifyIdToken({
  idToken: credential,
  audience: process.env.VITE_GOOGLE_CLIENT_ID, // Verify audience
});

// BAD ❌
// Just decode without verification
const payload = jwt.decode(credential); // DON'T DO THIS!
```

### 4️⃣ Database Security

**DO:**
- ✅ Hash passwords with bcrypt (cost factor ≥ 10)
- ✅ Use parameterized queries (Drizzle ORM does this)
- ✅ Set `google_id` as UNIQUE constraint
- ✅ Use database user with minimal privileges

**DON'T:**
- ❌ Store plain text passwords
- ❌ Use string concatenation for SQL
- ❌ Use database admin user in app
- ❌ Log sensitive data

### 5️⃣ Frontend Security

**DO:**
- ✅ Sanitize user input
- ✅ Use HTTPS in production
- ✅ Implement CSRF protection
- ✅ Set proper Content-Security-Policy headers

**DON'T:**
- ❌ Trust user input blindly
- ❌ Use `dangerouslySetInnerHTML` without sanitization
- ❌ Store sensitive data in localStorage without encryption
- ❌ Expose API keys in client code

---

## 🚨 Troubleshooting

### 1️⃣ Google Login Button Not Showing

**Symptoms:**
- Google Login button tidak muncul
- Console error: "Cannot read property 'clientId'"

**Diagnosis:**
```bash
# Check environment variable
echo $VITE_GOOGLE_CLIENT_ID

# Should NOT be undefined or empty
```

**Solutions:**
1. Verify `.env` file has correct format:
   ```env
   VITE_GOOGLE_CLIENT_ID="123456789012-xxx.apps.googleusercontent.com"
   ```
2. Restart dev server: `Ctrl+C` then `npm run dev`
3. Clear browser cache
4. Check GoogleOAuthProvider is wrapping App:
   ```typescript
   <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
     <App />
   </GoogleOAuthProvider>
   ```

### 2️⃣ "Invalid Client ID" Error

**Symptoms:**
- Error: "Invalid OAuth client"
- Google popup closes immediately

**Solutions:**
1. **Check Authorized JavaScript origins** in Google Cloud Console:
   - Go to Credentials → Your OAuth Client
   - Add: `http://localhost:5000` and `http://localhost:5173`
   - Save changes
   - Wait 5-10 minutes for changes to propagate

2. **Verify Client ID format**:
   ```
   Correct: 123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com
   Wrong: 123456789012-xxx (incomplete)
   ```

3. **Check if API is enabled**:
   - Google Cloud Console → APIs & Services → Library
   - Search "Google+ API" or "Google Identity"
   - Should show "Enabled"

### 3️⃣ "Token Verification Failed" Error

**Symptoms:**
- Backend logs: "Token used too late"
- 401 Unauthorized response

**Solutions:**
1. **Time sync issue**:
   ```bash
   # Linux/Mac
   sudo ntpdate -s time.nist.gov
   
   # Windows
   net start w32time
   w32tm /resync
   ```

2. **Token expired**:
   - Google ID tokens expire after 1 hour
   - Try logging in again
   - Token is one-time use only

3. **Wrong audience**:
   ```typescript
   // Make sure backend uses same Client ID
   const ticket = await client.verifyIdToken({
     idToken: credential,
     audience: process.env.VITE_GOOGLE_CLIENT_ID, // ← Must match frontend
   });
   ```

### 4️⃣ User Created but Not Logged In

**Symptoms:**
- User appears in database
- But frontend shows "not authenticated"

**Diagnosis:**
```javascript
// Check localStorage
console.log(localStorage.getItem("auth_token"));
console.log(localStorage.getItem("user"));

// Should NOT be null
```

**Solutions:**
1. **Check frontend success handler**:
   ```typescript
   const data = await response.json();
   
   // Make sure these lines execute
   localStorage.setItem("auth_token", data.token); // ← Check this
   localStorage.setItem("user", JSON.stringify(data.user));
   ```

2. **Check backend response**:
   ```typescript
   // Backend must return token and user
   res.json({
     token: token,        // ← Check this exists
     user: { ... },       // ← Check this exists
   });
   ```

3. **Check JWT generation**:
   ```typescript
   // Verify JWT_SECRET is set
   console.log("JWT_SECRET exists:", !!process.env.JWT_SECRET);
   ```

### 5️⃣ "Database Connection Refused"

**Symptoms:**
- Error: "ECONNREFUSED ::1:5432"
- Backend won't start

**Solutions:**
1. **Check PostgreSQL is running**:
   ```bash
   # Linux/Mac
   sudo systemctl status postgresql
   sudo systemctl start postgresql
   
   # Windows
   # Check Services → PostgreSQL
   ```

2. **Verify DATABASE_URL**:
   ```env
   # Correct format:
   DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
   ```

3. **Test connection**:
   ```bash
   psql postgresql://username:password@localhost:5432/database_name
   ```

### 6️⃣ CORS Errors

**Symptoms:**
- Console error: "has been blocked by CORS policy"
- Network tab shows failed OPTIONS request

**Solutions:**
1. **Add credentials in fetch**:
   ```typescript
   fetch("/api/auth/google", {
     method: "POST",
     credentials: "include", // ← Important!
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({ credential }),
   });
   ```

2. **Check Vite proxy** (if using separate dev server):
   ```typescript
   // vite.config.ts
   export default defineConfig({
     server: {
       proxy: {
         "/api": {
           target: "http://localhost:5000",
           changeOrigin: true,
         },
       },
     },
   });
   ```

---

## 📚 Additional Resources

### Official Documentation
- [Google Identity - Web](https://developers.google.com/identity/gsi/web)
- [@react-oauth/google](https://www.npmjs.com/package/@react-oauth/google)
- [google-auth-library Node.js](https://github.com/googleapis/google-auth-library-nodejs)
- [JWT.io](https://jwt.io/) - Debug JWT tokens
- [Drizzle ORM](https://orm.drizzle.team/)

### Project Files
- `server/auth.google.ts` - Backend Google OAuth implementation
- `package.json` - Dependencies list
- `GOOGLE_LOGIN_SETUP.md` - Laravel-focused Google OAuth guide

### Helpful Tools
- [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground/) - Test OAuth flow
- [JWT Decoder](https://jwt.io/) - Decode and verify JWT tokens
- [Postman](https://www.postman.com/) - API testing
- Chrome DevTools - Network, Application tabs

---

## ✅ Implementation Checklist

Final checklist sebelum deploy:

**Google Cloud Console:**
- [ ] Project created
- [ ] Google+ API / Identity Services enabled
- [ ] OAuth Consent Screen configured
- [ ] OAuth Client ID created
- [ ] Authorized JavaScript origins added (prod + dev)
- [ ] Credentials saved securely

**Environment Variables:**
- [ ] `.env` file created
- [ ] `VITE_GOOGLE_CLIENT_ID` set (dengan prefix VITE_)
- [ ] `JWT_SECRET` set (min 32 chars)
- [ ] `DATABASE_URL` set dan tested
- [ ] Production secrets in secret manager

**Database:**
- [ ] PostgreSQL running
- [ ] `sit_users` table exists
- [ ] `google_id` column exists (VARCHAR, UNIQUE)
- [ ] `avatar_url` column exists (TEXT)
- [ ] Migration applied

**Backend:**
- [ ] `google-auth-library` installed
- [ ] `jsonwebtoken` installed
- [ ] `server/auth.google.ts` implemented
- [ ] Registered in `server/index.ts`
- [ ] `/api/auth/google` endpoint responding

**Frontend:**
- [ ] `@react-oauth/google` installed
- [ ] `GoogleOAuthProvider` wraps App
- [ ] `GoogleLogin` button in auth page
- [ ] Success handler saves token/user
- [ ] Error handler shows message
- [ ] Redirect to dashboard works

**Testing:**
- [ ] Can click "Login with Google"
- [ ] Google popup opens
- [ ] Can select Google account
- [ ] Backend receives credential
- [ ] Token verification succeeds
- [ ] User created/found in database
- [ ] JWT returned to frontend
- [ ] Token stored successfully
- [ ] Redirect to dashboard works
- [ ] Protected routes check auth

**Security:**
- [ ] `.env` in `.gitignore`
- [ ] JWT secret is strong (not "secret")
- [ ] Token expiry set appropriately
- [ ] ID token verified on backend
- [ ] HTTPS in production
- [ ] Credentials not logged

---

## 🎉 Conclusion

Congratulations! Anda sekarang memiliki implementasi Google OAuth Login yang lengkap untuk KPN EUDR Platform.

**Key Points:**
- ✅ **Backend**: Menggunakan `google-auth-library` untuk verify ID token
- ✅ **Frontend**: Menggunakan `@react-oauth/google` untuk UI
- ✅ **Database**: `google_id` column untuk link Google accounts
- ✅ **Security**: Proper token verification dan JWT generation
- ✅ **Hybrid**: Mendukung local login + Google OAuth

**Next Steps:**
1. Test thoroughly in development
2. Setup production environment variables
3. Enable HTTPS for production
4. Monitor login success/failure rates
5. Add analytics tracking (optional)

**Support:**
- Untuk pertanyaan atau issue, lihat Troubleshooting section
- Check console logs untuk debugging
- Verify environment variables
- Test dengan cURL untuk isolate frontend/backend issues

**Happy Coding! 🚀**

            // ===== SESSION-BASED LOGIN =====
            // Login user menggunakan req.login() dari Passport
            req.login(user, (err) => {
                if (err) {
                    return res.status(500).json({ message: "Login failed" });
                }

                res.json({
                    message: "Login successful",
                    user: {
                        id: user.id,
                        username: user.username,
                        full_name: user.full_name,
                        email: user.email,
                        avatar_url: user.avatar_url,
                    },
                });
            });

        } catch (err) {
            console.error("Google auth error:", err);
            res.status(401).json({ message: "Google authentication failed" });
        }
    });
}
```

**Pilih salah satu**: JWT (stateless) atau Session (stateful) berdasarkan kebutuhan aplikasi Anda.

### 1️⃣ Install PostgreSQL & PostGIS

**Ubuntu/Debian:**
```bash
# Install PostgreSQL dan PostGIS
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib postgis postgresql-14-postgis-3

# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**macOS (via Homebrew):**
```bash
# Install PostgreSQL
brew install postgresql@14 postgis

# Start service
brew services start postgresql@14
```

**Windows:**
- Download installer dari [postgresql.org](https://www.postgresql.org/download/windows/)
- Install dengan StackBuilder, centang PostGIS extension

### 2️⃣ Create Database

```bash
# Masuk ke PostgreSQL
sudo -u postgres psql

# Atau di Windows/macOS:
psql -U postgres
```

```sql
-- Create database
CREATE DATABASE eudr_db;

-- Create user
CREATE USER eudr_user WITH PASSWORD 'your_secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE eudr_db TO eudr_user;

-- Connect to database
\c eudr_db

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Verify PostGIS
SELECT PostGIS_version();
```

### 3️⃣ Database Schema Migration

**File: `drizzle.config.ts`**
```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./shared/schema.ts",
  out: "./migrations",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

**Run Migration:**
```bash
# Push schema to database (development)
npm run db:push

# Generate migration files (production)
npx drizzle-kit generate

# Apply migrations
npx drizzle-kit migrate
```

### 4️⃣ Database Structure Overview

**File: `shared/schema.ts`** (contoh struktur):
```typescript
import { pgTable, serial, text, timestamp, geometry } from "drizzle-orm/pg-core";

// Users table
export const sit_users = pgTable("sit_users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password"),
  google_id: text("google_id"),
  full_name: text("full_name"),
  avatar_url: text("avatar_url"),
  created_at: timestamp("created_at").defaultNow(),
});

// Plots table (agricultural plots)
export const sit_plots = pgTable("sit_plots", {
  id: serial("id").primaryKey(),
  plot_id: text("plot_id").notNull().unique(),
  geom: geometry("geom", { type: "polygon", srid: 4326 }),
  area_ha: numeric("area_ha"),
  farmer_name: text("farmer_name"),
  created_at: timestamp("created_at").defaultNow(),
});

// Compliance assessments
export const sit_compliance = pgTable("sit_compliance", {
  id: serial("id").primaryKey(),
  plot_id: integer("plot_id").references(() => sit_plots.id),
  assessment_date: timestamp("assessment_date").defaultNow(),
  deforestation_risk: text("deforestation_risk"), // LOW, MEDIUM, HIGH
  compliance_score: numeric("compliance_score"),
  status: text("status"), // COMPLIANT, NON_COMPLIANT, UNDER_REVIEW
});
```

---

## 🔌 Backend Implementation (Node.js + Express)

### 1️⃣ Server Entry Point

**File: `server/index.ts`**
```typescript
import express from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic } from "./vite";
import session from "express-session";
import passport from "passport";
import { db } from "./db";
import connectPgSimple from "connect-pg-simple";

const app = express();
const PORT = process.env.PORT || 5000;

// ===== MIDDLEWARE =====
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ===== SESSION SETUP =====
const PgStore = connectPgSimple(session);

app.use(
  session({
    store: new PgStore({
      pool: db.pool, // Drizzle database pool
      tableName: "session",
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    },
  })
);

// ===== PASSPORT AUTHENTICATION =====
app.use(passport.initialize());
app.use(passport.session());

// ===== ROUTES =====
const server = await registerRoutes(app);

// ===== VITE DEV SERVER atau STATIC FILES =====
if (process.env.NODE_ENV === "development") {
  await setupVite(app, server);
} else {
  serveStatic(app);
}

// ===== START SERVER =====
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Database connected: ${process.env.DATABASE_URL?.split("@")[1]}`);
  console.log(`🔐 Auth: Passport.js + Express Session`);
});
```

### 2️⃣ Database Connection

**File: `server/db.ts`**
```typescript
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../shared/schema";

const { Pool } = pg;

// Create PostgreSQL connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Initialize Drizzle ORM
export const db = drizzle(pool, { schema });

// Test connection
pool.on("connect", () => {
  console.log("✅ PostgreSQL connected");
});

pool.on("error", (err) => {
  console.error("❌ PostgreSQL error:", err);
});
```

### 3️⃣ API Routes Structure

**File: `server/routes.ts`**
```typescript
import { Express } from "express";
import { db } from "./db";
import { setupAuth } from "./auth";
import { setupGoogleAuth } from "./auth.google";
import { createServer } from "http";

export async function registerRoutes(app: Express) {
  // Setup authentication
  setupAuth(app);
  setupGoogleAuth(app);

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // User routes
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(req.user);
  });

  // Example: Get plots
  app.get("/api/plots", async (req, res) => {
    try {
      const plots = await db.select().from(sit_plots).limit(100);
      res.json(plots);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch plots" });
    }
  });

  // Create HTTP server
  const server = createServer(app);
  return server;
}
```

---

## ⚛️ Frontend Implementation (React + TypeScript)

### 1️⃣ Entry Point

**File: `client/src/main.tsx`**
```typescript
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App";
import "./index.css";

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
        <App />
      </GoogleOAuthProvider>
    </QueryClientProvider>
  </StrictMode>
);
```

### 2️⃣ App Component with Routing

**File: `client/src/App.tsx`**
```typescript
import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/hooks/use-auth";

// Pages
import HomePage from "@/pages/home-page";
import DashboardPage from "@/pages/dashboard-page";
import PlotsPage from "@/pages/plots-page";
import LoginPage from "@/pages/login-page";
import NotFoundPage from "@/pages/not-found-page";

export default function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="eudr-theme">
      <AuthProvider>
        <Switch>
          <Route path="/" component={HomePage} />
          <Route path="/login" component={LoginPage} />
          <Route path="/dashboard" component={DashboardPage} />
          <Route path="/plots" component={PlotsPage} />
          <Route path="/plots/:id" component={PlotDetailPage} />
          <Route component={NotFoundPage} />
        </Switch>
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}
```

### 3️⃣ TypeScript Configuration

**File: `tsconfig.json`**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,

    /* Path mapping */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./client/src/*"],
      "@db/*": ["./server/*"]
    }
  },
  "include": ["client", "server", "shared"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 4️⃣ Vite Configuration

**File: `vite.config.ts`**
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
      "@db": path.resolve(__dirname, "./server"),
    },
  },
  server: {
    port: 5000,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist/public",
    emptyOutDir: true,
  },
});
```

---

## 🎨 UI Components (Radix UI + Tailwind)

### 1️⃣ Tailwind Configuration

**File: `tailwind.config.ts`**
```typescript
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./client/**/*.{ts,tsx}",
    "./client/index.html",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
```

### 2️⃣ Global CSS Variables

**File: `client/src/index.css`**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --primary: 142 71% 45%; /* EUDR Green */
    --primary-foreground: 0 0% 100%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 142 71% 45%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --primary: 142 71% 45%;
    --primary-foreground: 0 0% 100%;
    /* ... dark mode colors ... */
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}
```

### 3️⃣ Example Shadcn/ui Component

**File: `client/src/components/ui/button.tsx`**
```typescript
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "underline-offset-4 hover:underline text-primary",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3 rounded-md",
        lg: "h-11 px-8 rounded-md",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

### 4️⃣ Using Components

**Example: `client/src/pages/plots-page.tsx`**
```typescript
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, MapPin } from "lucide-react";

export default function PlotsPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Agricultural Plots</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Plot
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="mr-2 h-5 w-5 text-primary" />
              Plot #001
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Area: 2.5 hectares
            </p>
            <Button variant="outline" className="mt-4">
              View Details
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

---

## 🔄 State Management (React Query)

### 1️⃣ Create API Client

**File: `client/src/lib/api.ts`**
```typescript
const API_URL = import.meta.env.VITE_API_URL || "";

// Generic fetch wrapper
async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    credentials: "include", // Important for session cookies
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || "API request failed");
  }

  return response.json();
}

// API functions
export const api = {
  // User
  getUser: () => fetchAPI<User>("/api/user"),
  
  // Plots
  getPlots: () => fetchAPI<Plot[]>("/api/plots"),
  getPlot: (id: string) => fetchAPI<Plot>(`/api/plots/${id}`),
  createPlot: (data: CreatePlotInput) =>
    fetchAPI<Plot>("/api/plots", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  
  // Compliance
  getCompliance: (plotId: string) =>
    fetchAPI<Compliance>(`/api/compliance/${plotId}`),
};
```

### 2️⃣ Create Custom Hooks

**File: `client/src/hooks/use-plots.ts`**
```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

// Fetch all plots
export function usePlots() {
  return useQuery({
    queryKey: ["plots"],
    queryFn: api.getPlots,
  });
}

// Fetch single plot
export function usePlot(id: string) {
  return useQuery({
    queryKey: ["plots", id],
    queryFn: () => api.getPlot(id),
    enabled: !!id,
  });
}

// Create plot mutation
export function useCreatePlot() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: api.createPlot,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["plots"] });
      toast({
        title: "Success",
        description: "Plot created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
```

### 3️⃣ Using Hooks in Components

**Example:**
```typescript
import { usePlots, useCreatePlot } from "@/hooks/use-plots";
import { Button } from "@/components/ui/button";

export default function PlotsPage() {
  const { data: plots, isLoading, error } = usePlots();
  const createPlot = useCreatePlot();

  const handleCreate = () => {
    createPlot.mutate({
      plot_id: "PLOT-001",
      farmer_name: "John Doe",
      area_ha: 2.5,
    });
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <Button onClick={handleCreate} disabled={createPlot.isPending}>
        Create Plot
      </Button>
      
      {plots?.map((plot) => (
        <div key={plot.id}>{plot.plot_id}</div>
      ))}
    </div>
  );
}
```

---

## 📝 Form Handling (React Hook Form + Zod)

### 1️⃣ Define Zod Schema

**File: `client/src/lib/schemas.ts`**
```typescript
import { z } from "zod";

export const plotSchema = z.object({
  plot_id: z
    .string()
    .min(3, "Plot ID must be at least 3 characters")
    .max(50, "Plot ID too long"),
  
  farmer_name: z
    .string()
    .min(2, "Farmer name required")
    .max(100, "Name too long"),
  
  area_ha: z
    .number()
    .positive("Area must be positive")
    .max(1000, "Area too large"),
  
  geom: z.object({
    type: z.literal("Polygon"),
    coordinates: z.array(z.array(z.array(z.number()))),
  }).optional(),
  
  email: z
    .string()
    .email("Invalid email address")
    .optional(),
});

export type PlotFormData = z.infer<typeof plotSchema>;
```

### 2️⃣ Create Form Component

**File: `client/src/components/plot-form.tsx`**
```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { plotSchema, type PlotFormData } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

interface PlotFormProps {
  onSubmit: (data: PlotFormData) => void;
  defaultValues?: Partial<PlotFormData>;
}

export function PlotForm({ onSubmit, defaultValues }: PlotFormProps) {
  const form = useForm<PlotFormData>({
    resolver: zodResolver(plotSchema),
    defaultValues: defaultValues || {
      plot_id: "",
      farmer_name: "",
      area_ha: 0,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="plot_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Plot ID</FormLabel>
              <FormControl>
                <Input placeholder="PLOT-001" {...field} />
              </FormControl>
              <FormDescription>
                Unique identifier for the plot
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="farmer_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Farmer Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="area_ha"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Area (hectares)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Creating..." : "Create Plot"}
        </Button>
      </form>
    </Form>
  );
}
```

### 3️⃣ Using Form in Page

```typescript
import { PlotForm } from "@/components/plot-form";
import { useCreatePlot } from "@/hooks/use-plots";

export default function CreatePlotPage() {
  const createPlot = useCreatePlot();

  const handleSubmit = (data: PlotFormData) => {
    createPlot.mutate(data);
  };

  return (
    <div className="container max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Create New Plot</h1>
      <PlotForm onSubmit={handleSubmit} />
    </div>
  );
}
```

---

## 🔐 Authentication System (Passport.js)

### 1️⃣ Passport Local Strategy

**File: `server/auth.ts`**
```typescript
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import bcrypt from "bcrypt";
import { db } from "./db";
import { sit_users } from "../shared/schema";
import { eq } from "drizzle-orm";

export function setupAuth(app: Express) {
  // Configure passport local strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const [user] = await db
          .select()
          .from(sit_users)
          .where(eq(sit_users.username, username))
          .limit(1);

        if (!user) {
          return done(null, false, { message: "Invalid username or password" });
        }

        // Compare password
        const isValid = await bcrypt.compare(password, user.password || "");
        if (!isValid) {
          return done(null, false, { message: "Invalid username or password" });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  // Serialize user
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  // Deserialize user
  passport.deserializeUser(async (id: number, done) => {
    try {
      const [user] = await db
        .select()
        .from(sit_users)
        .where(eq(sit_users.id, id))
        .limit(1);
      
      done(null, user || null);
    } catch (err) {
      done(err);
    }
  });

  // ===== AUTH ROUTES =====

  // Register
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, email, password, full_name } = req.body;

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const [user] = await db
        .insert(sit_users)
        .values({
          username,
          email,
          password: hashedPassword,
          full_name,
        })
        .returning();

      // Auto login after register
      req.login(user, (err) => {
        if (err) return res.status(500).json({ message: "Login failed" });
        res.json({ message: "Registration successful", user });
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Login
  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info.message });

      req.login(user, (err) => {
        if (err) return next(err);
        res.json({ message: "Login successful", user });
      });
    })(req, res, next);
  });

  // Logout
  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      res.json({ message: "Logout successful" });
    });
  });

  // Get current user
  app.get("/api/auth/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(req.user);
  });
}

// Authentication middleware
export function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}
```

### 2️⃣ Frontend Auth Hook

**File: `client/src/hooks/use-auth.tsx`**
```typescript
import { createContext, useContext, useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  // Fetch current user
  const { data: user, isLoading } = useQuery({
    queryKey: ["auth", "user"],
    queryFn: async () => {
      const res = await fetch("/api/auth/user", { credentials: "include" });
      if (!res.ok) throw new Error("Not authenticated");
      return res.json();
    },
    retry: false,
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Login failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "user"] });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Logout failed");
    },
    onSuccess: () => {
      queryClient.setQueryData(["auth", "user"], null);
    },
  });

  const value: AuthContextType = {
    user: user || null,
    isLoading,
    login: async (username, password) => {
      await loginMutation.mutateAsync({ username, password });
    },
    logout: async () => {
      await logoutMutation.mutateAsync();
    },
    register: async (data) => {
      // Implementation similar to login
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
```

---

## ☁️ File Storage (Google Cloud Storage)

### 1️⃣ Setup GCS Client

**File: `server/objectStorage.ts`**
```typescript
import { Storage } from "@google-cloud/storage";

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  credentials: {
    client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  },
});

const bucketName = process.env.GCS_BUCKET_NAME || "eudr-documents";
const bucket = storage.bucket(bucketName);

// Upload file
export async function uploadFile(
  file: Express.Multer.File,
  destination: string
): Promise<string> {
  const blob = bucket.file(destination);
  const blobStream = blob.createWriteStream({
    resumable: false,
    metadata: {
      contentType: file.mimetype,
    },
  });

  return new Promise((resolve, reject) => {
    blobStream
      .on("finish", async () => {
        // Make file public (optional)
        await blob.makePublic();
        
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${destination}`;
        resolve(publicUrl);
      })
      .on("error", (err) => {
        reject(err);
      })
      .end(file.buffer);
  });
}

// Download file
export async function downloadFile(filename: string): Promise<Buffer> {
  const [fileContents] = await bucket.file(filename).download();
  return fileContents;
}

// Delete file
export async function deleteFile(filename: string): Promise<void> {
  await bucket.file(filename).delete();
}

// Get signed URL (temporary access)
export async function getSignedUrl(
  filename: string,
  expiresIn: number = 3600
): Promise<string> {
  const [url] = await bucket.file(filename).getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + expiresIn * 1000,
  });
  return url;
}
```

### 2️⃣ File Upload Route

**File: `server/routes.ts`** (add to existing):
```typescript
import multer from "multer";
import { uploadFile } from "./objectStorage";

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Upload endpoint
app.post("/api/upload", requireAuth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    const filename = `${Date.now()}-${req.file.originalname}`;
    const destination = `uploads/${req.user.id}/${filename}`;

    const publicUrl = await uploadFile(req.file, destination);

    res.json({
      message: "File uploaded successfully",
      url: publicUrl,
      filename: destination,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});
```

### 3️⃣ Frontend Upload Component

**File: `client/src/components/file-upload.tsx`**
```typescript
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function FileUpload({ onUploadSuccess }: { onUploadSuccess: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      onUploadSuccess(data.url);
      
      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        id="file-upload"
        className="hidden"
        onChange={handleFileChange}
        disabled={uploading}
      />
      <label htmlFor="file-upload">
        <Button asChild disabled={uploading}>
          <span>
            {uploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {uploading ? "Uploading..." : "Upload File"}
          </span>
        </Button>
      </label>
    </div>
  );
}
```

---

## 🗺️ Map Implementation (Leaflet + React-Leaflet)

### 1️⃣ Install & Setup

```bash
npm install leaflet react-leaflet @types/leaflet
```

**Import Leaflet CSS in `client/src/index.css`:**
```css
@import 'leaflet/dist/leaflet.css';
```

### 2️⃣ Map Component

**File: `client/src/components/map/plot-map.tsx`**
```typescript
import { MapContainer, TileLayer, Polygon, Popup, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icon
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface PlotMapProps {
  center?: [number, number];
  zoom?: number;
  plots: Array<{
    id: string;
    name: string;
    coordinates: [number, number][][];
    color?: string;
  }>;
}

export function PlotMap({ center = [-2.5, 118.0], zoom = 5, plots }: PlotMapProps) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      style={{ height: "600px", width: "100%" }}
      className="rounded-lg border"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {plots.map((plot) => (
        <Polygon
          key={plot.id}
          positions={plot.coordinates}
          pathOptions={{
            color: plot.color || "#22c55e",
            fillColor: plot.color || "#22c55e",
            fillOpacity: 0.3,
            weight: 2,
          }}
        >
          <Popup>
            <div>
              <h3 className="font-semibold">{plot.name}</h3>
              <p className="text-sm text-gray-600">Plot ID: {plot.id}</p>
            </div>
          </Popup>
        </Polygon>
      ))}
    </MapContainer>
  );
}
```

### 3️⃣ Using Map Component

```typescript
import { PlotMap } from "@/components/map/plot-map";
import { usePlots } from "@/hooks/use-plots";

export default function PlotsMapPage() {
  const { data: plots } = usePlots();

  const mapPlots = plots?.map((plot) => ({
    id: plot.id,
    name: plot.plot_id,
    coordinates: plot.geom.coordinates,
    color: plot.compliance_status === "COMPLIANT" ? "#22c55e" : "#ef4444",
  })) || [];

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Plots Map</h1>
      <PlotMap plots={mapPlots} />
    </div>
  );
}
```

---

## 🔌 GraphQL API (Apollo Server)

### 1️⃣ Setup Apollo Server

**File: `server/graphql/schema.ts`**
```typescript
export const typeDefs = `#graphql
  type User {
    id: ID!
    username: String!
    email: String!
    full_name: String
  }

  type Plot {
    id: ID!
    plot_id: String!
    farmer_name: String
    area_ha: Float
    created_at: String
  }

  type Query {
    user: User
    plots: [Plot!]!
    plot(id: ID!): Plot
  }

  type Mutation {
    createPlot(plot_id: String!, farmer_name: String!, area_ha: Float!): Plot!
  }
`;
```

**File: `server/graphql/resolvers.ts`**
```typescript
import { db } from "../db";
import { sit_users, sit_plots } from "../../shared/schema";
import { eq } from "drizzle-orm";

export const resolvers = {
  Query: {
    user: async (_: any, __: any, context: any) => {
      if (!context.user) throw new Error("Not authenticated");
      return context.user;
    },
    
    plots: async () => {
      return await db.select().from(sit_plots);
    },
    
    plot: async (_: any, { id }: { id: string }) => {
      const [plot] = await db
        .select()
        .from(sit_plots)
        .where(eq(sit_plots.id, parseInt(id)))
        .limit(1);
      return plot;
    },
  },
  
  Mutation: {
    createPlot: async (_: any, { plot_id, farmer_name, area_ha }: any) => {
      const [plot] = await db
        .insert(sit_plots)
        .values({ plot_id, farmer_name, area_ha })
        .returning();
      return plot;
    },
  },
};
```

**File: `server/graphql/index.ts`**
```typescript
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { typeDefs } from "./schema";
import { resolvers } from "./resolvers";

export async function setupGraphQL(app: Express) {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await server.start();

  app.use(
    "/graphql",
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }) => ({
        user: req.user,
      }),
    })
  );

  console.log("🚀 GraphQL server ready at /graphql");
}
```

### 2️⃣ Frontend GraphQL Client

**File: `client/src/lib/graphql-client.ts`**
```typescript
const GRAPHQL_ENDPOINT = "/graphql";

export async function graphqlQuery<T>(
  query: string,
  variables?: Record<string, any>
): Promise<T> {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ query, variables }),
  });

  const { data, errors } = await response.json();
  if (errors) throw new Error(errors[0].message);
  return data;
}

// Example queries
export const queries = {
  GET_PLOTS: `
    query GetPlots {
      plots {
        id
        plot_id
        farmer_name
        area_ha
      }
    }
  `,
  
  GET_PLOT: `
    query GetPlot($id: ID!) {
      plot(id: $id) {
        id
        plot_id
        farmer_name
        area_ha
        created_at
      }
    }
  `,
};
```

---

## 🤖 AI Integration (OpenAI)

### 1️⃣ OpenAI Client Setup

**File: `server/lib/openai.ts`**
```typescript
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Risk assessment with GPT-4
export async function assessDeforestationRisk(
  plotData: {
    area_ha: number;
    location: string;
    alerts: any[];
  }
): Promise<string> {
  const prompt = `
Analyze the deforestation risk for this agricultural plot:

Area: ${plotData.area_ha} hectares
Location: ${plotData.location}
Recent Alerts: ${plotData.alerts.length} deforestation alerts in the past year

Alert Details:
${plotData.alerts.map((a, i) => `${i + 1}. ${a.date}: ${a.confidence}% confidence`).join("\n")}

Provide a comprehensive risk assessment including:
1. Overall risk level (LOW, MEDIUM, HIGH)
2. Key risk factors
3. Compliance recommendations
4. Monitoring suggestions

Format as JSON with fields: risk_level, factors, recommendations, monitoring.
  `;

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "You are an EUDR compliance expert specializing in deforestation risk assessment.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  return completion.choices[0].message.content || "{}";
}

// Generate compliance report
export async function generateComplianceReport(
  plotId: string,
  assessmentData: any
): Promise<string> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "You are a regulatory compliance report generator for EUDR.",
      },
      {
        role: "user",
        content: `Generate a comprehensive EUDR compliance report for plot ${plotId} based on this assessment data: ${JSON.stringify(assessmentData)}`,
      },
    ],
    temperature: 0.5,
  });

  return completion.choices[0].message.content || "";
}
```

### 2️⃣ API Endpoint for AI Analysis

**File: `server/routes.ts`** (add to existing):
```typescript
import { assessDeforestationRisk } from "./lib/openai";

app.post("/api/plots/:id/analyze", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get plot data
    const [plot] = await db
      .select()
      .from(sit_plots)
      .where(eq(sit_plots.id, parseInt(id)))
      .limit(1);

    if (!plot) {
      return res.status(404).json({ message: "Plot not found" });
    }

    // Get deforestation alerts (from external API or database)
    const alerts = []; // Fetch from GFW or database

    // AI Risk Assessment
    const analysisResult = await assessDeforestationRisk({
      area_ha: plot.area_ha,
      location: plot.location,
      alerts,
    });

    const analysis = JSON.parse(analysisResult);

    // Save to database
    await db.insert(sit_compliance).values({
      plot_id: plot.id,
      deforestation_risk: analysis.risk_level,
      assessment_data: analysis,
    });

    res.json({
      plot_id: plot.plot_id,
      analysis,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});
```

---

## 🚀 Deployment Configuration

### 1️⃣ Build Scripts

**package.json scripts:**
```json
{
  "scripts": {
    "dev": "cross-env NODE_ENV=development tsx server/index.ts",
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "cross-env NODE_ENV=production node dist/index.js",
    "check": "tsc",
    "db:push": "drizzle-kit push",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate"
  }
}
```

### 2️⃣ Production Build

```bash
# Build frontend and backend
npm run build

# Apply database migrations
npm run db:migrate

# Start production server
npm start
```

### 3️⃣ Environment Variables (Production)

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=production-database-url
SESSION_SECRET=production-secret-32-chars-min
GOOGLE_CLOUD_PROJECT_ID=production-project
# ... other production secrets
```

### 4️⃣ Docker Configuration (Optional)

**File: `Dockerfile`**
```dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application
COPY . .

# Build
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

**File: `docker-compose.yml`**
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/eudr_db
      - NODE_ENV=production
    depends_on:
      - db
  
  db:
    image: postgis/postgis:14-3.3
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=eudr_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

---

## 🧪 Testing & Debugging

### 1️⃣ Type Checking

```bash
# Run TypeScript type checking
npm run check

# Watch mode
npx tsc --watch
```

### 2️⃣ Database Debugging

```sql
-- Check all tables
\dt

-- Check PostGIS
SELECT PostGIS_version();

-- View sessions
SELECT * FROM session;

-- Check plots count
SELECT COUNT(*) FROM sit_plots;

-- Geospatial query example
SELECT plot_id, ST_AsGeoJSON(geom) 
FROM sit_plots 
WHERE ST_Area(geom::geography) > 10000;
```

### 3️⃣ API Testing with cURL

```bash
# Health check
curl http://localhost:5000/api/health

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}' \
  -c cookies.txt

# Get user (with session)
curl http://localhost:5000/api/auth/user \
  -b cookies.txt

# Get plots
curl http://localhost:5000/api/plots \
  -b cookies.txt
```

### 4️⃣ Chrome DevTools

- **Network Tab**: Monitor API requests/responses
- **Application Tab**: Check session cookies, localStorage
- **Console**: View React Query cache with `window.__REACT_QUERY_DEVTOOLS__`

---

## ⚡ Performance Optimization

### 1️⃣ React Query Optimization

```typescript
// Prefetch data
const queryClient = useQueryClient();

queryClient.prefetchQuery({
  queryKey: ["plots"],
  queryFn: api.getPlots,
});

// Stale time configuration
useQuery({
  queryKey: ["plots"],
  queryFn: api.getPlots,
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
});
```

### 2️⃣ Database Indexing

```sql
-- Create indexes for frequently queried columns
CREATE INDEX idx_plots_plot_id ON sit_plots(plot_id);
CREATE INDEX idx_users_email ON sit_users(email);
CREATE INDEX idx_users_google_id ON sit_users(google_id);

-- Spatial index for geometry
CREATE INDEX idx_plots_geom ON sit_plots USING GIST(geom);
```

### 3️⃣ Code Splitting

```typescript
// Lazy load pages
import { lazy, Suspense } from "react";

const DashboardPage = lazy(() => import("@/pages/dashboard-page"));
const PlotsPage = lazy(() => import("@/pages/plots-page"));

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Switch>
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/plots" component={PlotsPage} />
      </Switch>
    </Suspense>
  );
}
```

### 4️⃣ Image Optimization

```typescript
// Use WebP format with fallback
<picture>
  <source srcSet="image.webp" type="image/webp" />
  <img src="image.jpg" alt="Description" />
</picture>

// Lazy load images
<img 
  src="image.jpg" 
  loading="lazy" 
  alt="Description"
/>
```

---

## 📚 Additional Resources

### Official Documentation
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [TanStack Query](https://tanstack.com/query/latest)
- [Radix UI](https://www.radix-ui.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Passport.js](https://www.passportjs.org/)
- [Leaflet](https://leafletjs.com/)
- [Apollo Server](https://www.apollographql.com/docs/apollo-server/)

### Community Resources
- [shadcn/ui Components](https://ui.shadcn.com/)
- [React Hook Form Examples](https://react-hook-form.com/get-started)
- [Zod Schema Validation](https://zod.dev/)

### Troubleshooting
- **PostGIS not found**: `CREATE EXTENSION postgis;`
- **Session not persisting**: Check `SESSION_SECRET` and cookie settings
- **CORS errors**: Verify `credentials: "include"` on fetch
- **TypeScript errors**: Run `npm run check` for detailed errors
- **Map not displaying**: Ensure Leaflet CSS is imported

---

## 🎯 Quick Start Checklist

- [ ] Install Node.js 18+ and PostgreSQL 14+
- [ ] Clone repository and run `npm install`
- [ ] Create `.env` file with all required variables
- [ ] Setup PostgreSQL database with PostGIS extension
- [ ] Run `npm run db:push` to create tables
- [ ] Start development server with `npm run dev`
- [ ] Access app at `http://localhost:5000`
- [ ] Test login/registration
- [ ] Verify map functionality
- [ ] Test file upload to GCS
- [ ] Run AI risk assessment
- [ ] Build for production with `npm run build`

---

## 💬 Support & Contribution

Untuk pertanyaan atau kontribusi, silakan hubungi Tim Development atau buat issue di repository.

**Happy Coding! 🚀**
