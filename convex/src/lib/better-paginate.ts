import type { TableAggregate } from '@convex-dev/aggregate'
import type { QueryCtx } from '../api/_generated/server'
import type {
  NamedTableInfo,
  QueryInitializer,
  TableNamesInDataModel,
} from 'convex/server'
import type { DataModel } from '../api/_generated/dataModel'
import { v } from 'convex/values'
import z from 'zod'

export const BetterPaginateValidator = v.object({
  page: v.optional(v.number()),
  pageSize: v.optional(v.number()),
  order: v.optional(v.union(v.literal('asc'), v.literal('desc'))),
})

export const BetterPaginationSchema = z.object({
  page: z.number().default(1),
  pageSize: z.number().default(10),
  order: z.enum(['asc', 'desc']).default('desc'),
})

export const BetterPaginate = async <
  TableName extends TableNamesInDataModel<DataModel>,
>(
  ctx: QueryCtx,
  tableName: TableName,
  aggregate: TableAggregate<any>,
  options: {
    page?: number
    pageSize?: number
    order?: 'asc' | 'desc'
  }
) => {
  const { page, pageSize, order } = BetterPaginationSchema.parse(options)
  if (page < 1) {
    throw new Error('Page must be atleast 1')
  }
  if (pageSize < 1 || pageSize > 4095) {
    throw new Error('Page size must be between 1 and 4095 (inclusive)')
  }

  const total = await aggregate.count(ctx, {
    namespace: tableName,
  })
  const totalPages = Math.ceil(total / pageSize)

  if (page > totalPages && total > 0) {
    throw new Error(`Page ${page} exceeds total pages (${totalPages})`)
  }

  let cursorIdx = (page - 1) * pageSize
  if (order === 'desc') {
    cursorIdx = -1 * cursorIdx - 1
  }

  const cursorAggregate = await aggregate.at(ctx, cursorIdx, {
    namespace: tableName,
  })

  const paginated = await ctx.db
    .query(tableName)
    .withIndex('by_creation_time', (q) =>
      order === 'desc'
        ? q.lte('_creationTime', cursorAggregate.key)
        : q.gte('_creationTime', cursorAggregate.key)
    )
    .order(order)
    .take(pageSize)

  const hasNextPage = page < totalPages
  const hasPrevPage = page > 1

  return {
    data: paginated,
    pagination: {
      currentPage: page,
      pageSize: pageSize,
      totalItems: total,
      totalPages,
      nextPage: hasNextPage ? page + 1 : null,
      prevPage: hasPrevPage ? page - 1 : null,
    },
  }
}
