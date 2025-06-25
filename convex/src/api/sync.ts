import { v } from 'convex/values'
import { query } from './_generated/server'
import { mutation } from '../lib/mutation'

export const setLastDispatchSync = mutation({
  args: {
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const existingSyncInfo = await ctx.db.query('syncInfo').first()
    if (existingSyncInfo) {
      return await ctx.db.upsert('syncInfo', {
        ...existingSyncInfo,
        dispatchLastSync: args.date,
      })
    }
    return await ctx.db.insert('syncInfo', {
      dispatchLastSync: args.date,
      weatherLastSync: '',
      hydrantLastSync: '',
    })
  },
})

export const setLastWeatherSync = mutation({
  args: {
    date: v.string(),
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
      dispatchLastSync: '',
      weatherLastSync: args.date,
      hydrantLastSync: '',
    })
  },
})

export const setLastHydrantSync = mutation({
  args: {
    date: v.string(),
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
      dispatchLastSync: '',
      weatherLastSync: '',
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
