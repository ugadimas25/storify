import session from "express-session";
import type { Express, Request, Response, NextFunction, RequestHandler } from "express";
import MemoryStore from "memorystore";
import { authStorage } from "./storage";

const MemoryStoreSession = MemoryStore(session);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  
  return session({
    secret: process.env.SESSION_SECRET || "storify-secret-key-change-in-production",
    store: new MemoryStoreSession({
      checkPeriod: 86400000, // prune expired entries every 24h
    }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
      sameSite: "lax",
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  // Simple login endpoint - generates a guest user session
  app.post("/api/login", async (req: Request, res: Response) => {
    try {
      const { email, name } = req.body;
      
      // Generate a unique user ID
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Upsert user
      const user = await authStorage.upsertUser({
        id: userId,
        email: email || `guest_${userId}@storify.local`,
        firstName: name || "Guest",
        lastName: "User",
        profileImageUrl: null,
      });

      // Store user in session
      (req.session as any).user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
      };

      res.json(user);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Guest login - creates anonymous session
  app.post("/api/login/guest", async (req: Request, res: Response) => {
    try {
      const guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const user = await authStorage.upsertUser({
        id: guestId,
        email: `${guestId}@storify.local`,
        firstName: "Guest",
        lastName: "User",
        profileImageUrl: null,
      });

      (req.session as any).user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
      };

      res.json(user);
    } catch (error) {
      console.error("Guest login error:", error);
      res.status(500).json({ message: "Guest login failed" });
    }
  });

  app.get("/api/logout", (req: Request, res: Response) => {
    req.session.destroy((err: any) => {
      if (err) {
        console.error("Logout error:", err);
      }
      res.redirect("/");
    });
  });

  app.post("/api/logout", (req: Request, res: Response) => {
    req.session.destroy((err: any) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });
}

export const isAuthenticated: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  const user = (req.session as any)?.user;

  if (!user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  // Attach user to request for easy access
  (req as any).user = { claims: { sub: user.id }, ...user };
  next();
};

export function registerAuthRoutes(app: Express): void {
  // Get current authenticated user
  app.get("/api/auth/user", async (req: Request, res: Response) => {
    const user = (req.session as any)?.user;
    
    if (!user) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    try {
      const fullUser = await authStorage.getUser(user.id);
      res.json(fullUser || user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.json(user);
    }
  });
}

export { authStorage, type IAuthStorage } from "./storage";
