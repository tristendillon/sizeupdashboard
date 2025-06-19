import { Router } from 'express'
import { DispatchListener } from '@/routines/dispatch'

export function createHealthRouter(dispatchListener: DispatchListener): Router {
  const router = Router()

  router.get('/', (req, res) => {
    const routineStatus = dispatchListener.getStatus()

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      routine: routineStatus,
    })
  })

  return router
}
