import express from 'express'
import expressWinston from 'express-winston'
import { DispatchRoutine } from '@/routines/dispatch'
import { createHealthRouter } from '@/routes/health'
import { winstonInstance } from '@/logger'
import { RoutineContext } from '@/context/RoutineContext'
import { WeatherRoutine } from './routines/weather'
import { BaseRoutine } from './routines/routine'
import { HydrantsRoutine } from './routines/hydrants'

export function createApp(): {
  app: express.Application
  routines: BaseRoutine[]
} {
  const app = express()
  const dispatchRoutine = new DispatchRoutine(RoutineContext)
  const weatherRoutine = new WeatherRoutine(RoutineContext)
  const hydrantsRoutine = new HydrantsRoutine(RoutineContext)

  const routines: BaseRoutine[] = [
    dispatchRoutine,
    weatherRoutine,
    hydrantsRoutine,
  ]

  app.use(express.json())

  app.use(
    expressWinston.logger({
      winstonInstance,
      meta: true,
      msg: 'HTTP {{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms',
      expressFormat: false,
      colorize: false,
    })
  )

  app.use('/', createHealthRouter(routines))

  return { app, routines }
}
