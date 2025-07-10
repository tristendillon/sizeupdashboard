// convex/recipes.ts
import { partial } from 'convex-helpers/validators'
import { mutation } from '../lib/mutation'
import { type QueryCtx, query } from './_generated/server'
import { Dispatches } from './schema'
import { paginationOptsValidator } from 'convex/server'
import { v } from 'convex/values'
import { type Doc } from './_generated/dataModel'
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

type RedactionLevelWithPriority = Omit<Doc<'redactionLevels'>, 'priority'> & {
  priority: Doc<'priorityLevels'>
}

async function getRedactionLevelForDispatch(
  dispatch: Doc<'dispatches'>,
  ctx: QueryCtx,
  redactionLevelsWithPriority: RedactionLevelWithPriority[]
) {
  const dispatchType = dispatch.dispatchType
    ? await ctx.db.get(dispatch.dispatchType)
    : null
  const sortedRedactionLevels = redactionLevelsWithPriority.sort(
    (a, b) => a.priority.priority - b.priority.priority
  )
  const type = dispatch.type.toLowerCase()

  const redactionLevels = sortedRedactionLevels.filter((level) => {
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
  dispatch: Doc<'dispatches'>,
  ctx: QueryCtx,
  redactionLevels: RedactionLevelWithPriority[]
) {
  const fieldsToRedact = redactionLevels.flatMap(
    (level) => level.redactionFields as (keyof Doc<'dispatches'>)[]
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
        redactedDispatch.message = null
        break
      case 'address2':
        redactedDispatch.address2 = null
        break
      case 'city':
        redactedDispatch.city = null
        break
      case 'stateCode':
        redactedDispatch.stateCode = null
        break
      case 'statusCode':
        redactedDispatch.statusCode = null
        break
      case 'xrefId':
        redactedDispatch.xrefId = null
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
async function redactDispatches(
  dispatches: Doc<'dispatches'>[],
  ctx: QueryCtx
) {
  const redactionLevels = await ctx.db.query('redactionLevels').collect()
  const redactionLevelsWithPriority = await Promise.all(
    redactionLevels.map(async (level) => ({
      ...level,
      priority: (await ctx.db.get(level.priority))!,
    }))
  )
  return await Promise.all(
    dispatches.map(async (dispatch) => {
      const redactionLevels = await getRedactionLevelForDispatch(
        dispatch,
        ctx,
        redactionLevelsWithPriority
      )
      if (!redactionLevels.length) {
        return dispatch
      }
      return redactDispatch(dispatch, ctx, redactionLevels)
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
    const dispatches = await ctx.db
      .query('dispatches')
      .withIndex('by_dispatchCreatedAt')
      .order('desc')
      .paginate(paginationOpts)

    if (convexSessionToken) {
      const isAuthenticated = await ctx.runQuery(
        api.auth.getAuthenticatedSession,
        {
          convexSessionToken,
        }
      )
      if (isAuthenticated) {
        return dispatches
      }
    }

    const view = viewToken ? await ctx.db.get(viewToken) : null
    if (view) {
      return dispatches
    }
    const newPage = await redactDispatches(dispatches.page, ctx)
    return {
      ...dispatches,
      page: newPage,
    }
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

export const updateDispatch = mutation({
  args: {
    id: v.id('dispatches'),
    diff: v.object(partial(Dispatches.withoutSystemFields)),
  },
  handler: async (ctx, { id, diff }) => {
    return await ctx.db.patch(id, diff)
  },
})
