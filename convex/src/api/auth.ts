import { v } from 'convex/values'
import {
  internalQuery,
  internalMutation,
  action,
  query,
} from './_generated/server'
import { internal } from './_generated/api'
import { type Doc } from './_generated/dataModel'
import bcrypt from 'bcryptjs'

export const getSessionFromToken = internalQuery({
  args: {
    convexSessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('userSessions')
      .withIndex('by_token', (q) => q.eq('token', args.convexSessionToken))
      .first()
  },
})

export const deleteSession = internalMutation({
  args: {
    sessionId: v.id('userSessions'),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.sessionId)
  },
})

export const getAuthenticatedSession = query({
  args: {
    convexSessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    console.log('getAuthenticatedSession', args.convexSessionToken)
    const session = await ctx.runQuery(internal.auth.getSessionFromToken, {
      convexSessionToken: args.convexSessionToken,
    })
    console.log('session', session)
    if (session === null) {
      return false
    }
    if (session.expiresAt < Date.now()) {
      return false
    }
    return true
  },
})

export const isAuthenticated = action({
  args: {
    convexSessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.runQuery(internal.auth.getSessionFromToken, {
      convexSessionToken: args.convexSessionToken,
    })
    if (session === null) {
      return false
    }
    if (session.expiresAt < Date.now()) {
      await ctx.runMutation(internal.auth.deleteSession, {
        sessionId: session._id,
      })
      return false
    }
    return true
  },
})

export const getRefreshToken = internalQuery({
  args: {
    refreshToken: v.string(),
  },
  handler: async (ctx, args) => {
    const refreshToken = await ctx.db
      .query('refreshTokens')
      .withIndex('by_token', (q) => q.eq('token', args.refreshToken))
      .first()
    return refreshToken
  },
})

export const getRefreshTokenByUserId = internalQuery({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const refreshToken = await ctx.db
      .query('refreshTokens')
      .withIndex('by_userId', (q) => q.eq('userId', args.userId))
      .first()
    return refreshToken
  },
})

export const deleteRefreshToken = internalMutation({
  args: {
    refreshTokenId: v.id('refreshTokens'),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.refreshTokenId)
  },
})

export const createSessionAndRefresh = internalMutation({
  args: {
    userId: v.id('users'),
  },
  returns: v.object({
    sessionToken: v.string(),
    refreshToken: v.string(),
  }),
  handler: async (ctx, args) => {
    const newSessionToken = crypto.randomUUID()
    const newRefreshToken = crypto.randomUUID()

    const existingSession = await ctx.db
      .query('userSessions')
      .withIndex('by_userId', (q) => q.eq('userId', args.userId))
      .first()
    if (existingSession) {
      await ctx.db.delete(existingSession._id)
    }
    const existingRefreshToken = await ctx.db
      .query('refreshTokens')
      .withIndex('by_userId', (q) => q.eq('userId', args.userId))
      .first()
    if (existingRefreshToken) {
      await ctx.db.delete(existingRefreshToken._id)
    }

    await ctx.db.insert('userSessions', {
      userId: args.userId,
      token: newSessionToken,
      expiresAt: Date.now() + 1000 * 60 * 15, // 15 min
    })

    await ctx.db.insert('refreshTokens', {
      userId: args.userId,
      token: newRefreshToken,
      expiresAt: Date.now() + 1000 * 60 * 60 * 24 * 14, // 14 days
    })

    return {
      sessionToken: newSessionToken as string,
      refreshToken: newRefreshToken as string,
    }
  },
})

export const refreshSession = action({
  args: {
    refreshToken: v.string(),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ sessionToken: string; refreshToken: string }> => {
    const token = await ctx.runQuery(internal.auth.getRefreshToken, {
      refreshToken: args.refreshToken,
    })

    if (!token) {
      throw new Error('Invalid refresh token')
    }

    if (token.expiresAt < Date.now()) {
      await ctx.runMutation(internal.auth.deleteRefreshToken, {
        refreshTokenId: token._id,
      })
      throw new Error('Refresh token expired')
    }

    await ctx.runMutation(internal.auth.deleteRefreshToken, {
      refreshTokenId: token._id,
    })

    const newTokens = await ctx.runMutation(
      internal.auth.createSessionAndRefresh,
      {
        userId: token.userId,
      }
    )

    return newTokens
  },
})

type LoginResponse = {
  success: boolean
  error?: string
  user?: Doc<'users'> & {
    sessionToken: string
    refreshToken: string
  }
}

export const login = action({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, { email, password }): Promise<LoginResponse> => {
    const user = await ctx.runQuery(internal.users.getUserByEmail, {
      email,
    })
    if (!user) {
      return { success: false, error: 'User not found' }
    }
    const identity = await ctx.runQuery(internal.users.getUserIdentityByEmail, {
      email,
    })
    if (!identity) {
      return { success: false, error: 'User Identity not found' }
    }
    const isPasswordValid = await bcrypt.compare(
      password,
      identity.hashedPassword
    )
    if (!isPasswordValid) {
      return { success: false, error: 'Invalid password' }
    }
    const { sessionToken, refreshToken } = await ctx.runMutation(
      internal.auth.createSessionAndRefresh,
      {
        userId: user._id,
      }
    )
    return { success: true, user: { ...user, sessionToken, refreshToken } }
  },
})

export const logout = action({
  args: {
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.runQuery(internal.auth.getSessionFromToken, {
      convexSessionToken: args.sessionId,
    })
    if (!session) {
      return { success: false, error: 'Session not found' }
    }
    const refreshToken = await ctx.runQuery(
      internal.auth.getRefreshTokenByUserId,
      {
        userId: session.userId,
      }
    )
    if (refreshToken) {
      await ctx.runMutation(internal.auth.deleteRefreshToken, {
        refreshTokenId: refreshToken._id,
      })
    }
    await ctx.runMutation(internal.auth.deleteSession, {
      sessionId: session._id,
    })
    return { success: true }
  },
})
