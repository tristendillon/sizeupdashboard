import { v } from 'convex/values'
import { Hydrants } from './schema'
import { query } from './_generated/server'
import { authedOrThrowMutation } from '../lib/auth'
import { geospatial } from '.'
import type { Id } from './_generated/dataModel'
import type { Point } from '@convex-dev/geospatial'

export const paginatedCreateHydrants = authedOrThrowMutation({
  args: {
    hydrants: v.array(
      v.object({
        ...Hydrants.withoutSystemFields,
        latitude: v.number(),
        longitude: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    if (args.hydrants.length > 100) {
      throw new Error('Cannot create more than 100 hydrants at once')
    }
    const newHydrants: any[] = []
    await Promise.all(
      args.hydrants.map(async ({ latitude, longitude, ...hydrant }) => {
        const id = await ctx.db.insert('hydrants', hydrant)
        await geospatial.insert(ctx, id, { latitude, longitude }, {})
        return { ...hydrant, _id: id }
      })
    )
    return newHydrants
  },
})

export const paginatedDeleteHydrants = authedOrThrowMutation({
  args: {
    cursor: v.union(v.string(), v.null()),
  },
  handler: async (ctx, args) => {
    const hydrants = await ctx.db.query('hydrants').paginate({
      numItems: 100,
      cursor: args.cursor,
    })
    for (const hydrant of hydrants.page) {
      await ctx.db.delete(hydrant._id)
    }
    await Promise.all(
      hydrants.page.map((hydrant) => {
        geospatial.remove(ctx, hydrant._id)
      })
    )
    return hydrants.continueCursor
  },
})

export const createHydrants = authedOrThrowMutation({
  args: {
    hydrants: v.array(
      v.object({
        ...Hydrants.withoutSystemFields,
        latitude: v.number(),
        longitude: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const newHydrants: any[] = []

    const operations: Promise<any>[] = []

    for (const { latitude, longitude, ...hydrant } of args.hydrants) {
      const insertPromise = (async () => {
        const id = await ctx.db.insert('hydrants', hydrant)
        await geospatial.insert(ctx, id, { latitude, longitude }, {})
        return { ...hydrant, _id: id }
      })()

      operations.push(insertPromise.then((res) => newHydrants.push(res)))
    }

    await Promise.all(operations)

    return newHydrants
  },
})

export const getHydrants = query({
  handler: async (ctx) => {
    const hydrants = await ctx.db.query('hydrants').collect()
    return hydrants
  },
})
export const getHydrantsByBounds = query({
  args: {
    topLeft: v.object({
      latitude: v.number(),
      longitude: v.number(),
    }),
    bottomRight: v.object({
      latitude: v.number(),
      longitude: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const { topLeft, bottomRight } = args

    const rectangle = {
      west: topLeft.longitude,
      south: topLeft.latitude,
      east: bottomRight.longitude,
      north: bottomRight.latitude,
    }
    const ids: { key: Id<'hydrants'>; coordinates: Point }[] = []
    const result = await geospatial.query(ctx, {
      shape: { type: 'rectangle', rectangle },
      limit: 32,
    })
    let nextCursor: string | undefined = result.nextCursor

    ids.push(...result.results)
    while (nextCursor) {
      const nextResult = await geospatial.query(
        ctx,
        {
          shape: { type: 'rectangle', rectangle },
          limit: 32,
        },
        result.nextCursor
      )
      nextCursor = nextResult.nextCursor
      ids.push(...nextResult.results)
    }
    return await Promise.all(
      ids.map(async (id) => ({
        ...(await ctx.db.get(id.key)),
        location: id.coordinates,
      }))
    )
  },
})
