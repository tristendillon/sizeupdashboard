// convex/recipes.ts
import { mutation } from '../lib/mutation'
import { query } from './_generated/server'
import { Dispatches } from './schema'
import { paginationOptsValidator } from 'convex/server'
import { v } from 'convex/values'

export const clearDispatches = mutation({
  args: {},
  handler: async (ctx) => {
    const numItems = 1000
    let count = 0
    while (true) {
      const queried = await ctx.db
        .query('dispatches')
        .withIndex('by_dispatchCreatedAt')
        .order('desc')
        .take(numItems)

      for (const dispatch of queried) {
        await ctx.db.delete(dispatch._id)
      }
      count += queried.length
      if (queried.length < numItems) {
        break
      }
    }

    return count
  },
})

export const createDispatchs = mutation({
  args: {
    dispatches: v.array(v.object(Dispatches.withoutSystemFields)),
  },
  handler: async (ctx, { dispatches }) => {
    return await ctx.db.insertMany('dispatches', dispatches)
  },
})

export const createDispatch = mutation({
  args: Dispatches.withoutSystemFields,
  handler: async (ctx, args) => {
    // Upsert the dispatch by the dispatchId (firstdue's id)
    return await ctx.db.upsertByCustomId('dispatches', args, 'dispatchId')
  },
})

export const getDispatches = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, { paginationOpts }) => {
    return await ctx.db
      .query('dispatches')
      .withIndex('by_dispatchCreatedAt')
      .order('desc')
      .paginate(paginationOpts)
  },
})

export const getLastDispatchTime = query({
  args: {},
  handler: async (ctx) => {
    const lastDispatch = await ctx.db
      .query('dispatches')
      .withIndex('by_dispatchCreatedAt')
      .order('desc')
      .first()
    if (!lastDispatch) {
      return 0
    }
    return lastDispatch.dispatchCreatedAt
  },
})
