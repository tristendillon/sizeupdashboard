import { convexToZod } from 'convex-helpers/server/zod'
import { defineSchema } from 'convex/server'
import { v } from 'convex/values'
import { Table } from 'convex-helpers/server'
import type { Doc } from './_generated/dataModel'
import type { WithoutSystemFields } from 'convex/server'

export const IncomingDispatch = Table('incomingDispatches', {
  dispatchId: v.string(),
  type: v.string(),
  message: v.string(),
  address: v.string(),
  address2: v.string(),
  city: v.string(),
  stateCode: v.string(),
  latitude: v.string(),
  longitude: v.string(),
  unitCodes: v.array(v.string()),
  incidentTypeCode: v.string(),
  statusCode: v.string(),
  xrefId: v.string(),
  dispatchCreatedAt: v.string(),
})

export const IncomingDispatchSchema = convexToZod(
  IncomingDispatch.table.validator
)
export type IncomingDispatch = WithoutSystemFields<Doc<'incomingDispatches'>>

export const Dispatches = Table('dispatches', {
  dispatchId: v.string(),
  type: v.string(),
  message: v.string(),
  address: v.string(),
  address2: v.string(),
  city: v.string(),
  stateCode: v.string(),
  latitude: v.string(),
  longitude: v.string(),
  unitCodes: v.array(v.string()),
  incidentTypeCode: v.string(),
  statusCode: v.string(),
  xrefId: v.string(),
  dispatchCreatedAt: v.string(),
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
  pressure: v.number(),
  humidity: v.number(),
  dewPoint: v.number(),
  windSpeed: v.number(),
  windDeg: v.number(),
  windGust: v.number(),
  weather: v.array(v.number()),
  clouds: v.number(),
  pop: v.number(),
  rain: v.optional(v.number()),
  uvi: v.number(),
})

export const WeatherDaysSchema = convexToZod(WeatherDays.table.validator)
export type PostWeatherDay = WithoutSystemFields<Doc<'weatherDays'>>

export const WeatherHours = Table('weatherHours', {
  dt: v.number(),
  temp: v.number(),
  feelsLike: v.number(),
  pressure: v.number(),
  humidity: v.number(),
  dewPoint: v.number(),
  uvi: v.number(),
  clouds: v.number(),
  visibility: v.number(),
  windSpeed: v.number(),
  windDeg: v.number(),
  windGust: v.number(),
  weather: v.array(v.number()),
  pop: v.number(),
})

export const WeatherHoursSchema = convexToZod(WeatherHours.table.validator)
export type PostWeatherHour = WithoutSystemFields<Doc<'weatherHours'>>

// This is like an org field but we dont have an org table
export const SyncInfo = Table('syncInfo', {
  dispatchLastSync: v.string(),
  weatherLastSync: v.string(),
})

export const SyncInfoSchema = convexToZod(SyncInfo.table.validator)
export type PostSyncInfo = WithoutSystemFields<Doc<'syncInfo'>>

export const CurrentWeather = Table('currentWeather', {
  dt: v.number(),
  sunrise: v.number(),
  sunset: v.number(),
  temp: v.number(),
  feelsLike: v.number(),
  pressure: v.number(),
  humidity: v.number(),
  dewPoint: v.number(),
  uvi: v.number(),
  clouds: v.number(),
  visibility: v.number(),
  windSpeed: v.number(),
  windDeg: v.number(),
  windGust: v.number(),
  weather: v.array(v.number()),
})

export const CurrentWeatherSchema = convexToZod(CurrentWeather.table.validator)
export type PostCurrentWeather = WithoutSystemFields<Doc<'currentWeather'>>

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
    syncInfo: SyncInfo.table,
    // TEMP
    incomingDispatches: IncomingDispatch.table
      .index('by_dispatchId', ['dispatchId'])
      .index('by_dispatchCreatedAt', ['dispatchCreatedAt'])
      .index('by_xrefId', ['xrefId']),
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
