// convex/recipes.ts
import { partial } from 'convex-helpers/validators'
import { mutation } from '../lib/mutation'
import { query } from './_generated/server'
import { Dispatches } from './schema'
import { paginationOptsValidator } from 'convex/server'
import { v } from 'convex/values'

export const paginatedClearDispatches = mutation({
  args: {
    numItems: v.number(),
  },
  handler: async (ctx, { numItems }) => {
    const dispatches = await ctx.db
      .query('dispatches')
      .withIndex('by_dispatchCreatedAt')
      .order('desc')
      .take(numItems)
    for (const dispatch of dispatches) {
      await ctx.db.delete(dispatch._id)
    }
    if (dispatches.length < numItems) {
      return false
    }
    return true
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

export const updateDispatch = mutation({
  args: {
    id: v.id('dispatches'),
    diff: v.object(partial(Dispatches.withoutSystemFields)),
  },
  handler: async (ctx, { id, diff }) => {
    return await ctx.db.patch(id, diff)
  },
})

export const getLastDispatchData = query({
  args: {},
  handler: async (ctx) => {
    const lastDispatch = await ctx.db
      .query('dispatches')
      .withIndex('by_dispatchCreatedAt')
      .order('desc')
      .first()
    if (!lastDispatch) {
      return null
    }
    return lastDispatch
  },
})

export const getRecentDispatch = query({
  args: {
    since: v.number(),
  },
  handler: async (ctx, { since }) => {
    const sinceDate = new Date(Date.now() - since)
    const dispatch = await ctx.db
      .query('dispatches')
      .withIndex('by_dispatchCreatedAt', (q) =>
        q.gte('dispatchCreatedAt', sinceDate.getTime())
      )
      .order('desc')
      .first()
    if (!dispatch) {
      return {
        dispatch: null,
      }
    }
    return {
      dispatch,
    }
  },
})
