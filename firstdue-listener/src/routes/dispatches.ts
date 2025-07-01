import { RoutineRouter, RoutineRouterOptions } from './routineRouter'
import { api } from '@sizeupdashboard/convex/api/_generated/api'
import { PostDispatch } from '@sizeupdashboard/convex/api/schema'
import { config } from '@/config'
import { Request, Response } from 'express'
import {
  FormattedDateTime,
  formatDateTime,
  formatTimezoneDate,
} from '@/lib/utils'

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

interface PaginationLinks {
  next: string | null
  prev: string | null
  last: string | null
}

interface DispatchStats {
  totalFetched: number
  totalInserted: number
  lastSyncTime?: FormattedDateTime
  lastFetchTime?: FormattedDateTime
  apiCallCount: number
  errorCount: number
}

export class DispatchRoutineRouter extends RoutineRouter {
  protected readonly interval: number = DISPATCH_INTERVAL
  private lastDispatchTime: number = 0
  private lastDispatchTimeInvalid: boolean = false
  public stats: DispatchStats = this.defaultStats()
  public isSyncing: boolean = false
  constructor(options: RoutineRouterOptions = {}) {
    super(DISPATCH_NAME, {
      ...options,
      onStart: async () => {
        await this.validateConfiguration()
        await options.onStart?.()
      },
    })
  }

  protected defaultStats(): DispatchStats {
    return {
      totalFetched: 0,
      totalInserted: 0,
      apiCallCount: 0,
      errorCount: 0,
    }
  }

  protected defineRoutes(): void {
    // Manual sync endpoint - syncs all dispatches (clears and refetches)
    this.addRoute('post', '/sync', this.handleFullSync.bind(this))

    // Get last dispatch time info
    this.addRoute(
      'get',
      '/last-dispatch-time',
      this.handleGetLastDispatchTime.bind(this)
    )

    // Get configuration status
    this.addRoute('get', '/config', this.handleGetConfig.bind(this))

    // Test FirstDue API connectivity
    this.addRoute(
      'get',
      '/test-connection',
      this.handleTestConnection.bind(this)
    )
  }

  public async execute(): Promise<void> {
    await this.validateConfiguration()
    await this.checkForNewDispatches()
  }
  protected shouldNotStart(): { shouldNotStart: boolean; reason: string } {
    if (this.isSyncing) {
      return {
        shouldNotStart: true,
        reason: 'Sync already in progress, please wait for it to complete',
      }
    }
    return { shouldNotStart: false, reason: '' }
  }

  // ==================== ROUTE HANDLERS ====================

  private async handleFullSync(req: Request, res: Response): Promise<void> {
    if (this.isSyncing) {
      res.status(400).json({
        message: 'Sync already in progress',
      })
      return
    }
    this.routineContext.logger.info('Manual full sync requested via API')
    this.isSyncing = true
    await this.stop('Manual full sync requested via API')
    try {
      this.syncAllDispatches().then(async (result) => {
        this.routineContext.logger.info(
          `Full sync completed successfully with ${result.totalSynced} dispatches synced and ${result.clearedCount} dispatches cleared`
        )
        // Start the routine again
        await this.start()
        this.isSyncing = false
      })
      res.json({
        message: 'Full sync started',
        stats: this.stats,
      })
    } catch (error) {
      this.stats.errorCount++
      throw error // Will be handled by the addRoute wrapper
    }
  }

  private async handleGetLastDispatchTime(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const lastTime = await this.getLastDispatchTime()
      res.json({
        lastDispatchTime: lastTime,
        lastDispatchTimeInvalid: this.lastDispatchTimeInvalid,
        formatted: lastTime ? formatDateTime(lastTime) : null,
      })
    } catch (error) {
      this.stats.errorCount++
      throw error
    }
  }

  private async handleGetConfig(req: Request, res: Response): Promise<void> {
    res.json({
      hasApiKey: !!config.firstdueApiKey,
      apiUrl: config.firstdueApiUrl,
      interval: this.interval,
      intervalFormatted: this.getStatus().interval.formatted,
    })
  }

  private async handleTestConnection(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      await this.validateConfiguration()

      const testTimer = this.routineContext.logger.perf.start({
        id: 'testFirstDueConnection',
        printf: (duration: number) =>
          `FirstDue API connection test completed in ${duration}ms`,
      })

      const url = new URL(`${config.firstdueApiUrl}/dispatches`)
      url.searchParams.set('page', '1')

      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.firstdueApiKey}`,
        },
      })

      testTimer.end()

      if (!response.ok) {
        throw new Error(
          `API returned ${response.status}: ${response.statusText}`
        )
      }

      const data = await response.json()

      res.json({
        message: 'FirstDue API connection successful',
        status: response.status,
        sampleDataCount: Array.isArray(data) ? data.length : 0,
        headers: Object.fromEntries(response.headers.entries()),
      })
    } catch (error) {
      this.stats.errorCount++
      throw error
    }
  }

  // ==================== CORE BUSINESS LOGIC ====================

  private async validateConfiguration(): Promise<void> {
    if (!config.firstdueApiKey) {
      throw new Error('FIRSTDUE_API_KEY is not configured')
    }
    if (!config.firstdueApiUrl) {
      throw new Error('FIRSTDUE_API_URL is not configured')
    }
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

  public async syncAllDispatches(): Promise<{
    totalSynced: number
    clearedCount: number
  }> {
    const syncTimer = this.routineContext.logger.perf.start({
      id: 'syncAllDispatches',
      printf: (duration: number) =>
        `Full dispatch sync completed in ${duration}ms`,
    })

    try {
      // Clear existing dispatches in batches
      let clearedCount = 0
      let clearedDispatches = true

      this.routineContext.logger.info(
        'Starting full dispatch sync - clearing existing dispatches'
      )

      while (clearedDispatches) {
        const batchCleared = await this.routineContext.client.mutation(
          api.dispatches.paginatedClearDispatches,
          { numItems: 1000 }
        )
        clearedDispatches = batchCleared
        if (batchCleared) clearedCount += 1000
      }

      this.routineContext.logger.info(
        `Cleared approximately ${clearedCount} dispatches`
      )
      this.lastDispatchTimeInvalid = true

      // Fetch all dispatches with pagination
      const allDispatches = await this.fetchAllDispatchesWithPagination()

      if (allDispatches.length === 0) {
        this.routineContext.logger.info('No dispatches found during full sync')
        this.stats.lastSyncTime = formatDateTime(new Date())
        return { totalSynced: 0, clearedCount }
      }

      // Parse and insert dispatches
      const parsedData = allDispatches.map((dispatch) =>
        this.parseFirstDueDispatch(dispatch)
      )
      await this.insertDispatches(parsedData)

      this.stats.totalFetched += allDispatches.length
      this.stats.lastSyncTime = formatDateTime(new Date())
      this.routineContext.logger.info(
        `Full sync completed: ${allDispatches.length} dispatches synced`
      )

      return { totalSynced: allDispatches.length, clearedCount }
    } finally {
      syncTimer.end()
    }
  }

  private async fetchAllDispatchesWithPagination(): Promise<
    FirstDueDispatch[]
  > {
    const allDispatches: FirstDueDispatch[] = []
    let currentPage = 1

    const fetchPage = async (
      page: number
    ): Promise<{ dispatches: FirstDueDispatch[]; hasNext: boolean }> => {
      const url = new URL(`${config.firstdueApiUrl}/dispatches`)
      url.searchParams.set('page', page.toString())

      this.routineContext.logger.info(`Fetching page ${page} from FirstDue API`)

      const fetchTimer = this.routineContext.logger.perf.start({
        id: `fetchDispatchesPage${page}`,
        printf: (duration: number) => `Fetched page ${page} in ${duration}ms`,
      })

      try {
        this.stats.apiCallCount++
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.firstdueApiKey}`,
          },
        })

        if (!response.ok) {
          throw new Error(
            `Failed to fetch page ${page}: ${response.status} ${response.statusText}`
          )
        }

        const data: FirstDueDispatch[] = await response.json()
        const pagination = this.parseLinkHeader(response.headers.get('Link'))

        this.routineContext.logger.debug(
          `Page ${page}: ${
            data.length
          } dispatches, hasNext: ${!!pagination.next}`
        )

        return {
          dispatches: data,
          hasNext: !!pagination.next,
        }
      } finally {
        fetchTimer.end()
      }
    }

    // Fetch all pages
    let hasNext = true
    while (hasNext) {
      const { dispatches, hasNext: nextExists } = await fetchPage(currentPage)
      allDispatches.push(...dispatches)
      hasNext = nextExists
      currentPage++

      // Rate limiting - be nice to the API
      if (hasNext) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
    }

    return allDispatches
  }

  private parseLinkHeader(linkHeader: string | null): PaginationLinks {
    if (!linkHeader) {
      return { next: null, prev: null, last: null }
    }

    const links = linkHeader.split(',')
    const next = links.find((link) => link.includes('rel="next"'))
    const prev = links.find((link) => link.includes('rel="prev"'))
    const last = links.find((link) => link.includes('rel="last"'))

    return {
      next: next ? next.split(';')[0].trim().replace(/[<>]/g, '') : null,
      prev: prev ? prev.split(';')[0].trim().replace(/[<>]/g, '') : null,
      last: last ? last.split(';')[0].trim().replace(/[<>]/g, '') : null,
    }
  }

  private async getLastDispatchTime(): Promise<number> {
    if (this.lastDispatchTime > 0 && !this.lastDispatchTimeInvalid) {
      return this.lastDispatchTime
    }

    const queryTimer = this.routineContext.logger.perf.start({
      id: 'getLastDispatchTime',
      printf: (duration: number) =>
        `Retrieved last dispatch time in ${duration}ms`,
    })

    try {
      const lastDispatchTime = await this.routineContext.client.query(
        api.dispatches.getLastDispatchTime,
        {}
      )

      this.lastDispatchTime = lastDispatchTime
      this.lastDispatchTimeInvalid = false

      this.routineContext.logger.debug(
        `Last dispatch time: ${
          lastDispatchTime
            ? formatTimezoneDate(new Date(lastDispatchTime))
            : 'none'
        }`
      )

      return this.lastDispatchTime
    } finally {
      queryTimer.end()
    }
  }

  private async checkForNewDispatches(): Promise<{
    newDispatches: number
    lastDispatchTime: number
  }> {
    const fetchTimer = this.routineContext.logger.perf.start({
      id: 'checkForNewDispatches',
      onStart: () => {
        this.routineContext.logger.info(
          'Checking for new dispatches from FirstDue'
        )
      },
      printf: (duration: number) =>
        `Checked for new dispatches in ${duration}ms`,
    })

    try {
      const url = new URL(`${config.firstdueApiUrl}/dispatches`)
      const lastDispatchTime = await this.getLastDispatchTime()

      if (!lastDispatchTime) {
        this.routineContext.logger.info(
          'No last dispatch time found, will fetch recent dispatches'
        )
      } else {
        url.searchParams.set(
          'since',
          this.createIsoDateWithOffset(lastDispatchTime)
        )
        this.routineContext.logger.info(
          `Fetching dispatches since: ${formatTimezoneDate(
            new Date(lastDispatchTime)
          )}`
        )
      }

      this.routineContext.logger.debug(`API URL: ${url.toString()}`)

      this.stats.apiCallCount++
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.firstdueApiKey}`,
        },
      })

      if (!response.ok) {
        this.routineContext.logger.error(
          `FirstDue API error: ${response.status} ${response.statusText}`
        )
        this.stats.errorCount++
        return { newDispatches: 0, lastDispatchTime }
      }

      const data: FirstDueDispatch[] = await response.json()
      this.stats.lastFetchTime = formatDateTime(new Date())

      if (data.length === 0) {
        this.routineContext.logger.info('No new dispatches found')
        return { newDispatches: 0, lastDispatchTime }
      }

      this.routineContext.logger.info(`Found ${data.length} new dispatches`)
      const parsedData: PostDispatch[] = data.map((dispatch) =>
        this.parseFirstDueDispatch(dispatch)
      )
      await this.insertDispatches(parsedData)

      this.stats.totalFetched += data.length

      return { newDispatches: data.length, lastDispatchTime }
    } finally {
      fetchTimer.end()
    }
  }

  private async insertDispatches(dispatches: PostDispatch[]): Promise<void> {
    const insertTimer = this.routineContext.logger.perf.start({
      id: 'insertDispatches',
      printf: (duration: number) =>
        `Inserted ${dispatches.length} dispatches in ${duration}ms`,
    })

    try {
      const result = await this.routineContext.client.mutation(
        api.dispatches.createDispatchs,
        { dispatches }
      )

      this.stats.totalInserted += result.length
      this.lastDispatchTimeInvalid = true

      this.routineContext.logger.info(
        `Successfully inserted ${result.length} dispatches`
      )
    } finally {
      insertTimer.end()
    }
  }
}
