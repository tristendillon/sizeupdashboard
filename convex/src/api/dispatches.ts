// convex/recipes.ts
import { mutation } from '../lib/mutation'
import { query } from './_generated/server'
import { Dispatches } from './schema'
import { paginationOptsValidator } from 'convex/server'

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
