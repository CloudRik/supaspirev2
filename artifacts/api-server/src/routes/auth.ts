import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { requireAuth, AuthRequest } from "../middlewares/authMiddleware";

const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_for_dev";
const API_URL = process.env.API_URL || "http://localhost:5000";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5174";

// Google
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const GOOGLE_REDIRECT_URI = `${API_URL}/api/auth/google/callback`;

// GitHub
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || "";
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || "";
const GITHUB_REDIRECT_URI = `${API_URL}/api/auth/github/callback`;

const generateToken = (userId: string) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
};

const sendPopupResponse = (res: any, token: string) => {
  res.send(`
    <html>
      <body>
        <script>
          window.opener.postMessage({ type: 'AUTH_SUCCESS', token: '${token}' }, '${FRONTEND_URL}');
          window.close();
        </script>
      </body>
    </html>
  `);
};

const sendPopupError = (res: any, errorMsg: string) => {
  res.send(`
    <html>
      <body>
        <script>
          window.opener.postMessage({ type: 'AUTH_ERROR', error: '${errorMsg}' }, '${FRONTEND_URL}');
          window.close();
        </script>
      </body>
    </html>
  `);
};

// =======================
// GOOGLE OAUTH
// =======================
authRouter.get("/auth/google", (req, res) => {
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${GOOGLE_REDIRECT_URI}&response_type=code&scope=email profile`;
  res.redirect(url);
});

authRouter.get("/auth/google/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) return sendPopupError(res, "No code provided");

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: code as string,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }),
    });
    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) return sendPopupError(res, "Failed to get access token");

    const userResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userResponse.json();

    const { id, email, name, picture } = userData;

    let user = await db.select().from(usersTable).where(eq(usersTable.providerId, id)).limit(1);
    
    if (user.length === 0) {
      const newUserId = crypto.randomUUID();
      user = await db.insert(usersTable).values({
        id: newUserId,
        email,
        name,
        avatarUrl: picture,
        provider: "google",
        providerId: id,
      }).returning();
    }

    const token = generateToken(user[0].id);
    sendPopupResponse(res, token);
  } catch (error) {
    sendPopupError(res, "Internal Server Error");
  }
});

// =======================
// GITHUB OAUTH
// =======================
authRouter.get("/auth/github", (req, res) => {
  const url = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${GITHUB_REDIRECT_URI}&scope=user:email`;
  res.redirect(url);
});

authRouter.get("/auth/github/callback", async (req, res) => {
  const { code } = req.query;
  if (!code) return sendPopupError(res, "No code provided");

  try {
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      }),
    });
    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) return sendPopupError(res, "Failed to get access token");

    const userResponse = await fetch("https://api.github.com/user", {
      headers: { 
        Authorization: `Bearer ${tokenData.access_token}`,
        "Accept": "application/json"
      },
    });
    const userData = await userResponse.json();

    let email = userData.email;
    if (!email) {
      const emailsResponse = await fetch("https://api.github.com/user/emails", {
        headers: { 
          Authorization: `Bearer ${tokenData.access_token}`,
          "Accept": "application/json"
        },
      });
      const emails = await emailsResponse.json();
      email = emails.find((e: any) => e.primary)?.email || emails[0]?.email;
    }

    const { id, name, avatar_url } = userData;

    let user = await db.select().from(usersTable).where(eq(usersTable.providerId, id.toString())).limit(1);
    
    if (user.length === 0) {
      const newUserId = crypto.randomUUID();
      user = await db.insert(usersTable).values({
        id: newUserId,
        email,
        name: name || email.split("@")[0],
        avatarUrl: avatar_url,
        provider: "github",
        providerId: id.toString(),
      }).returning();
    }

    const token = generateToken(user[0].id);
    sendPopupResponse(res, token);
  } catch (error) {
    sendPopupError(res, "Internal Server Error");
  }
});

// =======================
// GET CURRENT USER
// =======================
authRouter.get("/auth/me", requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);
    if (user.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user[0]);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

export default authRouter;
