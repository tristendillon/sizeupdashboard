import { Router } from 'express'
import { BaseRoutine } from '@/routines/routine'
import { DispatchRoutine } from '@/routines/dispatch'

export function createRoutineRouter(routines: BaseRoutine[]): Router {
  const router = Router()

  router.get('/', (req, res) => {
    const routineStatus = routines.map((routine) => routine.getStatus())

    res.json({
      status: 'Routine router is healthy',
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

  router.post('/dispatch/sync', async (req, res) => {
    const routine = routines.find((r) => r.name.toLowerCase() === 'dispatch')
    if (!routine) {
      res.status(404).json({
        error: 'Routine not found',
        availableRoutines: routines.map((r) => r.name),
      })
      return
    }
    const dispatchRoutine = routine as DispatchRoutine
    routine.stop()
    dispatchRoutine.syncDispatches().then(() => {
      routine.start()
    })
    res.json({ message: 'Syncing dispatches' })
  })

  return router
}
