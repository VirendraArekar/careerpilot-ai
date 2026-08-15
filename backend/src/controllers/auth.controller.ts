import type { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env.js';
import { User } from '../models/index.js';
import { asyncHandler } from '../utils/http.js';

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['candidate', 'recruiter']).default('candidate'),
});
export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
export const googleSchema = z.object({ credential: z.string().min(20) });

function tokenFor(userId: string) {
  return jwt.sign({}, env.JWT_SECRET, { subject: userId, expiresIn: env.JWT_EXPIRES_IN as never });
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const exists = await User.exists({ email: req.body.email });
  if (exists) return res.status(409).json({ message: 'An account with this email already exists' });
  const user = await User.create({
    ...req.body,
    passwordHash: await bcrypt.hash(req.body.password, 12),
  });
  res.status(201).json({ token: tokenFor(user.id), user });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash)))
    return res.status(401).json({ message: 'Invalid email or password' });
  res.json({ token: tokenFor(user.id), user });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  res.json({ user: req.user });
});

export const googleLogin = asyncHandler(async (req: Request, res: Response) => {
  if (!env.GOOGLE_CLIENT_ID)
    return res.status(503).json({ message: 'Google authentication is not configured' });
  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(req.body.credential)}`
  );
  if (!response.ok)
    return res.status(401).json({ message: 'Google credential could not be verified' });
  const identity = (await response.json()) as {
    aud?: string;
    email?: string;
    email_verified?: string;
    name?: string;
    picture?: string;
    exp?: string;
  };
  if (
    identity.aud !== env.GOOGLE_CLIENT_ID ||
    identity.email_verified !== 'true' ||
    !identity.email ||
    Number(identity.exp) * 1000 < Date.now()
  )
    return res.status(401).json({ message: 'Google credential is invalid or expired' });
  let user = await User.findOne({ email: identity.email });
  if (!user)
    user = await User.create({
      name: identity.name ?? identity.email.split('@')[0],
      email: identity.email,
      passwordHash: await bcrypt.hash(randomUUID(), 12),
      role: 'candidate',
      photoUrl: identity.picture,
    });
  res.json({ token: tokenFor(user.id), user });
});
