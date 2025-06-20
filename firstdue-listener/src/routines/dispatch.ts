import { RoutineContext } from '@/context/RoutineContext'
import { BaseRoutine } from './routine'
import { api } from '@sizeupdashboard/convex/api/_generated/api'
import { PostDispatch } from '@sizeupdashboard/convex/api/schema'
import { config } from '@/config'

const DISPATCH_INTERVAL = 5000
const DISPATCH_NAME = 'Dispatch'

interface FirstDueDispatch {
  id: string
  type: string
  message: string
  address: string
  address2: string
  city: string
  state_code: string
  latitude: string
  longitude: string
  unit_codes: string[]
  incident_type_code: string
  status_code: string
  xref_id: string
  created_at: string
}

export class DispatchListener extends BaseRoutine {
  protected readonly interval: number = DISPATCH_INTERVAL
  private pendingDispatches: PostDispatch[] = []

  constructor(context: typeof RoutineContext) {
    super(DISPATCH_NAME, context)
  }

  protected async execute(): Promise<void> {
    if (!config.firstdueApiKey) {
      throw new Error('FIRSTDUE_API_KEY is not set')
    }
    // await this.checkForNewDispatchesSizeup()
    await this.checkForNewDispatches()
    await this.processDispatchQueue()
  }

  private async checkForNewDispatchesSizeup(): Promise<void> {
    const dbDispatches = await this.ctx.client.query(
      api.temp.getIncomingDispatch,
      {}
    )
    const fetchTimer = this.ctx.logger.perf.start({
      id: 'fetchFirstDueDispatches',
      startLog: () => {
        this.ctx.logger.info('Fetching and parsing dispatches from FirstDue')
      },
      printf: (duration: number) => {
        return `Fetched and parseddispatches from FirstDue in ${duration}ms`
      },
    })
    const res = await fetch(`${config.firstdueApiUrl}/dispatches`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.firstdueApiKey}`,
      },
    })
    if (!res.ok) {
      throw new Error(
        `Failed to fetch dispatches from FirstDue: ${res.statusText}`
      )
    }
    const data: FirstDueDispatch[] = await res.json()
    const parsedData: PostDispatch[] = []
    for (const dispatch of data) {
      parsedData.push({
        dispatchId: dispatch.id,
        type: dispatch.type,
        message: dispatch.message,
        address: dispatch.address,
        address2: dispatch.address2,
        city: dispatch.city,
        stateCode: dispatch.state_code,
        latitude: dispatch.latitude,
        longitude: dispatch.longitude,
        unitCodes: dispatch.unit_codes,
        incidentTypeCode: dispatch.incident_type_code,
        statusCode: dispatch.status_code,
        xrefId: dispatch.xref_id,
        dispatchCreatedAt: dispatch.created_at,
      })
    }
    fetchTimer.end()
    const newDispatches = await this.ctx.client.query(
      api.dispatches.filterNewDispatches,
      {
        dispatches: dbDispatches,
      }
    )
    this.pendingDispatches.push(...newDispatches)
  }

  private async checkForNewDispatches(): Promise<void> {
    const dispatches = await this.ctx.client.query(
      api.temp.getIncomingDispatch,
      {}
    )
    const timer = this.ctx.logger.perf.start({
      id: 'filterNewDispatches',
      printf: (duration: number) => {
        return `Filtered out new dispatches in ${duration}ms`
      },
    })
    const newDispatches = await this.ctx.client.query(
      api.dispatches.filterNewDispatches,
      {
        dispatches,
      }
    )
    timer.end()
    this.pendingDispatches = newDispatches
  }

  private async processDispatchQueue(): Promise<void> {
    for (const dispatch of this.pendingDispatches) {
      const result = await this.ctx.client.mutation(
        api.dispatches.createDispatch,
        dispatch
      )
      this.ctx.logger.info(
        `Created dispatch ${dispatch.dispatchId} with result ${result}`
      )
    }
    this.pendingDispatches = []
  }
  getPendingDispatches(): PostDispatch[] {
    return this.pendingDispatches
  }
}
