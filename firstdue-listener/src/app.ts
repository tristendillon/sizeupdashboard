import express from 'express'
import { DispatchListener } from '@/routines/dispatch'
import { createHealthRouter } from '@/routes/health'
import { createApiRouter } from '@/routes/api'

export function createApp(): { app: express.Application; dispatchListener: DispatchListener } {
  const app = express()
  const dispatchListener = new DispatchListener()

  app.use(express.json())

  app.use('/health', createHealthRouter(dispatchListener))
  app.use('/api', createApiRouter())
  app.use('/', createApiRouter())

  return { app, dispatchListener }
}