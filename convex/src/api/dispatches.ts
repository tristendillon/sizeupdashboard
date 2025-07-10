// convex/recipes.ts
import { partial } from 'convex-helpers/validators'
import { mutation } from '../lib/mutation'
import { type QueryCtx, query } from './_generated/server'
import {
  type DispatchWithType,
  DispatchesTable,
  type RedactionLevel,
} from './schema'
import { paginationOptsValidator } from 'convex/server'
import { v } from 'convex/values'
import { api } from './_generated/api'

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

export const createDispatchs = mutation({
  args: {
    dispatches: v.array(v.object(DispatchesTable.withoutSystemFields)),
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

async function getRedactionLevelForDispatch(
  dispatch: DispatchWithType,
  ctx: QueryCtx,
  allRedactionLevels: RedactionLevel[]
) {
  const dispatchType = dispatch.dispatchType
    ? await ctx.db.get(dispatch.dispatchType._id)
    : null
  const type = dispatch.type.toLowerCase()

  const redactionLevels = allRedactionLevels.filter((level) => {
    if (dispatchType && level.dispatchTypes.includes(dispatchType._id)) {
      return true
    }
    if (level.dispatchTypeRegex && type.match(level.dispatchTypeRegex)) {
      return true
    }
    level.keywords.forEach((keyword) => {
      if (type.includes(keyword)) {
        return true
      }
    })
    return false
  })
  return redactionLevels
}

async function redactDispatch(
  dispatch: DispatchWithType,
  redactionLevels: RedactionLevel[]
) {
  const fieldsToRedact = redactionLevels.flatMap(
    (level) => level.redactionFields as (keyof DispatchWithType)[]
  )
  const redactedDispatch = { ...dispatch }

  // Apply redaction to specified fields
  fieldsToRedact.forEach((fieldName) => {
    switch (fieldName) {
      // Required fields - use "redacted" since they can't be undefined
      case 'address':
        redactedDispatch.address = 'REDACTED'
        break
      case 'unitCodes':
        redactedDispatch.unitCodes = []
        break

      // Optional fields - use undefined or null as appropriate
      case 'narrative':
        redactedDispatch.narrative = 'REDACTED'
        break
      case 'message':
        redactedDispatch.message = undefined
        break
      case 'address2':
        redactedDispatch.address2 = undefined
        break
      case 'city':
        redactedDispatch.city = undefined
        break
      case 'stateCode':
        redactedDispatch.stateCode = undefined
        break
      case 'statusCode':
        redactedDispatch.statusCode = undefined
        break
      case 'xrefId':
        redactedDispatch.xrefId = undefined
        break
    }
  })

  // Add random offset between -100m and +100m to lat/long
  const metersToDegreesLat = 1 / 111111 // ~1 meter in degrees latitude
  const metersToDegreesLng =
    1 / (111111 * Math.cos((redactedDispatch.location.lat * Math.PI) / 180))
  const randomOffsetLat = (Math.random() * 200 - 100) * metersToDegreesLat
  const randomOffsetLng = (Math.random() * 200 - 100) * metersToDegreesLng
  if (fieldsToRedact.includes('location')) {
    redactedDispatch.location.lat += randomOffsetLat
    redactedDispatch.location.lng += randomOffsetLng
  }

  return redactedDispatch
}
async function redactDispatches(dispatches: DispatchWithType[], ctx: QueryCtx) {
  const allRedactionLevels = await ctx.db.query('redactionLevels').collect()
  return await Promise.all(
    dispatches.map(async (dispatch) => {
      const redactionLevels = await getRedactionLevelForDispatch(
        dispatch,
        ctx,
        allRedactionLevels
      )
      if (!redactionLevels.length) {
        return dispatch
      }
      return redactDispatch(dispatch, redactionLevels)
    })
  )
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
          page: dispatchesWithType,
        }
      }
    }

    const view = viewToken ? await ctx.db.get(viewToken) : null
    if (view) {
      return {
        ...paginationResult,
        page: dispatchesWithType,
      }
    }
    const newPage = await redactDispatches(dispatchesWithType, ctx)
    return {
      ...paginationResult,
      page: newPage,
    }
  },
})

export const testDispatchQuery = query({
  args: {
    convexSessionToken: v.optional(v.string()),
  },
  handler: async (ctx, { convexSessionToken }) => {
    if (convexSessionToken) {
      const isAuthenticated = await ctx.runQuery(
        api.auth.getAuthenticatedSession,
        {
          convexSessionToken,
        }
      )
      if (isAuthenticated) {
        return await ctx.db.query('dispatches').take(10)
      }
    }
    return 'not authenticated'
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
