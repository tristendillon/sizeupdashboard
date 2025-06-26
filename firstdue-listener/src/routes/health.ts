import { Router } from 'express'
import { BaseRoutine } from '@/routines/routine'
import { config } from '@/config'

export function createHealthRouter(routines: BaseRoutine[]): Router {
  const router = Router()

  router.get('/', (req, res) => {
    const routineStatus = routines.map((routine) => routine.getStatus())

    res.json({
      deploymentSha: config.deploymentSha,
      status: 'Webserver is healthy',
      timestamp: new Date().toISOString(),
      routines: routineStatus,
    })
  })

  router.get('/:routine', (req, res) => {
    const routineName = req.params.routine
    const routine = routines.find(
      (r) => r.name.toLowerCase() === routineName.toLowerCase()
    )

    if (!routine) {
      res.status(404).json({
        error: 'Routine not found',
        availableRoutines: routines.map((r) => r.name),
      })
      return
    }

    res.json(routine.getStatus())
  })

  return router
}
