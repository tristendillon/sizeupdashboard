import { v } from 'convex/values'
import { Hydrants } from './schema'
import { mutation } from '../lib/mutation'
import { query } from './_generated/server'

export const createHydrants = mutation({
  args: {
    hydrants: v.array(v.object(Hydrants.withoutSystemFields)),
  },
  handler: async (ctx, args) => {
    const { hydrants: hydrantsToUpsert } = args
    const hydrants = await ctx.db.upsertManyByCustomId(
      'hydrants',
      hydrantsToUpsert,
      'hydrantId'
    )
    return hydrants
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
    const hydrants = await ctx.db.query('hydrants').collect()
    const filteredHydrants = hydrants.filter((hydrant) => {
      const latInBounds =
        hydrant.latitude >= bottomRight.latitude &&
        hydrant.latitude <= topLeft.latitude
      const longInBounds =
        topLeft.longitude <= bottomRight.longitude
          ? hydrant.longitude >= topLeft.longitude &&
            hydrant.longitude <= bottomRight.longitude
          : hydrant.longitude >= topLeft.longitude ||
            hydrant.longitude <= bottomRight.longitude

      return latInBounds && longInBounds
    })
    return filteredHydrants
  },
})
