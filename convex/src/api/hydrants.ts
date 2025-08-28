import { v } from 'convex/values'
import { Hydrants } from './schema'
import { query } from './_generated/server'
import { authedOrThrowMutation } from '../lib/auth'

export const createHydrants = authedOrThrowMutation({
  args: {
    hydrants: v.array(v.object(Hydrants.withoutSystemFields)),
  },
  handler: async (ctx, args) => {
    const existingHydrants = await ctx.db.query('hydrants').collect()
    const existingHydrantsMap = new Map(
      existingHydrants.map((hydrant) => [hydrant.hydrantId, hydrant])
    )
    const newHydrants = []
    for (const hydrant of args.hydrants) {
      if (existingHydrantsMap.has(hydrant.hydrantId)) {
        const existingHydrant = existingHydrantsMap.get(hydrant.hydrantId)!
        await ctx.db.patch(existingHydrant._id, {
          ...hydrant,
        })
        newHydrants.push({
          ...hydrant,
          _id: existingHydrant._id,
        })
        existingHydrantsMap.delete(hydrant.hydrantId)
      } else {
        const id = await ctx.db.insert('hydrants', hydrant)
        newHydrants.push({
          ...hydrant,
          _id: id,
        })
      }
    }
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
    const hydrants = await ctx.db.query('hydrants').collect()
    const filteredHydrants = hydrants.filter((hydrant) => {
      const minLat = Math.min(topLeft.latitude, bottomRight.latitude)
      const maxLat = Math.max(topLeft.latitude, bottomRight.latitude)
      const minLng = Math.min(topLeft.longitude, bottomRight.longitude)
      const maxLng = Math.max(topLeft.longitude, bottomRight.longitude)

      const latInBounds =
        hydrant.latitude >= minLat && hydrant.latitude <= maxLat
      const longInBounds =
        hydrant.longitude >= minLng && hydrant.longitude <= maxLng

      return latInBounds && longInBounds
    })
    return filteredHydrants
  },
})
