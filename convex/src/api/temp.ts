import { query } from './_generated/server'

export const getIncomingDispatch = query({
  args: {},
  handler: async (ctx) => {
    const dispatches = await ctx.db.query('incomingDispatches').collect()
    return dispatches.map((d) => {
      const { _id, _creationTime, ...dispatchData } = d
      return dispatchData
    })
  },
})
