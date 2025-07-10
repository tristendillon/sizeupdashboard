import { mutation } from '../lib/mutation'
import { DispatchTypesTable } from './schema'
import { v } from 'convex/values'

export const createDispatchType = mutation({
  args: {
    dispatchTypes: v.array(v.object(DispatchTypesTable.withoutSystemFields)),
  },
  handler: async (ctx, { dispatchTypes }) => {
    const createdDispatchTypes = []
    for (const dispatchType of dispatchTypes) {
      const created = await ctx.db.insert('dispatchTypes', dispatchType)
      createdDispatchTypes.push({
        ...dispatchType,
        _id: created,
      })
    }
    return createdDispatchTypes
  },
})
