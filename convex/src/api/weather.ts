import { v } from 'convex/values'
import { mutation } from '../lib/mutation'
import {
  CurrentWeather,
  ActiveWeatherAlerts,
  WeatherDays,
  WeatherHours,
  WeatherDetail,
} from './schema'
import { QueryCtx, query } from './_generated/server'

export const createWeatherDetails = mutation({
  args: {
    details: v.array(WeatherDetail.table.validator),
  },
  handler: async (ctx, args) => {
    const { details } = args
    const result = await ctx.db.upsertManyByCustomId(
      'weatherDetails',
      details,
      'detailId'
    )
    return result
  },
})

export const createWeather = mutation({
  args: {
    hours: v.array(WeatherHours.table.validator),
    days: v.array(WeatherDays.table.validator),
    current: CurrentWeather.table.validator,
    alerts: v.array(ActiveWeatherAlerts.table.validator),
  },
  handler: async (ctx, args) => {
    const { hours, days, current, alerts } = args
    const weatherHours = await ctx.db.upsertManyByCustomId(
      'weatherHours',
      hours,
      'dt'
    )
    const weatherDays = await ctx.db.upsertManyByCustomId(
      'weatherDays',
      days,
      'dt'
    )
    const existingCurrentWeather = await ctx.db.query('currentWeather').first()
    if (existingCurrentWeather) {
      await ctx.db.delete(existingCurrentWeather._id)
    }
    const currentWeather = await ctx.db.insert('currentWeather', current)
    const existingActiveWeatherAlerts = await ctx.db
      .query('activeWeatherAlerts')
      .collect()
    if (existingActiveWeatherAlerts.length > 0) {
      await Promise.all(
        existingActiveWeatherAlerts.map((alert) => ctx.db.delete(alert._id))
      )
    }
    const activeWeatherAlerts = await ctx.db.insertMany(
      'activeWeatherAlerts',
      alerts
    )
    return {
      hours: weatherHours,
      days: weatherDays,
      current: currentWeather,
      alerts: activeWeatherAlerts,
    }
  },
})

export const getCurrentWeather = query({
  handler: async (ctx) => {
    const currentWeather = await ctx.db.query('currentWeather').first()
    return currentWeather
  },
})

const GetWeatherDetails = async (ctx: QueryCtx, detailIds: number[]) => {
  const details = await Promise.all(
    detailIds.map((detailId) => {
      const detail = ctx.db
        .query('weatherDetails')
        .withIndex('by_detailId', (q) => q.eq('detailId', detailId))
        .first()
      return detail
    })
  )
  return details
}

/**
 * Get weather data for a specific date
 * @param date Unix timestamp in seconds
 * @returns Weather data for the specified date
 */
const GetWeatherByDate = async (ctx: QueryCtx, date: number) => {
  const dateObj = new Date(date * 1000)
  const startOfDay = new Date(dateObj.setHours(0, 0, 0, 0))
  const endOfDay = new Date(dateObj.setHours(23, 59, 59, 999))
  const weatherDays = await ctx.db.query('weatherDays').collect()
  const realWeatherDays = weatherDays.filter((day) => {
    const dayObj = new Date(day.dt * 1000)
    return dayObj >= startOfDay && dayObj <= endOfDay
  })
  const day = realWeatherDays[0]
  const details = await GetWeatherDetails(ctx, day.weather)
  const joinedDay = {
    ...day,
    weather: details,
  }
  return joinedDay
}

const GetWeatherByDateRange = async (
  ctx: QueryCtx,
  start: number,
  end: number
) => {
  const startDate = new Date(start * 1000)
  const endDate = new Date(end * 1000)
  const weatherDays = await ctx.db.query('weatherDays').collect()
  const realWeatherDays = weatherDays.filter((day) => {
    const dayObj = new Date(day.dt * 1000)
    return dayObj >= startDate && dayObj <= endDate
  })
  const joinedDays = await Promise.all(
    realWeatherDays.map(async (day) => {
      const details = await GetWeatherDetails(ctx, day.weather)
      return { ...day, weather: details }
    })
  )
  return joinedDays
}

const GetWeatherHoursByDate = async (ctx: QueryCtx, date: number) => {
  const dateObj = new Date(date * 1000)
  const startOfDay = new Date(dateObj.setHours(0, 0, 0, 0))
  const endOfDay = new Date(dateObj.setHours(23, 59, 59, 999))
  const weatherHours = await ctx.db.query('weatherHours').collect()
  const realWeatherHours = weatherHours.filter((hour) => {
    const hourObj = new Date(hour.dt * 1000)
    return hourObj >= startOfDay && hourObj <= endOfDay
  })
  const joinedHours = await Promise.all(
    realWeatherHours.map(async (hour) => {
      const details = await GetWeatherDetails(ctx, hour.weather)
      return { ...hour, weather: details }
    })
  )
  return joinedHours
}

// const GetWeatherHoursByDateRange = async (
//   ctx: QueryCtx,
//   start: number,
//   end: number
// ): Promise<Doc<'weatherHours'>[]> => {
//   const startDate = new Date(start * 1000)
//   const endDate = new Date(end * 1000)
//   const weatherHours = await ctx.db.query('weatherHours').collect()
//   const realWeatherHours = weatherHours.filter((hour) => {
//     const hourObj = new Date(hour.dt * 1000)
//     return hourObj >= startDate && hourObj <= endDate
//   })
//   return realWeatherHours
// }

export const getWeatherByDate = query({
  args: {
    date: v.number(),
  },
  handler: async (ctx, args) => {
    const { date } = args
    return await GetWeatherByDate(ctx, date)
  },
})

export const getTodaysWeather = query({
  handler: async (ctx) => {
    const currentDate = new Date()
    return await GetWeatherByDate(ctx, currentDate.getTime() / 1000)
  },
})

export const getWeatherForecast = query({
  args: {
    date: v.number(),
    days: v.number(),
  },
  handler: async (ctx, args) => {
    const { date, days } = args
    const currentWeather = await ctx.db.query('currentWeather').first()
    const joinedCurrentWeather = {
      ...currentWeather,
      weather: await GetWeatherDetails(ctx, currentWeather?.weather ?? []),
    }
    const weatherDays = await GetWeatherByDateRange(
      ctx,
      date,
      date + days * 24 * 60 * 60
    )
    const weatherHours = await GetWeatherHoursByDate(ctx, date)
    return {
      days: weatherDays,
      hours: weatherHours,
      current: joinedCurrentWeather,
    }
  },
})
