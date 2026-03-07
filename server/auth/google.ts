import { Express } from "express";
import { OAuth2Client } from "google-auth-library";
import { db } from "../db";
import { users, activityLogs } from "@db/schema";
import { eq } from "drizzle-orm";

// Initialize Google OAuth2 Client
const client = new OAuth2Client(process.env.VITE_GOOGLE_CLIENT_ID);

// Helper: Log user activity (fire-and-forget)
async function logActivity(
  req: any,
  userId: string,
  action: string,
  metadata?: Record<string, any>
) {
  try {
    await db.insert(activityLogs).values({
      userId,
      action,
      resourceType: "auth",
      resourceId: null,
      metadata: metadata || null,
      ipAddress: req.ip || req.headers["x-forwarded-for"] || null,
      userAgent: req.headers["user-agent"] || null,
    });
  } catch (err) {
    console.error("Activity log error:", err);
  }
}

export function setupGoogleAuth(app: Express) {
  /**
   * POST /api/auth/google
   * Endpoint untuk verify Google ID Token dan login/register user
   */
  app.post("/api/auth/google", async (req, res) => {
    try {
      const { credential } = req.body;

      // Validate request
      if (!credential) {
        return res.status(400).json({
          message: "Missing Google credential",
        });
      }

      // ===== STEP 1: Verify Google ID Token =====
      console.log("🔍 Verifying Google ID Token...");
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.VITE_GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        return res.status(401).json({
          message: "Invalid Google token",
        });
      }

      // Extract user information dari Google
      const {
        email,
        name,
        picture,
        sub: googleId, // Google User ID (unique & permanent)
        given_name: givenName,
        family_name: familyName,
      } = payload;

      console.log(`✅ Google user verified: ${email} (${googleId})`);

      // ===== STEP 2: Find user by google_id =====
      let [user] = await db
        .select()
        .from(users)
        .where(eq(users.googleId, googleId))
        .limit(1);

      // ===== STEP 3: If not found, try matching by email =====
      if (!user && email) {
        console.log("👤 User not found by google_id, checking email...");
        [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        // Link Google account to existing user
        if (user) {
          console.log("🔗 Linking Google account to existing user");
          await db
            .update(users)
            .set({
              googleId: googleId,
              profileImageUrl: picture || user.profileImageUrl,
              emailVerified: true, // Auto-verify if using Google
            })
            .where(eq(users.id, user.id));

          // Refresh user data
          [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, user.id))
            .limit(1);
        }
      }

      // ===== STEP 4: If still not found → create new user =====
      if (!user) {
        console.log("➕ Creating new user from Google account");
        const [created] = await db
          .insert(users)
          .values({
            email: email || undefined,
            name: name || undefined,
            firstName: givenName || undefined,
            lastName: familyName || undefined,
            googleId: googleId,
            profileImageUrl: picture || undefined,
            emailVerified: true, // Auto-verify Google users
            // No password for Google-only users
          })
          .returning();

        user = created;
      }

      // ===== STEP 5: Create session (same as normal login) =====
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      (req.session as any).userId = user.id;
      (req.session as any).sessionId = sessionId;
      (req.session as any).user = {
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
      };

      // Save session
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      console.log(`✅ Login successful: User ID ${user.id}`);

      // Log activity
      await logActivity(req, user.id, "login", {
        method: "google",
        email: user.email,
        name: user.name,
      });

      // ===== STEP 6: Return response =====
      res.json({
        ok: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
          emailVerified: user.emailVerified,
        },
      });
    } catch (err: any) {
      console.error("❌ Google auth error:", err);

      // Handle specific errors
      if (err.message?.includes("Token used too late")) {
        return res.status(401).json({
          message: "Google token expired. Please try again.",
        });
      }

      res.status(401).json({
        message: "Google authentication failed",
        error:
          process.env.NODE_ENV === "development" ? err.message : undefined,
      });
    }
  });
}
