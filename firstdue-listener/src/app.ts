import express from 'express'
import expressWinston from 'express-winston'
import { DispatchListener } from '@/routines/dispatch'
import { createHealthRouter } from '@/routes/health'
import { winstonInstance } from '@/logger'
import { RoutineContext } from '@/context/RoutineContext'

export function createApp(): {
  app: express.Application
  dispatchListener: DispatchListener
} {
  const app = express()
  const dispatchListener = new DispatchListener(RoutineContext)

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

  app.use('/', createHealthRouter([dispatchListener]))

  return { app, dispatchListener }
}
