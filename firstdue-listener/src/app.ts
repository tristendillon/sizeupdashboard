import express from 'express'
import expressWinston from 'express-winston'
import { winstonInstance } from '@/logger'
import { DispatchRoutineRouter } from './routes/dispatch'
import { RoutineRouter } from './routes/routineRouter'
import { WeatherRoutineRouter } from './routes/weather'
import { HydrantsRoutineRouter } from './routes/hydrants'

export function createApp(): {
  app: express.Application
  routines: RoutineRouter[]
} {
  const app = express()

  const dispatchRouter = new DispatchRoutineRouter()
  const weatherRouter = new WeatherRoutineRouter()
  const hydrantsRouter = new HydrantsRoutineRouter()

  const routineRoutes: RoutineRouter[] = [
    dispatchRouter,
    weatherRouter,
    hydrantsRouter,
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

  routineRoutes.forEach(async (routineRouter) => {
    const routeName = routineRouter.name.toLowerCase()
    app.use(`/api/routines/${routeName}`, routineRouter.getRoutes())
    routineRouter.ctx.logger.info(
      `Mounted ${routineRouter.name} routes at /api/routines/${routeName} with ${routineRouter.routes.stack.length} routes`
    )
  })

  return { app, routines: routineRoutes }
}
