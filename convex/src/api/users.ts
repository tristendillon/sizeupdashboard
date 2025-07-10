import { v } from 'convex/values'
import {
  internalAction,
  internalMutation,
  internalQuery,
} from './_generated/server'
import bcrypt from 'bcryptjs'
import { omit } from 'convex-helpers'
import { Users } from './schema'

import { z } from 'zod'
import { internal } from './_generated/api'

const identitySchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export const createUserIdentity = internalMutation({
  args: {
    userId: v.id('users'),
    email: v.string(),
    hashedPassword: v.string(),
  },
  handler: async (ctx, { userId, email, hashedPassword }) => {
    await ctx.db.insert('userIdentities', {
      userId,
      email,
      hashedPassword,
    })
  },
})

export const createUser = internalMutation({
  args: Users.withoutSystemFields,
  handler: async (ctx, args) => {
    const userId = await ctx.db.insert('users', args)
    return userId
  },
})

export const registerUser = internalAction({
  args: {
    email: v.string(),
    password: v.string(),
    confirmPassword: v.string(),
    ...omit(Users.withoutSystemFields, ['email']),
  },
  handler: async (ctx, { email, password, confirmPassword, ...user }) => {
    const { data: identityData, error: identityError } =
      identitySchema.safeParse({
        email,
        password,
        confirmPassword,
      })
    if (identityError) {
      return {
        success: false,
        validationErrors: identityError.flatten().fieldErrors,
      }
    }

    const hashedPassword = await bcrypt.hash(identityData.password, 12)

    // Create user
    const userId = await ctx.runMutation(internal.users.createUser, {
      email: identityData.email,
      ...user,
    })

    // Create identity
    await ctx.runMutation(internal.users.createUserIdentity, {
      userId,
      email: identityData.email,
      hashedPassword: hashedPassword,
    })

    return { success: true }
  },
})

export const getUserByEmail = internalQuery({
  args: {
    email: v.string(),
  },
  handler: async (ctx, { email }) => {
    return await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', email))
      .first()
  },
})

export const getUserIdentityByEmail = internalQuery({
  args: {
    email: v.string(),
  },
  handler: async (ctx, { email }) => {
    return await ctx.db
      .query('userIdentities')
      .withIndex('by_email', (q) => q.eq('email', email))
      .first()
  },
})
