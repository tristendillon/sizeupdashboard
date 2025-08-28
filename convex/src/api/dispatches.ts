// convex/recipes.ts
import { partial } from 'convex-helpers/validators'
import { mutation } from './_generated/server'
import { query } from './_generated/server'
import {
  type DispatchType,
  type DispatchWithType,
  DispatchesTable,
} from './schema'
import { paginationOptsValidator } from 'convex/server'
import { v } from 'convex/values'
import { api } from './_generated/api'
import { TransformationEngine } from '../lib/transformations'

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

export const getDispatchTypes = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('dispatchTypes').collect()
  },
})

export const createDispatches = mutation({
  args: {
    dispatches: v.array(v.object(DispatchesTable.withoutSystemFields)),
  },
  handler: async (ctx, { dispatches }) => {
    for (const dispatch of dispatches) {
      await ctx.db.insert('dispatches', dispatch)
    }
    return dispatches
  },
})

const fireDescriptors = ['fire', 'burn', 'smoke', 'explosion', 'bomb']

function getAlertIconType(input: string): 'fire' | 'medical' {
  const descriptor = input.toLowerCase()
  if (fireDescriptors.some((desc) => descriptor.includes(desc))) {
    return 'fire'
  }
  return 'medical'
}

function getAlertIconPath(dispatchType: DispatchType | string) {
  if (typeof dispatchType === 'string') {
    const fallbackType = getAlertIconType(dispatchType)
    return `/icons/incidents/${fallbackType}.png`
  }
  return `/icons/incidents/${dispatchType.group}.png`
}

function removeDispatchType(dispatch: DispatchWithType) {
  const { dispatchType, ...rest } = dispatch
  return {
    ...rest,
  }
}

export const getDispatches = query({
  args: {
    paginationOpts: paginationOptsValidator,
    viewToken: v.optional(v.id('viewTokens')),
    convexSessionToken: v.optional(v.string()),
  },
  handler: async (ctx, { paginationOpts, viewToken, convexSessionToken }) => {
    const paginationResult = await ctx.db
      .query('dispatches')
      .withIndex('by_dispatchCreatedAt')
      .order('desc')
      .paginate(paginationOpts)
    const dispatchesWithType = await Promise.all(
      paginationResult.page.map(async (dispatch) => {
        if (!dispatch.dispatchType) {
          return { ...dispatch, dispatchType: undefined }
        }
        const dispatchType = await ctx.db.get(dispatch.dispatchType)
        return { ...dispatch, dispatchType: dispatchType ?? undefined }
      })
    )

    let page: DispatchWithType[] = dispatchesWithType.map((dispatch) => ({
      ...dispatch,
      icon: getAlertIconPath(dispatch.dispatchType?.group ?? 'other'),
    }))
    if (convexSessionToken) {
      const isAuthenticated = await ctx.runQuery(
        api.auth.getAuthenticatedSession,
        {
          convexSessionToken,
        }
      )
      if (isAuthenticated) {
        return {
          ...paginationResult,
          page: page.map(removeDispatchType),
        }
      }
    }

    const view = viewToken ? await ctx.db.get(viewToken) : null
    if (view) {
      return {
        ...paginationResult,
        page: page.map(removeDispatchType),
      }
    }

    // Use new transformation system first, fallback to legacy if no transformation rules exist
    const transformationRules = await ctx.db
      .query('transformationRules')
      .collect()

    if (transformationRules.length > 0) {
      page = await TransformationEngine.transformDispatches(page, ctx)
    }

    return {
      ...paginationResult,
      page: page.map(removeDispatchType),
    }
  },
})
export const getLastDispatchData = query({
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

export const updateDispatch = mutation({
  args: {
    id: v.id('dispatches'),
    diff: v.object(partial(DispatchesTable.withoutSystemFields)),
  },
  handler: async (ctx, { id, diff }) => {
    return await ctx.db.patch(id, diff)
  },
})
