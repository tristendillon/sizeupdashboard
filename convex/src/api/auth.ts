import { v } from 'convex/values'
import {
  mutation,
  internalQuery,
  internalMutation,
  action,
  query,
} from './_generated/server'
import { internal } from './_generated/api'

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
    const session = await ctx.runQuery(internal.auth.getSessionFromToken, {
      convexSessionToken: args.convexSessionToken,
    })
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
