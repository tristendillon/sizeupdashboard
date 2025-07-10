import { convexToZod } from 'convex-helpers/server/zod'
import { defineSchema } from 'convex/server'
import { v } from 'convex/values'
import { Table } from 'convex-helpers/server'
import type { Doc } from './_generated/dataModel'
import type { WithoutSystemFields } from 'convex/server'

export const UserIdentities = Table('userIdentities', {
  userId: v.id('users'),
  email: v.string(),
  hashedPassword: v.string(),
})

export const UserSessions = Table('userSessions', {
  userId: v.id('users'),
  expiresAt: v.number(),
  token: v.string(),
})

export const RefreshTokens = Table('refreshTokens', {
  token: v.string(),
  expiresAt: v.number(),
  userId: v.id('users'),
})

export const Users = Table('users', {
  email: v.string(),
  name: v.string(),
})

export const Dispatches = Table('dispatches', {
  dispatchId: v.number(),
  narrative: v.optional(v.string()),
  type: v.string(),
  message: v.optional(v.union(v.string(), v.null())),
  address: v.string(),
  address2: v.optional(v.union(v.string(), v.null())),
  city: v.optional(v.union(v.string(), v.null())),
  stateCode: v.optional(v.union(v.string(), v.null())),
  location: v.object({
    lat: v.number(),
    lng: v.number(),
  }),
  unitCodes: v.array(v.string()),
  incidentTypeCode: v.optional(v.union(v.string(), v.null())),
  statusCode: v.optional(v.union(v.string(), v.null())),
  xrefId: v.optional(v.union(v.string(), v.null())),
  dispatchType: v.optional(v.id('dispatchTypes')),
  dispatchCreatedAt: v.number(),
})
export const DispatchesSchema = convexToZod(Dispatches.table.validator)
export type PostDispatch = WithoutSystemFields<Doc<'dispatches'>>

export const ActiveWeatherAlerts = Table('activeWeatherAlerts', {
  senderName: v.string(),
  event: v.string(),
  start: v.number(),
  end: v.number(),
  description: v.string(),
  tags: v.array(v.string()),
})

export const ActiveWeatherAlertsSchema = convexToZod(
  ActiveWeatherAlerts.table.validator
)
export type PostActiveWeatherAlert = WithoutSystemFields<
  Doc<'activeWeatherAlerts'>
>

export const WeatherDetail = Table('weatherDetails', {
  detailId: v.number(),
  main: v.string(),
  description: v.string(),
  icon: v.string(),
})

export const WeatherDetailSchema = convexToZod(WeatherDetail.table.validator)
export type PostWeatherDetail = WithoutSystemFields<Doc<'weatherDetails'>>

export const WeatherDays = Table('weatherDays', {
  dt: v.number(),
  sunrise: v.number(),
  sunset: v.number(),
  moonrise: v.number(),
  moonset: v.number(),
  moonPhase: v.number(),
  summary: v.string(),
  temp: v.object({
    day: v.number(),
    min: v.number(),
    max: v.number(),
    night: v.number(),
    eve: v.number(),
    morn: v.number(),
  }),
  feelsLike: v.object({
    day: v.number(),
    night: v.number(),
    eve: v.number(),
    morn: v.number(),
  }),
  pressure: v.optional(v.number()),
  humidity: v.optional(v.number()),
  dewPoint: v.optional(v.number()),
  windSpeed: v.optional(v.number()),
  windDeg: v.optional(v.number()),
  windGust: v.optional(v.number()),
  weather: v.array(v.number()),
  clouds: v.optional(v.number()),
  pop: v.optional(v.number()),
  rain: v.optional(v.number()),
  uvi: v.optional(v.number()),
})

export const WeatherDaysSchema = convexToZod(WeatherDays.table.validator)
export type PostWeatherDay = WithoutSystemFields<Doc<'weatherDays'>>

export const WeatherHours = Table('weatherHours', {
  dt: v.number(),
  temp: v.number(),
  feelsLike: v.number(),
  pressure: v.number(),
  humidity: v.number(),
  dewPoint: v.optional(v.number()),
  uvi: v.optional(v.number()),
  clouds: v.optional(v.number()),
  visibility: v.optional(v.number()),
  windSpeed: v.optional(v.number()),
  windDeg: v.optional(v.number()),
  windGust: v.optional(v.number()),
  weather: v.array(v.number()),
  pop: v.optional(v.number()),
})

export const WeatherHoursSchema = convexToZod(WeatherHours.table.validator)
export type PostWeatherHour = WithoutSystemFields<Doc<'weatherHours'>>

// This is like an org field but we dont have an org table

export const CurrentWeather = Table('currentWeather', {
  dt: v.number(),
  sunrise: v.number(),
  sunset: v.number(),
  temp: v.number(),
  feelsLike: v.number(),
  pressure: v.optional(v.number()),
  humidity: v.number(),
  dewPoint: v.optional(v.number()),
  uvi: v.optional(v.number()),
  clouds: v.optional(v.number()),
  visibility: v.optional(v.number()),
  windSpeed: v.optional(v.number()),
  windDeg: v.optional(v.number()),
  windGust: v.optional(v.number()),
  weather: v.array(v.number()),
})

export const CurrentWeatherSchema = convexToZod(CurrentWeather.table.validator)

export type PostCurrentWeather = WithoutSystemFields<Doc<'currentWeather'>>

export const Hydrants = Table('hydrants', {
  hydrantId: v.number(),
  latitude: v.number(),
  longitude: v.number(),
  address: v.union(v.string(), v.null()),
  numOutlet: v.union(v.number(), v.null()),
  notes: v.union(v.string(), v.null()),
  calculatedFlowRate: v.union(v.string(), v.null()),
  hydrantStatusCode: v.union(v.string(), v.null()),
})

export const HydrantsSchema = convexToZod(Hydrants.table.validator)
export type PostHydrant = WithoutSystemFields<Doc<'hydrants'>>

export const ViewTokens = Table('viewTokens', {
  name: v.string(),
  lastPing: v.number(),
  token: v.string(),
})

export const ViewTokensSchema = convexToZod(ViewTokens.table.validator)
export type PostViewToken = WithoutSystemFields<Doc<'viewTokens'>>

export const groupEnum = v.union(
  v.literal('aircraft'),
  v.literal('fire'),
  v.literal('hazmat'),
  v.literal('mva'),
  v.literal('marine'),
  v.literal('law'),
  v.literal('rescue'),
  v.literal('medical'),
  v.literal('other')
)

export const DispatchTypes = Table('dispatchTypes', {
  // This is like an exact matching forced lookup for the descriptor, so we can store "ALARM-FIRE" and then have a system _id for it
  code: v.string(),
  group: groupEnum,
  name: v.optional(v.string()),
})

export const DispatchTypesSchema = convexToZod(DispatchTypes.table.validator)
export type PostDispatchType = WithoutSystemFields<Doc<'dispatchTypes'>>

export const PriorityLevels = Table('priorityLevels', {
  name: v.string(),
  // This is the priority of the type
  priority: v.number(),
})

export const PriorityLevelsSchema = convexToZod(PriorityLevels.table.validator)
export type PostPriorityLevel = WithoutSystemFields<Doc<'priorityLevels'>>

export const RedactionLevels = Table('redactionLevels', {
  name: v.string(),
  priority: v.id('priorityLevels'),
  // This will look like "^MED" or "^FIRE" to match the any MED or any FIRE descriptor
  // field matches against the dispatchType code
  dispatchTypeRegex: v.string(),
  // This will search for keywords in the descriptor of the cad alert
  keywords: v.array(v.string()),
  // This will do direct matching for redaction level.
  dispatchTypes: v.array(v.id('dispatchTypes')),

  // The fields that are redacted from the alert when accessed by the public
  // if public facing dashboards exists
  redactionFields: v.array(v.string()),
})

export const RedactionLevelsSchema = convexToZod(
  RedactionLevels.table.validator
)
export type PostRedactionLevel = WithoutSystemFields<Doc<'redactionLevels'>>

export default defineSchema(
  {
    dispatches: Dispatches.table
      .index('by_dispatchId', ['dispatchId'])
      .index('by_dispatchCreatedAt', ['dispatchCreatedAt'])
      .index('by_xrefId', ['xrefId']),
    activeWeatherAlerts: ActiveWeatherAlerts.table
      .index('by_event', ['event'])
      .index('by_tags', ['tags'])
      .index('by_senderName', ['senderName']),
    weatherDays: WeatherDays.table,
    weatherHours: WeatherHours.table,
    weatherDetails: WeatherDetail.table.index('by_detailId', ['detailId']),
    currentWeather: CurrentWeather.table,
    hydrants: Hydrants.table.index('by_hydrantId', ['hydrantId']),

    viewTokens: ViewTokens.table
      .index('by_token', ['token'])
      .index('by_name', ['name']),
    redactionLevels: RedactionLevels.table.index('by_name', ['name']),
    dispatchTypes: DispatchTypes.table.index('by_code', ['code']),
    priorityLevels: PriorityLevels.table.index('by_name', ['name']),

    userSessions: UserSessions.table
      .index('by_expiresAt', ['expiresAt'])
      .index('by_userId', ['userId'])
      .index('by_token', ['token']),
    refreshTokens: RefreshTokens.table
      .index('by_expiresAt', ['expiresAt'])
      .index('by_userId', ['userId'])
      .index('by_token', ['token']),
    users: Users.table.index('by_email', ['email']),
    userIdentities: UserIdentities.table.index('by_email', ['email']),
  },
  // If you ever get an error about schema mismatch
  // between your data and your schema, and you cannot
  // change the schema to match the current data in your database,
  // you can:
  //  1. Use the dashboard to delete tables or individual documents
  //     that are causing the error.
  //  2. Change this option to `false` and make changes to the data
  //     freely, ignoring the schema. Don't forget to change back to `true`!
  { schemaValidation: true }
)
