import { customMutation } from 'convex-helpers/server/customFunctions'
import {
  mutation as convexMutation,
  MutationCtx,
} from '../api/_generated/server'
import { customCtx } from 'convex-helpers/server/customFunctions'
import { Doc, Id, TableNames } from '../api/_generated/dataModel'
import { WithoutSystemFields } from 'convex/server'

type UpsertData<T extends TableNames> = WithoutSystemFields<Doc<T>> & {
  _id?: Id<T>
}

const upsert = async <T extends TableNames>(
  ctx: MutationCtx,
  table: T,
  data: UpsertData<T>
) => {
  if (!data._id) {
    const result = await ctx.db.insert(table, data)
    return result
  }

  const existing = await ctx.db.get(data._id)
  if (existing) {
    await ctx.db.patch(existing._id, data as Doc<T>)
    return existing._id
  }
  const result = await ctx.db.insert(table, {
    ...data,
    _id: undefined,
  })
  return result
}

const upsertByCustomId = async <T extends TableNames>(
  ctx: MutationCtx,
  table: T,
  data: UpsertData<T>,
  customId: keyof WithoutSystemFields<Doc<T>>
) => {
  const existing = await ctx.db
    .query(table)
    .withIndex(`by_${String(customId)}`, (q) =>
      q.eq(String(customId), data[customId])
    )
    .first()

  if (existing) {
    return await upsert(ctx, table, {
      ...data,
      _id: existing._id,
    })
  }
  return await ctx.db.insert(table, data)
}

export const mutation = customMutation(
  convexMutation,
  customCtx(async (ctx) => ({
    db: {
      ...ctx.db,
      upsert: async <T extends TableNames>(table: T, data: UpsertData<T>) => {
        return await upsert(ctx, table, data)
      },
      upsertByCustomId: async <T extends TableNames>(
        table: T,
        data: UpsertData<T>,
        customId: keyof WithoutSystemFields<Doc<T>>
      ) => {
        return await upsertByCustomId(ctx, table, data, customId)
      },
      upsertManyByCustomId: async <T extends TableNames>(
        table: T,
        data: UpsertData<T>[],
        customId: keyof WithoutSystemFields<Doc<T>>
      ) => {
        return await Promise.all(
          data.map(async (item) => {
            return await upsertByCustomId(ctx, table, item, customId)
          })
        )
      },
      upsertMany: async <T extends TableNames>(
        table: T,
        data: UpsertData<T>[]
      ) => {
        const results = await Promise.all(
          data.map(async (item) => {
            return await upsert(ctx, table, item)
          })
        )
        return results
      },
      insertMany: async <T extends TableNames>(
        table: T,
        data: WithoutSystemFields<Doc<T>>[]
      ) => {
        const results = await Promise.all(
          data.map(async (item) => {
            const result = await ctx.db.insert(table, item)
            return result
          })
        )
        return results
      },
    },
  }))
)
