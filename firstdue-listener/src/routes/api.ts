import { Router } from 'express'

export function createApiRouter(): Router {
  const router = Router()

  router.get('/', (req, res) => {
    res.json({
      message: 'FirstDue Listener API is running! 🚀',
      version: '1.0.0',
    })
  })

  return router
}
