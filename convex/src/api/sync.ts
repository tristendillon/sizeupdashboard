import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const setLastDispatchSync = mutation({
  args: {
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const existingSyncInfo = await ctx.db.query('syncInfo').first()
    if (existingSyncInfo) {
      return await ctx.db.patch(existingSyncInfo._id, {
        dispatchLastSync: args.date,
      })
    }
    return await ctx.db.insert('syncInfo', {
      dispatchLastSync: args.date,
      weatherLastSync: '',
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
      return await ctx.db.patch(existingSyncInfo._id, {
        weatherLastSync: args.date,
      })
    }
    return await ctx.db.insert('syncInfo', {
      dispatchLastSync: '',
      weatherLastSync: args.date,
    })
  },
})

export const getSyncInfo = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('syncInfo').first()
  },
})
