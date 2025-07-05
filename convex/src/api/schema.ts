import { convexToZod } from 'convex-helpers/server/zod'
import { defineSchema } from 'convex/server'
import { v } from 'convex/values'
import { Table } from 'convex-helpers/server'
import type { Doc } from './_generated/dataModel'
import type { WithoutSystemFields } from 'convex/server'

export const Dispatches = Table('dispatches', {
  dispatchId: v.number(),
  narrative: v.optional(v.string()),
  type: v.string(),
  message: v.optional(v.union(v.string(), v.null())),
  address: v.string(),
  address2: v.optional(v.union(v.string(), v.null())),
  city: v.optional(v.union(v.string(), v.null())),
  stateCode: v.optional(v.union(v.string(), v.null())),
  latitude: v.number(),
  longitude: v.number(),
  unitCodes: v.array(v.string()),
  incidentTypeCode: v.optional(v.union(v.string(), v.null())),
  statusCode: v.optional(v.union(v.string(), v.null())),
  xrefId: v.optional(v.union(v.string(), v.null())),
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
