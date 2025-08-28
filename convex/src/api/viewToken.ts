import { v } from 'convex/values'
import { query } from './_generated/server'
import { authedOrThrowMutation } from '../lib/auth'

export const createViewToken = authedOrThrowMutation({
  args: {
    name: v.string(),
    // add convex session id
  },
  handler: async (ctx, { name }) => {
    const viewToken = await ctx.db.insert('viewTokens', {
      name,
      lastPing: Date.now(),
      token: crypto.randomUUID(),
    })
    return viewToken
  },
})

export const getViewToken = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, { token }) => {
    const viewToken = await ctx.db
      .query('viewTokens')
      .withIndex('by_token', (q) => q.eq('token', token))
      .first()
    return viewToken
  },
})
