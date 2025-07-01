import express from 'express'
import expressWinston from 'express-winston'
import { winstonInstance } from '@/logger'
import { DispatchRoutineRouter } from './routes/dispatches'
import { RoutineRouter } from './routes/routineRouter'

export function createApp(): {
  app: express.Application
  routines: RoutineRouter[]
} {
  const app = express()

  const dispatchRouter = new DispatchRoutineRouter()

  const routineRoutes: RoutineRouter[] = [dispatchRouter]

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
    routineRouter.routineContext.logger.info(
      `Mounted ${routineRouter.name} routes at /api/routines/${routeName} with ${routineRouter.routes.stack.length} routes`
    )
  })

  return { app, routines: routineRoutes }
}
