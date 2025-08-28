import { v } from 'convex/values'
import { FieldTransformations, TransformationRules } from './schema'
import { authedOrThrowMutation, authedOrThrowQuery } from '../lib/auth'

// Field Transformations CRUD

export const createFieldTransformation = authedOrThrowMutation({
  args: FieldTransformations.withoutSystemFields,
  handler: async (ctx, args) => {
    return await ctx.db.insert('fieldTransformations', args)
  },
})

export const updateFieldTransformation = authedOrThrowMutation({
  args: {
    id: v.id('fieldTransformations'),
    ...FieldTransformations.withoutSystemFields,
  },
  handler: async (ctx, { id, ...updates }) => {
    return await ctx.db.patch(id, updates)
  },
})

export const deleteFieldTransformation = authedOrThrowMutation({
  args: { id: v.id('fieldTransformations') },
  handler: async (ctx, { id }) => {
    // Check if any transformation rules are using this transformation via mapping table
    const mappings = await ctx.db
      .query('transformationRuleMappings')
      .withIndex('by_transformation', (q) => q.eq('transformationId', id))
      .collect()

    if (mappings.length > 0) {
      throw new Error(
        `Cannot delete transformation: used by ${mappings.length} rule(s)`
      )
    }

    return await ctx.db.delete(id)
  },
})

export const getFieldTransformations = authedOrThrowQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('fieldTransformations').collect()
  },
})

export const getFieldTransformationsByStrategy = authedOrThrowQuery({
  args: {
    strategy: v.union(
      v.literal('static_value'),
      v.literal('random_offset'),
      v.literal('random_string'),
      v.literal('merge_data')
    ),
  },
  handler: async (ctx, { strategy }) => {
    return await ctx.db
      .query('fieldTransformations')
      .withIndex('by_strategy', (q) => q.eq('strategy', strategy))
      .collect()
  },
})

export const getFieldTransformationsByField = authedOrThrowQuery({
  args: {
    field: v.string(),
  },
  handler: async (ctx, { field }) => {
    return await ctx.db
      .query('fieldTransformations')
      .withIndex('by_field', (q) => q.eq('field', field))
      .collect()
  },
})

// Transformation Rules CRUD

export const createTransformationRule = authedOrThrowMutation({
  args: TransformationRules.withoutSystemFields,
  handler: async (ctx, args) => {
    // Validate that all referenced transformations exist
    const transformationIds = args.transformations
    const transformations = await Promise.all(
      transformationIds.map((id) => ctx.db.get(id))
    )

    const missingIds = transformationIds.filter(
      (id, index) => !transformations[index]
    )
    if (missingIds.length > 0) {
      throw new Error(
        `Referenced transformations not found: ${missingIds.join(', ')}`
      )
    }

    const ruleId = await ctx.db.insert('transformationRules', args)

    // Create mapping entries for efficient lookups
    await Promise.all(
      transformationIds.map((transformationId) =>
        ctx.db.insert('transformationRuleMappings', {
          transformationId,
          ruleId,
        })
      )
    )

    return ruleId
  },
})

export const updateTransformationRule = authedOrThrowMutation({
  args: {
    id: v.id('transformationRules'),
    ...TransformationRules.withoutSystemFields,
  },
  handler: async (ctx, { id, ...updates }) => {
    // Validate that all referenced transformations exist
    if (updates.transformations) {
      const transformationIds = updates.transformations
      const transformations = await Promise.all(
        transformationIds.map((transformationId) =>
          ctx.db.get(transformationId)
        )
      )

      const missingIds = transformationIds.filter(
        (transformationId, index) => !transformations[index]
      )
      if (missingIds.length > 0) {
        throw new Error(
          `Referenced transformations not found: ${missingIds.join(', ')}`
        )
      }

      // Update mapping table if transformations changed
      // First, remove all existing mappings for this rule
      const existingMappings = await ctx.db
        .query('transformationRuleMappings')
        .withIndex('by_rule', (q) => q.eq('ruleId', id))
        .collect()

      await Promise.all(
        existingMappings.map((mapping) => ctx.db.delete(mapping._id))
      )

      // Then create new mappings
      await Promise.all(
        transformationIds.map((transformationId) =>
          ctx.db.insert('transformationRuleMappings', {
            transformationId,
            ruleId: id,
          })
        )
      )
    }

    return await ctx.db.patch(id, updates)
  },
})

export const deleteTransformationRule = authedOrThrowMutation({
  args: { id: v.id('transformationRules') },
  handler: async (ctx, { id }) => {
    // Clean up mapping entries
    const mappings = await ctx.db
      .query('transformationRuleMappings')
      .withIndex('by_rule', (q) => q.eq('ruleId', id))
      .collect()

    await Promise.all(mappings.map((mapping) => ctx.db.delete(mapping._id)))

    return await ctx.db.delete(id)
  },
})

export const getTransformationRules = authedOrThrowQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('transformationRules').collect()
  },
})

export const getTransformationRuleByName = authedOrThrowQuery({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    return await ctx.db
      .query('transformationRules')
      .withIndex('by_name', (q) => q.eq('name', name))
      .first()
  },
})

// Bulk operations

export const createMultipleFieldTransformations = authedOrThrowMutation({
  args: {
    transformations: v.array(
      v.object(FieldTransformations.withoutSystemFields)
    ),
  },
  handler: async (ctx, { transformations }) => {
    const results = []
    for (const transformation of transformations) {
      const id = await ctx.db.insert('fieldTransformations', transformation)
      results.push({ id, ...transformation })
    }
    return results
  },
})

export const duplicateTransformationRule = authedOrThrowMutation({
  args: {
    sourceId: v.id('transformationRules'),
    newName: v.string(),
  },
  handler: async (ctx, { sourceId, newName }) => {
    const sourceRule = await ctx.db.get(sourceId)
    if (!sourceRule) {
      throw new Error('Source transformation rule not found')
    }

    // Check if name already exists
    const existing = await ctx.db
      .query('transformationRules')
      .withIndex('by_name', (q) => q.eq('name', newName))
      .first()

    if (existing) {
      throw new Error(
        `Transformation rule with name '${newName}' already exists`
      )
    }

    const newRule = {
      ...sourceRule,
      name: newName,
    }
    delete (newRule as any)._id
    delete (newRule as any)._creationTime

    return await ctx.db.insert('transformationRules', newRule)
  },
})

// Utility queries

export const getTransformationRuleWithTransformations = authedOrThrowQuery({
  args: {
    ruleId: v.id('transformationRules'),
  },
  handler: async (ctx, { ruleId }) => {
    const rule = await ctx.db.get(ruleId)
    if (!rule) return null

    const transformations = await Promise.all(
      rule.transformations.map((id) => ctx.db.get(id))
    )

    return {
      ...rule,
      transformationDetails: transformations.filter(Boolean),
    }
  },
})

export const getFieldTransformationUsage = authedOrThrowQuery({
  args: {
    transformationId: v.id('fieldTransformations'),
  },
  handler: async (ctx, { transformationId }) => {
    // Use the efficient mapping table lookup
    const mappings = await ctx.db
      .query('transformationRuleMappings')
      .withIndex('by_transformation', (q) =>
        q.eq('transformationId', transformationId)
      )
      .collect()

    const rules = await Promise.all(
      mappings.map((mapping) => ctx.db.get(mapping.ruleId))
    )

    const validRules = rules.filter(Boolean)

    return {
      transformationId,
      usedByRules: validRules.map((rule) => ({
        id: rule!._id,
        name: rule!.name,
      })),
      usageCount: validRules.length,
    }
  },
})

export const getRulesByTransformationId = authedOrThrowQuery({
  args: {
    transformationId: v.id('fieldTransformations'),
  },
  handler: async (ctx, { transformationId }) => {
    const mappings = await ctx.db
      .query('transformationRuleMappings')
      .withIndex('by_transformation', (q) =>
        q.eq('transformationId', transformationId)
      )
      .collect()

    const rules = await Promise.all(
      mappings.map((mapping) => ctx.db.get(mapping.ruleId))
    )

    return rules.filter(Boolean)
  },
})
