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

export class DispatchRoutine extends BaseRoutine {
  protected readonly interval: number = DISPATCH_INTERVAL
  private lastDispatchTime: number = 0
  private lastDispatchtimeInvalid: boolean = false
  constructor(context: typeof RoutineContext) {
    super(DISPATCH_NAME, context)
  }

  protected async execute(): Promise<void> {
    if (!config.firstdueApiKey) {
      throw new Error('FIRSTDUE_API_KEY is not set')
    }
    await this.checkForNewDispatchesSizeup()
  }

  private parseFirstDueDispatch(dispatch: FirstDueDispatch): PostDispatch {
    return {
      dispatchId: Number(dispatch.id),
      type: dispatch.type,
      message: dispatch.message,
      address: dispatch.address,
      address2: dispatch.address2,
      city: dispatch.city,
      stateCode: dispatch.state_code,
      latitude: Number(dispatch.latitude),
      longitude: Number(dispatch.longitude),
      unitCodes: dispatch.unit_codes,
      incidentTypeCode: dispatch.incident_type_code,
      statusCode: dispatch.status_code,
      xrefId: dispatch.xref_id,
      dispatchCreatedAt: new Date(dispatch.created_at).getTime(),
    }
  }

  private createIsoDateWithOffset(date: number): string {
    const dateObj = new Date(date)
    dateObj.setMinutes(dateObj.getMinutes() + 1)
    const isoWithOffset = dateObj.toISOString().replace(/\.\d{1,3}Z$/, '+00:00')
    return isoWithOffset
  }

  public async syncDispatches(): Promise<void> {
    const syncTimer = this.ctx.logger.perf.start({
      id: 'syncDispatches',
      printf: (duration: number) => {
        return `Synced dispatches in ${duration}ms`
      },
    })
    const clearedDispatches = await this.ctx.client.mutation(
      api.dispatches.clearDispatches,
      {}
    )
    this.ctx.logger.info(`Cleared ${clearedDispatches.length} dispatches`)
    this.lastDispatchtimeInvalid = true
    const getDispatches = async (
      page: number = 1
    ): Promise<FirstDueDispatch[]> => {
      const url = new URL(`${config.firstdueApiUrl}/dispatches`)
      url.searchParams.set('page', page.toString())
      this.ctx.logger.debug(
        `Fetching dispatches from FirstDue: ${url.toString()}`
      )
      const fetchTimer = this.ctx.logger.perf.start({
        id: 'fetchDispatches',
        printf: (duration: number) => {
          return `Fetched ${page} pages of dispatches in ${duration}ms`
        },
      })
      const res = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.firstdueApiKey}`,
        },
      })
      fetchTimer.end()
      if (!res.ok) {
        this.ctx.logger.error(
          `Failed to fetch dispatches from FirstDue during sync: ${res.statusText}`
        )
        return []
      }

      const linkHeader = res.headers.get('Link')
      const pagination = parseLinkHeader(linkHeader)
      const data: FirstDueDispatch[] = await res.json()
      // Rate limit self so as to not bother FirstDue
      this.ctx.logger.debug(`pagination: ${JSON.stringify(pagination)}`)
      const parsedData = data.map(this.parseFirstDueDispatch)
      if (parsedData.length > 0) {
        await this.insertDispatches(parsedData)
      }
      await new Promise((resolve) => setTimeout(resolve, 1000))
      if (pagination.next) {
        return [...data, ...(await getDispatches(page + 1))]
      }
      return data
    }

    const parseLinkHeader = (
      linkHeader: string | null
    ): {
      next: string | null
      prev: string | null
      last: string | null
    } => {
      if (!linkHeader) {
        return { next: null, prev: null, last: null }
      }
      const links = linkHeader.split(',')
      const next = links.find((link) => link.includes('rel="next"'))
      const prev = links.find((link) => link.includes('rel="prev"'))
      const last = links.find((link) => link.includes('rel="last"'))
      return {
        next: next ? next.split(';')[0].trim() : null,
        prev: prev ? prev.split(';')[0].trim() : null,
        last: last ? last.split(';')[0].trim() : null,
      }
    }

    const dispatches = await getDispatches()
    if (dispatches.length === 0) {
      this.ctx.logger.info('No new dispatches found')
      syncTimer.end()
    }
    this.ctx.logger.info(`Synced ${dispatches.length} dispatches`)
    syncTimer.end()
  }

  private async getLastDispatchTime(): Promise<number> {
    if (this.lastDispatchTime > 0 && !this.lastDispatchtimeInvalid) {
      return this.lastDispatchTime
    }
    const lastDispatchTime = await this.ctx.client.query(
      api.dispatches.getLastDispatchTime,
      {}
    )
    this.lastDispatchTime = lastDispatchTime
    this.lastDispatchtimeInvalid = false
    return this.lastDispatchTime
  }

  private async checkForNewDispatchesSizeup(): Promise<void> {
    const fetchTimer = this.ctx.logger.perf.start({
      id: 'fetchFirstDueDispatches',
      onStart: () => {
        this.ctx.logger.info('Fetching dispatches from FirstDue')
      },
      printf: (duration: number) => {
        return `Fetched dispatches from FirstDue in ${duration}ms`
      },
    })
    const url = new URL(`${config.firstdueApiUrl}/dispatches`)

    const lastDispatchTime = await this.getLastDispatchTime()
    if (!lastDispatchTime) {
      this.ctx.logger.info(
        'No last dispatch time found, fetching all dispatches'
      )
    } else {
      url.searchParams.set(
        'since',
        this.createIsoDateWithOffset(lastDispatchTime)
      )
    }
    this.ctx.logger.debug(
      `Fetching dispatches from FirstDue: ${url.toString()}`
    )
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.firstdueApiKey}`,
      },
    })
    if (!res.ok) {
      this.ctx.logger.error(
        `Failed to fetch dispatches from FirstDue: ${res.statusText}`
      )
      fetchTimer.end()
      return
    }
    fetchTimer.end()
    const data: FirstDueDispatch[] = await res.json()
    if (data.length === 0) {
      this.ctx.logger.info('No new dispatches found in FirstDue')
      return
    }
    const parsedData: PostDispatch[] = data.map(this.parseFirstDueDispatch)
    await this.insertDispatches(parsedData)
  }

  private async insertDispatches(dispatches: PostDispatch[]): Promise<void> {
    const result = await this.ctx.client.mutation(
      api.dispatches.createDispatchs,
      { dispatches }
    )
    this.ctx.logger.info(`Created ${result.length} dispatches`)
    this.lastDispatchtimeInvalid = true
  }
}
