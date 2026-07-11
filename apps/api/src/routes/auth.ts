import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma, UserRole, UserPlan } from 'database';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { generateSecret, verifyTOTP, getOTPAuthURI, generateQRCodeDataURI } from '../lib/totp.js';
import { sendResetPasswordEmail } from '../services/mailer.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

const logoutSchema = z.object({
  allDevices: z.boolean().default(false),
}).optional();

const updateProfileSchema = z.object({
  fullName: z.string().min(2).optional(),
  email: z.string().email().optional(),
});

const changePasswordSchema = z.object({
  oldPassword: z.string(),
  newPassword: z.string().min(8),
});

const verify2faSchema = z.object({
  tempToken: z.string(),
  code: z.string().length(6),
});

const enable2faSchema = z.object({
  code: z.string().length(6),
});

const disable2faSchema = z.object({
  password: z.string(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(8),
});

export const authRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  
  // POST /auth/register
  fastify.post('/register', {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '1 minute',
        errorResponseBuilder: (request, context) => ({
          success: false,
          error: {
            code: 'TOO_MANY_REQUESTS',
            message: `Too many registration attempts. Please try again in ${context.after}.`
          }
        })
      }
    }
  }, async (request, reply) => {
    const parse = registerSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid registration parameters',
          details: parse.error.format()
        }
      });
    }

    const { email, password, fullName } = parse.data;

    const existingUser = await prisma.user.findFirst({
      where: { email, deletedAt: null }
    });
    if (existingUser) {
      return reply.status(409).send({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'A user with this email address already exists'
        }
      });
    }

    // Check if there is an old soft-deleted user with the same email and rename them to release unique constraint
    const oldSoftDeletedUser = await prisma.user.findFirst({
      where: { email, NOT: { deletedAt: null } }
    });
    if (oldSoftDeletedUser) {
      await prisma.user.update({
        where: { id: oldSoftDeletedUser.id },
        data: {
          email: `${oldSoftDeletedUser.email}.deleted.${Date.now()}`,
          googleId: oldSoftDeletedUser.googleId ? `${oldSoftDeletedUser.googleId}.deleted.${Date.now()}` : null
        }
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName,
        role: UserRole.USER,
        plan: UserPlan.FREE,
      }
    });

    // Generate tokens
    const accessToken = fastify.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      plan: user.plan
    });

    const tokenFamily = crypto.randomUUID();
    const refreshToken = fastify.jwt.sign({
      sub: user.id,
      tokenFamily
    }, { expiresIn: '7d' });

    const hashedRefreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: hashedRefreshToken,
        tokenFamily,
        userAgent: request.headers['user-agent'] || null,
        ipAddress: request.ip,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    return reply.status(201).send({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          plan: user.plan
        },
        accessToken,
        refreshToken
      }
    });
  });

  // POST /auth/login
  fastify.post('/login', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
        errorResponseBuilder: (request, context) => ({
          success: false,
          error: {
            code: 'TOO_MANY_REQUESTS',
            message: `Too many login attempts. Please try again in ${context.after}.`
          }
        })
      }
    }
  }, async (request, reply) => {
    const parse = loginSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid login parameters',
          details: parse.error.format()
        }
      });
    }

    const { email, password } = parse.data;

    const user = await prisma.user.findUnique({ where: { email } });
    
    // To prevent user enumeration, we do a dummy hash comparison if user is not found
    if (!user || !user.passwordHash) {
      await bcrypt.compare(password, '$2a$12$dummyhashdummyhashdummyhashdummyhashdummyhash'); // dummy hash
      return reply.status(401).send({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'The email or password you entered is incorrect.'
        }
      });
    }

    if (!user.isActive) {
      return reply.status(403).send({
        success: false,
        error: {
          code: 'USER_SUSPENDED',
          message: 'Your account is currently suspended. Please contact support.'
        }
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'The email or password you entered is incorrect.'
        }
      });
    }

    if (user.twoFactorEnabled) {
      const tempToken = fastify.jwt.sign({
        sub: user.id,
        requires2FA: true
      }, { expiresIn: '5m' });

      return reply.status(200).send({
        success: true,
        data: {
          requires2FA: true,
          tempToken
        }
      });
    }

    // Update login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Generate tokens
    const accessToken = fastify.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      plan: user.plan
    });

    const tokenFamily = crypto.randomUUID();
    const refreshToken = fastify.jwt.sign({
      sub: user.id,
      tokenFamily
    }, { expiresIn: '7d' });

    const hashedRefreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: hashedRefreshToken,
        tokenFamily,
        userAgent: request.headers['user-agent'] || null,
        ipAddress: request.ip,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    return reply.status(200).send({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          plan: user.plan
        },
        accessToken,
        refreshToken
      }
    });
  });

  // POST /auth/refresh
  fastify.post('/refresh', async (request, reply) => {
    const parse = refreshSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid refresh parameters',
          details: parse.error.format()
        }
      });
    }

    const { refreshToken } = parse.data;

    let payload: any;
    try {
      payload = fastify.jwt.verify(refreshToken);
    } catch {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Refresh token has expired or is invalid'
        }
      });
    }

    const hashedRefreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');

    // Retrieve active session
    const activeSession = await prisma.session.findUnique({
      where: { refreshTokenHash: hashedRefreshToken },
      include: { user: true }
    });

    // Refresh Token Reuse Attack Detection (Section 10.1)
    if (!activeSession || activeSession.revokedAt || activeSession.expiresAt < new Date()) {
      // If family is present in database, revoke the WHOLE family (mitigates refresh reuse attack)
      if (payload.tokenFamily) {
        await prisma.session.updateMany({
          where: { tokenFamily: payload.tokenFamily },
          data: { revokedAt: new Date() }
        });
      }
      return reply.status(401).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Refresh token reuse detected or invalid session'
        }
      });
    }

    const user = activeSession.user;
    if (!user.isActive) {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'USER_SUSPENDED',
          message: 'Your account has been suspended. Please contact support.',
        }
      });
    }

    // Revoke old token
    await prisma.session.update({
      where: { id: activeSession.id },
      data: { revokedAt: new Date() }
    });

    // Issue rotating credentials
    const newAccessToken = fastify.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      plan: user.plan
    });

    const newRefreshToken = fastify.jwt.sign({
      sub: user.id,
      tokenFamily: activeSession.tokenFamily
    }, { expiresIn: '7d' });

    const newHashedRefreshToken = crypto.createHash('sha256').update(newRefreshToken).digest('hex');

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: newHashedRefreshToken,
        tokenFamily: activeSession.tokenFamily,
        userAgent: request.headers['user-agent'] || null,
        ipAddress: request.ip,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    return reply.status(200).send({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      }
    });
  });

  // POST /auth/logout (Authenticated)
  fastify.post('/logout', { preHandler: [fastify.authenticate as any] }, async (request: any, reply) => {
    const parse = logoutSchema.safeParse(request.body || {});
    const allDevices = parse.success && parse.data ? parse.data.allDevices : false;

    const userId = request.user.sub;

    if (allDevices) {
      // Revoke all sessions for this user
      await prisma.session.updateMany({
        where: { userId },
        data: { revokedAt: new Date() }
      });
    } else {
      // Just revoke the current session (optional: can extract from token header if required, or match user sessions)
      await prisma.session.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() }
      });
    }

    return reply.status(200).send({
      success: true,
      data: {
        message: 'Logged out successfully'
      }
    });
  });

  // GET /auth/me (Authenticated)
  fastify.get('/me', { preHandler: [fastify.authenticate as any] }, async (request: any, reply) => {
    const userId = request.user.sub;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' }
      });
    }

    return reply.status(200).send({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          plan: user.plan,
          twoFactorEnabled: user.twoFactorEnabled
        }
      }
    });
  });

  // PUT /auth/profile (Authenticated)
  fastify.put('/profile', { preHandler: [fastify.authenticate as any] }, async (request: any, reply) => {
    const parse = updateProfileSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid profile details',
          details: parse.error.format()
        }
      });
    }

    const userId = request.user.sub;
    const { fullName, email } = parse.data;

    // Check if email already taken
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: { email, NOT: { id: userId } }
      });
      if (existingUser) {
        return reply.status(409).send({
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'Email address is already in use by another user'
          }
        });
      }
    }

    // Update user in DB
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(fullName && { fullName }),
        ...(email && { email })
      }
    });

    // Sign new access token with updated profile details
    const accessToken = fastify.jwt.sign({
      sub: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      plan: updatedUser.plan
    });

    return reply.status(200).send({
      success: true,
      data: {
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          fullName: updatedUser.fullName,
          role: updatedUser.role,
          plan: updatedUser.plan
        },
        accessToken
      }
    });
  });

  // POST /api/v1/auth/change-password (Authenticated)
  fastify.post('/change-password', { preHandler: [fastify.authenticate as any] }, async (request: any, reply) => {
    const parse = changePasswordSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid password change parameters',
          details: parse.error.format()
        }
      });
    }

    const userId = request.user.sub;
    const { oldPassword, newPassword } = parse.data;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) {
      return reply.status(404).send({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found.'
        }
      });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'INVALID_PASSWORD',
          message: 'The current password you entered is incorrect.'
        }
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash }
    });

    return reply.status(200).send({
      success: true,
      data: {
        message: 'Password updated successfully'
      }
    });
  });

  // POST /auth/forgot-password
  fastify.post('/forgot-password', {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '1 hour',
        errorResponseBuilder: (request, context) => ({
          success: false,
          error: {
            code: 'TOO_MANY_REQUESTS',
            message: `Too many requests. Please try again in ${context.after}.`
          }
        })
      }
    }
  }, async (request, reply) => {
    const parse = forgotPasswordSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid parameters',
          details: parse.error.format()
        }
      });
    }

    const { email } = parse.data;
    const user = await prisma.user.findUnique({ where: { email } });
    
    // Always return success to prevent user enumeration
    if (!user || !user.isActive) {
      return reply.status(200).send({
        success: true,
        data: { message: 'If that email is registered, we have sent a reset link.' }
      });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: token,
        resetPasswordExpires: expires
      }
    });

    const resetLink = `${env.FRONTEND_URL}/reset-password?token=${token}`;
    
    // Send email
    fastify.log.info(`[Forgot Password] Sending reset link for ${email}: ${resetLink}`);
    await sendResetPasswordEmail(email, resetLink);

    return reply.status(200).send({
      success: true,
      data: { message: 'If that email is registered, we have sent a reset link.' }
    });
  });

  // POST /auth/reset-password
  fastify.post('/reset-password', async (request, reply) => {
    const parse = resetPasswordSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid parameters',
          details: parse.error.format()
        }
      });
    }

    const { token, newPassword } = parse.data;

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() }
      }
    });

    if (!user) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Password reset token is invalid or has expired.'
        }
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetPasswordToken: null,
        resetPasswordExpires: null
      }
    });

    return reply.status(200).send({
      success: true,
      data: { message: 'Password has been reset successfully.' }
    });
  });

  // GET /api/v1/auth/usage (Authenticated)
  fastify.get('/usage', { preHandler: [fastify.authenticate as any] }, async (request: any, reply) => {
    const userId = request.user.sub;

    const messagesCount = await prisma.messageLog.count({
      where: {
        service: { userId, deletedAt: null },
        direction: 'OUTBOUND',
        status: { in: ['SENT', 'DELIVERED', 'READ'] }
      }
    });

    const apiRequestsCount = await prisma.messageLog.count({
      where: {
        service: { userId, deletedAt: null }
      }
    });

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const dailyUsageCount = await prisma.messageLog.count({
      where: {
        service: { userId, deletedAt: null },
        createdAt: { gte: startOfToday }
      }
    });

    // Resolve user plan and determine daily limit
    const plan = request.user.plan || 'FREE';
    let dailyLimit = 100;
    if (plan === 'PRO') dailyLimit = 5000;
    else if (plan === 'BUSINESS') dailyLimit = 50000;
    else if (plan === 'ENTERPRISE') dailyLimit = 99999999;

    try {
      const configKey = `rate_limit.${plan.toLowerCase()}.daily`;
      const systemConfig = await prisma.systemConfig.findUnique({
        where: { key: configKey },
      });
      if (systemConfig && typeof systemConfig.value === 'number') {
        dailyLimit = systemConfig.value;
      }
    } catch (err) {
      // Fallback silently
    }

    return reply.status(200).send({
      success: true,
      data: {
        messagesSent: messagesCount,
        apiRequests: apiRequestsCount,
        dailyUsage: dailyUsageCount,
        dailyLimit
      }
    });
  });

  // GET /auth/google
  fastify.get('/google', async (request, reply) => {
    if (!env.GOOGLE_CLIENT_ID) {
      return reply.redirect(`${env.FRONTEND_URL}/login?error=google_not_configured`);
    }
    const state = crypto.randomBytes(16).toString('hex');
    reply.header('Set-Cookie', `oauth_state=${state}; HttpOnly; Path=/; Max-Age=300; SameSite=Lax`);
    
    const redirectUri = `${env.API_URL}/api/v1/auth/google/callback`;
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20profile%20email&state=${state}`;
    return reply.redirect(googleAuthUrl);
  });

  // GET /auth/google/callback
  fastify.get('/google/callback', async (request: any, reply) => {
    const { code, state } = request.query;
    if (!code) {
      return reply.redirect(`${env.FRONTEND_URL}/login?error=code_missing`);
    }

    const cookieHeader = request.headers.cookie || '';
    const match = cookieHeader.match(/oauth_state=([^;]+)/);
    const storedState = match ? match[1] : null;

    if (!state || !storedState || state !== storedState) {
      return reply.redirect(`${env.FRONTEND_URL}/login?error=csrf_validation_failed`);
    }

    // Clear cookie
    reply.header('Set-Cookie', `oauth_state=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`);

    try {
      const redirectUri = `${env.API_URL}/api/v1/auth/google/callback`;
      
      // Exchange code for token
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: env.GOOGLE_CLIENT_ID,
          client_secret: env.GOOGLE_CLIENT_SECRET,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri
        })
      });

      if (!tokenRes.ok) {
        const errorText = await tokenRes.text();
        fastify.log.error(`Google Token Exchange Error: ${errorText}`);
        return reply.redirect(`${env.FRONTEND_URL}/login?error=token_exchange_failed`);
      }

      const tokenData: any = await tokenRes.json();
      const accessToken = tokenData.access_token;

      // Fetch user profile
      const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (!userRes.ok) {
        return reply.redirect(`${env.FRONTEND_URL}/login?error=user_fetch_failed`);
      }

      const userData: any = await userRes.json();
      const email = userData.email;
      const fullName = userData.name || userData.given_name || 'Google User';
      const googleId = userData.id;

      if (!email) {
        return reply.redirect(`${env.FRONTEND_URL}/login?error=email_missing`);
      }

      // Check user in database
      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { googleId, deletedAt: null },
            { email, deletedAt: null }
          ]
        }
      });

      if (user) {
        if (!user.isActive) {
          return reply.redirect(`${env.FRONTEND_URL}/login?suspended=true`);
        }
        
        // If found by email but googleId was not set
        if (!user.googleId) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { googleId }
          });
        }
      } else {
        // Create user
        user = await prisma.user.create({
          data: {
            email,
            fullName,
            googleId,
            role: UserRole.USER,
            plan: UserPlan.FREE,
            emailVerifiedAt: new Date()
          }
        });
      }

      // Generate temporary exchange token (valid for 1 minute)
      const exchangeToken = fastify.jwt.sign(
        { sub: user.id, purpose: 'oauth_exchange' },
        { expiresIn: '1m' }
      );

      return reply.redirect(`${env.FRONTEND_URL}/login/callback?code=${exchangeToken}`);

    } catch (err: any) {
      fastify.log.error(err);
      return reply.redirect(`${env.FRONTEND_URL}/login?error=internal_server_error`);
    }
  });

  // GET /auth/github
  fastify.get('/github', async (request, reply) => {
    if (!env.GITHUB_CLIENT_ID) {
      return reply.redirect(`${env.FRONTEND_URL}/login?error=github_not_configured`);
    }
    const state = crypto.randomBytes(16).toString('hex');
    reply.header('Set-Cookie', `oauth_state=${state}; HttpOnly; Path=/; Max-Age=300; SameSite=Lax`);
    
    const redirectUri = `${env.API_URL}/api/v1/auth/github/callback`;
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email&state=${state}`;
    return reply.redirect(githubAuthUrl);
  });

  // GET /auth/github/callback
  fastify.get('/github/callback', async (request: any, reply) => {
    const { code, state } = request.query;
    if (!code) {
      return reply.redirect(`${env.FRONTEND_URL}/login?error=code_missing`);
    }

    const cookieHeader = request.headers.cookie || '';
    const match = cookieHeader.match(/oauth_state=([^;]+)/);
    const storedState = match ? match[1] : null;

    if (!state || !storedState || state !== storedState) {
      return reply.redirect(`${env.FRONTEND_URL}/login?error=csrf_validation_failed`);
    }

    // Clear cookie
    reply.header('Set-Cookie', `oauth_state=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`);

    try {
      // Exchange code for token
      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code
        })
      });

      if (!tokenRes.ok) {
        return reply.redirect(`${env.FRONTEND_URL}/login?error=token_exchange_failed`);
      }

      const tokenData: any = await tokenRes.json();
      const accessToken = tokenData.access_token;

      if (!accessToken) {
        return reply.redirect(`${env.FRONTEND_URL}/login?error=token_missing`);
      }

      // Fetch user profile
      const userRes = await fetch('https://api.github.com/user', {
        headers: { 
          'Authorization': `Bearer ${accessToken}`,
          'User-Agent': 'Wavo-OAuth'
        }
      });

      if (!userRes.ok) {
        return reply.redirect(`${env.FRONTEND_URL}/login?error=user_fetch_failed`);
      }

      const userData: any = await userRes.json();
      const githubId = String(userData.id);
      const fullName = userData.name || userData.login || 'GitHub User';
      let email = userData.email;

      // GitHub public email might be null, fetch private emails if so
      if (!email) {
        const emailsRes = await fetch('https://api.github.com/user/emails', {
          headers: { 
            'Authorization': `Bearer ${accessToken}`,
            'User-Agent': 'Wavo-OAuth'
          }
        });

        if (emailsRes.ok) {
          const emails: any = await emailsRes.json();
          const primaryEmail = emails.find((e: any) => e.primary && e.verified);
          if (primaryEmail) {
            email = primaryEmail.email;
          }
        }
      }

      if (!email) {
        return reply.redirect(`${env.FRONTEND_URL}/login?error=email_missing`);
      }

      // Check user in database
      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { githubId, deletedAt: null },
            { email, deletedAt: null }
          ]
        }
      });

      if (user) {
        if (!user.isActive) {
          return reply.redirect(`${env.FRONTEND_URL}/login?suspended=true`);
        }
        
        // If found by email but githubId was not set
        if (!user.githubId) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { githubId }
          });
        }
      } else {
        // Create user
        user = await prisma.user.create({
          data: {
            email,
            fullName,
            githubId,
            role: UserRole.USER,
            plan: UserPlan.FREE,
            emailVerifiedAt: new Date()
          }
        });
      }

      // Generate temporary exchange token (valid for 1 minute)
      const exchangeToken = fastify.jwt.sign(
        { sub: user.id, purpose: 'oauth_exchange' },
        { expiresIn: '1m' }
      );

      return reply.redirect(`${env.FRONTEND_URL}/login/callback?code=${exchangeToken}`);

    } catch (err: any) {
      fastify.log.error(err);
      return reply.redirect(`${env.FRONTEND_URL}/login?error=internal_server_error`);
    }
  });

  // POST /auth/oauth/exchange
  fastify.post('/oauth/exchange', async (request: any, reply) => {
    const { code } = request.body;
    if (!code) return reply.status(400).send({ success: false, error: { message: 'Code is required' } });

    try {
      const decoded = fastify.jwt.verify(code) as any;
      if (decoded.purpose !== 'oauth_exchange') {
        throw new Error('Invalid purpose');
      }

      const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
      if (!user || !user.isActive) {
        return reply.status(401).send({ success: false, error: { message: 'Invalid or suspended user' } });
      }

      // Generate tokens
      const clientAccessToken = fastify.jwt.sign({
        sub: user.id,
        email: user.email,
        role: user.role,
        plan: user.plan
      });

      const tokenFamily = crypto.randomUUID();
      const clientRefreshToken = fastify.jwt.sign({
        sub: user.id,
        tokenFamily
      }, { expiresIn: '7d' });

      const hashedRefreshToken = crypto.createHash('sha256').update(clientRefreshToken).digest('hex');

      await prisma.session.create({
        data: {
          userId: user.id,
          refreshTokenHash: hashedRefreshToken,
          tokenFamily,
          userAgent: request.headers['user-agent'] || null,
          ipAddress: request.ip,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });

      return reply.send({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            plan: user.plan
          },
          accessToken: clientAccessToken,
          refreshToken: clientRefreshToken
        }
      });
    } catch (err) {
      return reply.status(401).send({ success: false, error: { message: 'Invalid or expired exchange token' } });
    }
  });

  // POST /auth/login/verify-2fa
  fastify.post('/login/verify-2fa', {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '5 minutes',
        errorResponseBuilder: (request, context) => ({
          success: false,
          error: {
            code: 'TOO_MANY_REQUESTS',
            message: `Too many 2FA verification attempts. Please try again in ${context.after}.`
          }
        })
      }
    }
  }, async (request, reply) => {
    const parse = verify2faSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid 2FA verification parameters',
          details: parse.error.format()
        }
      });
    }

    const { tempToken, code } = parse.data;

    let payload: any;
    try {
      payload = fastify.jwt.verify(tempToken);
    } catch (err) {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Verification session has expired. Please log in again.'
        }
      });
    }

    if (!payload.requires2FA || !payload.sub) {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid verification token'
        }
      });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User account is inactive or not found'
        }
      });
    }

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: '2FA is not enabled for this user'
        }
      });
    }

    const isValid = verifyTOTP(code, user.twoFactorSecret);
    if (!isValid) {
      return reply.status(401).send({
        success: false,
        error: {
          code: 'INVALID_OTP',
          message: 'The code you entered is invalid. Please try again.'
        }
      });
    }

    // Update login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Generate tokens
    const accessToken = fastify.jwt.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      plan: user.plan
    });

    const tokenFamily = crypto.randomUUID();
    const refreshToken = fastify.jwt.sign({
      sub: user.id,
      tokenFamily
    }, { expiresIn: '7d' });

    const hashedRefreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: hashedRefreshToken,
        tokenFamily,
        userAgent: request.headers['user-agent'] || null,
        ipAddress: request.ip,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    return reply.status(200).send({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          plan: user.plan
        },
        accessToken,
        refreshToken
      }
    });
  });

  // POST /auth/2fa/setup (Authenticated)
  fastify.post('/2fa/setup', { 
    preHandler: [fastify.authenticate as any],
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '5 minutes',
        errorResponseBuilder: (request, context) => ({
          success: false,
          error: {
            code: 'TOO_MANY_REQUESTS',
            message: `Too many 2FA setup attempts. Please try again in ${context.after}.`
          }
        })
      }
    }
  }, async (request: any, reply) => {
    const userId = request.user.sub;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found' }
      });
    }

    const secret = generateSecret();
    const uri = getOTPAuthURI(user.email, 'Wavo', secret);
    const qrCode = await generateQRCodeDataURI(uri);

    // Save secret temporarily in db (not enabled yet)
    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret }
    });

    return reply.status(200).send({
      success: true,
      data: {
        secret,
        qrCode
      }
    });
  });

  // POST /auth/2fa/enable (Authenticated)
  fastify.post('/2fa/enable', { 
    preHandler: [fastify.authenticate as any],
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '5 minutes',
        errorResponseBuilder: (request, context) => ({
          success: false,
          error: {
            code: 'TOO_MANY_REQUESTS',
            message: `Too many 2FA enable attempts. Please try again in ${context.after}.`
          }
        })
      }
    }
  }, async (request: any, reply) => {
    const parse = enable2faSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid parameters',
          details: parse.error.format()
        }
      });
    }

    const userId = request.user.sub;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) {
      return reply.status(400).send({
        success: false,
        error: { code: 'BAD_REQUEST', message: '2FA has not been setup yet.' }
      });
    }

    const { code } = parse.data;
    const isValid = verifyTOTP(code, user.twoFactorSecret);
    if (!isValid) {
      return reply.status(400).send({
        success: false,
        error: { code: 'INVALID_OTP', message: 'The code you entered is invalid. Please try again.' }
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true }
    });

    return reply.status(200).send({
      success: true,
      data: { message: 'Two-factor authentication enabled successfully.' }
    });
  });

  // POST /auth/2fa/disable (Authenticated)
  fastify.post('/2fa/disable', { 
    preHandler: [fastify.authenticate as any],
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '5 minutes',
        errorResponseBuilder: (request, context) => ({
          success: false,
          error: {
            code: 'TOO_MANY_REQUESTS',
            message: `Too many 2FA disable attempts. Please try again in ${context.after}.`
          }
        })
      }
    }
  }, async (request: any, reply) => {
    const parse = disable2faSchema.safeParse(request.body);
    if (!parse.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid parameters',
          details: parse.error.format()
        }
      });
    }

    const userId = request.user.sub;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'User not found.' }
      });
    }

    const { password } = parse.data;
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return reply.status(401).send({
        success: false,
        error: { code: 'INVALID_PASSWORD', message: 'The password you entered is incorrect.' }
      });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null
      }
    });

    return reply.status(200).send({
      success: true,
      data: { message: 'Two-factor authentication disabled successfully.' }
    });
  });
};
