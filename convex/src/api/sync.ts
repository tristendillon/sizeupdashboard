import { v } from 'convex/values'
import { query } from './_generated/server'
import { mutation } from '../lib/mutation'

export const setLastWeatherSync = mutation({
  args: {
    date: v.number(),
  },
  handler: async (ctx, args) => {
    const existingSyncInfo = await ctx.db.query('syncInfo').first()
    if (existingSyncInfo) {
      return await ctx.db.upsert('syncInfo', {
        ...existingSyncInfo,
        weatherLastSync: args.date,
      })
    }
    return await ctx.db.insert('syncInfo', {
      weatherLastSync: args.date,
      hydrantLastSync: 0,
    })
  },
})

export const setLastHydrantSync = mutation({
  args: {
    date: v.number(),
  },
  handler: async (ctx, args) => {
    const existingSyncInfo = await ctx.db.query('syncInfo').first()
    if (existingSyncInfo) {
      return await ctx.db.upsert('syncInfo', {
        ...existingSyncInfo,
        hydrantLastSync: args.date,
      })
    }
    return await ctx.db.insert('syncInfo', {
      weatherLastSync: 0,
      hydrantLastSync: args.date,
    })
  },
})

export const getSyncInfo = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('syncInfo').first()
  },
})
