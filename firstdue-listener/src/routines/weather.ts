import { RoutineContext } from '@/context/RoutineContext'
import { BaseRoutine } from './routine'
import { config } from '@/config'
import { api } from '@sizeupdashboard/convex/api/_generated/api'
import {
  PostWeatherHour,
  PostActiveWeatherAlert,
  PostWeatherDay,
  PostCurrentWeather,
  PostWeatherDetail,
} from '@sizeupdashboard/convex/api/schema'

const ROUTINE_INTERVAL = 60_000 * 30 // 30 minutes
const ROUTINE_NAME = 'Weather'

interface OpenMapWeatherMeta {
  id: number
  main: string
  description: string
  icon: string
}

interface OpenMapWeatherHourly {
  dt: number
  temp: number
  feels_like: number
  pressure: number
  humidity: number
  dew_point: number
  uvi: number
  clouds: number
  visibility: number
  wind_speed: number
  wind_deg: number
  wind_gust: number
  weather: OpenMapWeatherMeta[]
  pop: number
}
interface OpenMapWeatherDaily {
  dt: number
  sunrise: number
  sunset: number
  moonrise: number
  moonset: number
  moon_phase: number
  summary: string
  temp: {
    day: number
    min: number
    max: number
    night: number
    eve: number
    morn: number
  }
  feels_like: {
    day: number
    night: number
    eve: number
    morn: number
  }
  pressure: number
  humidity: number
  dew_point: number
  wind_speed: number
  wind_deg: number
  wind_gust: number
  weather: OpenMapWeatherMeta[]
  clouds: number
  pop: number
  rain?: number
  uvi: number
}

interface OpenMapWeatherAlerts {
  sender_name: string
  event: string
  start: number
  end: number
  description: string
  tags: string[]
}

interface OpenMapWeatherCurrent {
  dt: number
  sunrise: number
  sunset: number
  temp: number
  feels_like: number
  pressure: number
  humidity: number
  dew_point: number
  uvi: number
  clouds: number
  visibility: number
  wind_speed: number
  wind_deg: number
  wind_gust: number
  weather: OpenMapWeatherMeta[]
}

interface OpenMapWeather {
  lat: number
  lon: number
  timezone: string
  timezone_offset: number
  current: OpenMapWeatherCurrent
  hourly: OpenMapWeatherHourly[]
  daily: OpenMapWeatherDaily[]
  alerts: OpenMapWeatherAlerts[]
}

interface ConvexWeatherData {
  hours: PostWeatherHour[]
  days: PostWeatherDay[]
  current: PostCurrentWeather
  alerts?: PostActiveWeatherAlert[]
}

export class WeatherRoutine extends BaseRoutine {
  protected readonly interval: number = ROUTINE_INTERVAL

  constructor(context: typeof RoutineContext) {
    super(ROUTINE_NAME, context)
  }

  protected getWeatherUrl(): string {
    const { lat, lng, apiKey, units } = config.weather
    if (!lat || !lng || !apiKey)
      throw new Error('Weather configuration is missing')
    return `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lng}&appid=${apiKey}&units=${units}`
  }

  protected parseWeatherData(data: OpenMapWeather): ConvexWeatherData {
    return {
      hours: data.hourly.map((hour) => ({
        dt: hour.dt,
        temp: hour.temp,
        feelsLike: hour.feels_like,
        pressure: hour.pressure,
        humidity: hour.humidity,
        dewPoint: hour.dew_point,
        windSpeed: hour.wind_speed,
        windDeg: hour.wind_deg,
        windGust: hour.wind_gust,
        weather: hour.weather.map((weather) => weather.id),
        clouds: hour.clouds,
        pop: hour.pop,
        uvi: hour.uvi,
        visibility: hour.visibility,
      })),
      days: data.daily.map((day) => ({
        dt: day.dt,
        sunrise: day.sunrise,
        sunset: day.sunset,
        moonrise: day.moonrise,
        moonset: day.moonset,
        moonPhase: day.moon_phase,
        summary: day.summary,
        temp: {
          day: day.temp.day,
          min: day.temp.min,
          max: day.temp.max,
          night: day.temp.night,
          eve: day.temp.eve,
          morn: day.temp.morn,
        },
        feelsLike: {
          day: day.feels_like.day,
          night: day.feels_like.night,
          eve: day.feels_like.eve,
          morn: day.feels_like.morn,
        },
        pressure: day.pressure,
        humidity: day.humidity,
        dewPoint: day.dew_point,
        windSpeed: day.wind_speed,
        windDeg: day.wind_deg,
        windGust: day.wind_gust,
        weather: day.weather.map((weather) => weather.id),
        clouds: day.clouds,
        pop: day.pop,
        uvi: day.uvi,
        rain: day.rain,
      })),
      current: {
        dt: data.current.dt,
        sunrise: data.current.sunrise,
        sunset: data.current.sunset,
        temp: data.current.temp,
        feelsLike: data.current.feels_like,
        pressure: data.current.pressure,
        humidity: data.current.humidity,
        dewPoint: data.current.dew_point,
        windSpeed: data.current.wind_speed,
        windDeg: data.current.wind_deg,
        windGust: data.current.wind_gust,
        weather: data.current.weather.map((weather) => weather.id),
        clouds: data.current.clouds,
        uvi: data.current.uvi,
        visibility: data.current.visibility,
      },
      alerts: data.alerts?.map((alert) => ({
        senderName: alert.sender_name,
        event: alert.event,
        start: alert.start,
        end: alert.end,
        description: alert.description,
        tags: alert.tags,
      })),
    }
  }

  protected async getAllWeatherDetails(
    data: OpenMapWeather
  ): Promise<PostWeatherDetail[]> {
    const weatherDetails: PostWeatherDetail[] = []
    const idSet = new Set<number>()

    const addWeatherDetail = (weather: OpenMapWeatherMeta) => {
      if (idSet.has(weather.id)) return
      idSet.add(weather.id)
      const weatherDetail = {
        detailId: weather.id,
        main: weather.main,
        description: weather.description,
        icon: weather.icon,
      }
      weatherDetails.push(weatherDetail)
    }

    for (const hour of data.hourly) {
      for (const weather of hour.weather) {
        addWeatherDetail(weather)
      }
    }
    for (const day of data.daily) {
      for (const weather of day.weather) {
        addWeatherDetail(weather)
      }
    }
    for (const weather of data.current.weather) {
      addWeatherDetail(weather)
    }
    return weatherDetails
  }

  protected async getWeatherData(): Promise<OpenMapWeather | null> {
    const url = this.getWeatherUrl()
    this.ctx.logger.info(`Getting weather data from ${url}`)
    const res = await fetch(url)
    if (!res.ok) {
      this.ctx.logger.error(`Failed to fetch weather data: ${res.statusText}`)
      return null
    }
    const data = (await res.json()) as OpenMapWeather
    return data
  }

  protected async execute(): Promise<void> {
    const data = await this.getWeatherData()
    if (!data) return
    const convexData = this.parseWeatherData(data)
    const weatherDetails = await this.getAllWeatherDetails(data)
    if (weatherDetails.length > 0) {
      const result = await this.ctx.client.mutation(
        api.weather.createWeatherDetails,
        {
          details: weatherDetails,
        }
      )
      this.ctx.logger.info(`Synced ${result.length} weather details`)
    }
    await this.ctx.client.mutation(api.weather.createWeather, {
      hours: convexData.hours,
      days: convexData.days,
      current: convexData.current,
      alerts: convexData.alerts ?? [],
    })
    await this.ctx.client.mutation(api.sync.setLastWeatherSync, {
      date: new Date().toISOString(),
    })
    this.ctx.logger.info(`Synced weather data to Convex`)
  }
}
