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
import { Doc } from '@sizeupdashboard/convex/api/_generated/dataModel'

const DISPATCH_INTERVAL = 5000
const DISPATCH_NAME = 'Dispatch'
// This is the distance in ms from the last dispatch time to continue diffing the nfirs data from the inital dispatch
// data to the nfirs data.
const DISTANCE_TO_CONTINUE_DIFFING = 60 * 5 * 1000 // 5 minutes

interface DiffResult {
  hasDiff: boolean
  // key is the json path so "dispatch_number" or "aid_fdid_numbers[0]" or "timestamp.cst" (fake keys used for example)
  // and the value is the new value of the diff
  diff: Record<string, unknown>
}

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 5,
  baseDelayMs: 1000, // Start with 1 second
  maxDelayMs: 30000, // Cap at 30 seconds
  backoffMultiplier: 2,
  jitterMax: 0.1, // Add up to 10% jitter
}

interface FirstDueNfirsNotification {
  id: number
  dispatch_number: string
  incident_number: string
  dispatch_type: string
  dispatch_incident_type_code: string
  alarm_at: string
  dispatch_notified_at: string
  alarms: number
  place_name: string
  location_info: string
  venue: string
  address: string
  unit: string
  cross_streets: string
  city: string
  state_code: string
  zip_code: string
  latitude: number
  longitude: number
  narratives: string
  shift_name: string
  notification_type: string
  aid_type_code: number
  aid_fdid_number: string
  aid_fdid_numbers: string[]
  controlled_at: string
  officer_in_charge: string
  call_completed_at: string
  zone: string
  ems_incident_number: string
  ems_response_number: string
  station: string
  emd_card_number: string
}

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

interface RetryStats {
  totalRetryAttempts: number
  successfulRetries: number
  failedRetries: number
  longestBackoffMs: number
}

interface DispatchStats {
  totalFetched: number
  totalInserted: number
  lastSyncTime?: FormattedDateTime
  lastFetchTime?: FormattedDateTime
  apiCallCount: number
  errorCount: number
  retryStats: RetryStats
}

export class DispatchRoutineRouter extends RoutineRouter {
  protected readonly interval: number = DISPATCH_INTERVAL
  private latestDispatchData: Doc<'dispatches'>
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
      retryStats: {
        totalRetryAttempts: 0,
        successfulRetries: 0,
        failedRetries: 0,
        longestBackoffMs: 0,
      },
    }
  }

  /**
   * Exponential backoff with jitter
   */
  private calculateBackoffDelay(attempt: number): number {
    const exponentialDelay =
      RETRY_CONFIG.baseDelayMs *
      Math.pow(RETRY_CONFIG.backoffMultiplier, attempt)
    const cappedDelay = Math.min(exponentialDelay, RETRY_CONFIG.maxDelayMs)

    // Add jitter to prevent thundering herd
    const jitter = cappedDelay * RETRY_CONFIG.jitterMax * Math.random()
    const finalDelay = cappedDelay + jitter

    return Math.round(finalDelay)
  }

  /**
   * Sleep utility for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Determine if an error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof TypeError && error.message === 'fetch failed') {
      // Check the cause for specific network errors
      const cause = (error as any).cause
      if (cause) {
        // Retry on connection timeouts, connection refused, DNS errors, etc.
        return (
          cause.code === 'UND_ERR_CONNECT_TIMEOUT' ||
          cause.code === 'ECONNREFUSED' ||
          cause.code === 'ENOTFOUND' ||
          cause.code === 'ECONNRESET' ||
          cause.code === 'ETIMEDOUT'
        )
      }
      return true // Generic fetch failed, assume retryable
    }

    // Also retry on HTTP 5xx errors and 429 (rate limit)
    if (error instanceof Error && error.message.includes('Failed to fetch')) {
      return true
    }

    return false
  }

  /**
   * Enhanced fetch with exponential backoff retry logic
   */
  private async fetchWithRetry(url: URL, options: RequestInit) {
    let lastError: unknown

    for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
      try {
        this.stats.apiCallCount++

        if (attempt > 0) {
          this.stats.retryStats.totalRetryAttempts++
          this.ctx.logger.info(
            `Retry attempt ${attempt}/${
              RETRY_CONFIG.maxRetries
            } for ${url.toString()}`
          )
        }

        const response = await fetch(url, options)

        // Check for HTTP errors that should trigger retry
        if (!response.ok) {
          const statusCode = response.status
          if (statusCode >= 500 || statusCode === 429) {
            throw new Error(`HTTP ${statusCode}: ${response.statusText}`)
          }
          // For 4xx errors (except 429), don't retry
          throw new Error(`HTTP ${statusCode}: ${response.statusText}`)
        }

        if (attempt > 0) {
          this.stats.retryStats.successfulRetries++
          this.ctx.logger.info(`Retry succeeded on attempt ${attempt}`)
        }

        return response
      } catch (error) {
        lastError = error

        // If this is the last attempt or error is not retryable, throw
        if (
          attempt === RETRY_CONFIG.maxRetries ||
          !this.isRetryableError(error)
        ) {
          if (attempt > 0) {
            this.stats.retryStats.failedRetries++
          }
          this.stats.errorCount++
        }

        // Calculate backoff delay
        const delayMs = this.calculateBackoffDelay(attempt)
        this.stats.retryStats.longestBackoffMs = Math.max(
          this.stats.retryStats.longestBackoffMs,
          delayMs
        )

        this.ctx.logger.warn(
          `Fetch failed (attempt ${attempt + 1}/${
            RETRY_CONFIG.maxRetries + 1
          }), retrying in ${delayMs}ms`,
          { error: error instanceof Error ? error.message : String(error) }
        )

        await this.sleep(delayMs)
      }
    }

    // This should never be reached, but just in case
    throw lastError
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
    await this.updateNfirsData()
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

  private async handleFullSync(req: Request, res: Response): Promise<void> {
    if (this.isSyncing) {
      res.status(400).json({
        message: 'Sync already in progress',
      })
      return
    }
    this.ctx.logger.info('Manual full sync requested via API')
    this.isSyncing = true
    await this.stop('Manual full sync requested via API')
    try {
      this.syncAllDispatches().then(async (result) => {
        this.ctx.logger.info(
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
      retryConfig: RETRY_CONFIG,
    })
  }

  private async handleTestConnection(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      await this.validateConfiguration()

      const testTimer = this.ctx.logger.perf.start({
        id: 'testFirstDueConnection',
        printf: (duration: number) =>
          `FirstDue API connection test completed in ${duration}ms`,
      })

      const url = new URL(`${config.firstdueApiUrl}/dispatches`)
      url.searchParams.set('page', '1')

      // Use the retry logic for the test connection
      const response = await this.fetchWithRetry(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.firstdueApiKey}`,
        },
      })

      testTimer.end()

      const data = await response.json()

      res.json({
        message: 'FirstDue API connection successful',
        status: response.status,
        sampleDataCount: Array.isArray(data) ? data.length : 0,
        headers: Object.fromEntries(response.headers.entries()),
        retryStats: this.stats.retryStats,
      })
    } catch (error) {
      this.stats.errorCount++
      throw error
    }
  }

  // ==================== CORE BUSINESS LOGIC (UPDATED) ====================

  private async diffLatestDispatchToNfirs(
    data: FirstDueNfirsNotification
  ): Promise<DiffResult> {
    const diff: Record<string, unknown> = {}
    let hasDiff = false

    // Helper function to safely compare values
    const compareAndSetDiff = (
      jsonPath: string,
      newValue: unknown,
      oldValue: unknown
    ) => {
      // Handle null/undefined comparisons
      const normalizedNew = newValue === null ? undefined : newValue
      const normalizedOld = oldValue === null ? undefined : oldValue

      if (normalizedNew !== normalizedOld) {
        diff[jsonPath] = newValue
        hasDiff = true
      }
    }

    // Compare narratives -> narrative
    compareAndSetDiff(
      'narrative',
      data.narratives,
      this.latestDispatchData.narrative
    )

    // Compare dispatch_type -> type
    compareAndSetDiff('type', data.dispatch_type, this.latestDispatchData.type)

    // Compare address -> address
    compareAndSetDiff('address', data.address, this.latestDispatchData.address)

    // Compare city -> city
    compareAndSetDiff('city', data.city, this.latestDispatchData.city)

    // Compare state_code -> stateCode
    compareAndSetDiff(
      'stateCode',
      data.state_code,
      this.latestDispatchData.stateCode
    )

    // Compare latitude -> latitude
    compareAndSetDiff(
      'latitude',
      Number(data.latitude),
      this.latestDispatchData.latitude
    )

    // Compare longitude -> longitude
    compareAndSetDiff(
      'longitude',
      Number(data.longitude),
      this.latestDispatchData.longitude
    )

    // Note: aid_fdid_numbers and unitCodes represent different data structures
    // (NFIRS FDID numbers vs database IDs), so we don't compare them directly

    // Compare dispatch_incident_type_code -> incidentTypeCode
    compareAndSetDiff(
      'incidentTypeCode',
      data.dispatch_incident_type_code,
      this.latestDispatchData.incidentTypeCode
    )

    return {
      hasDiff,
      diff,
    }
  }

  private async updateNfirsData(): Promise<void> {
    if (!this.latestDispatchData || !this.latestDispatchData.xrefId) {
      return
    }

    if (this.lastDispatchTime < Date.now() - DISTANCE_TO_CONTINUE_DIFFING) {
      return
    }

    this.ctx.logger.info(
      `Diffing NFIRS data for dispatch ${this.latestDispatchData.xrefId}`
    )

    const xrefId = this.latestDispatchData.xrefId
    const url = new URL(
      `${config.firstdueApiUrl}/nfirs-notifications/dispatch-number/${xrefId}`
    )
    const response = await this.fetchWithRetry(url, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.firstdueApiKey}`,
      },
    })
    if (!response.ok) {
      this.ctx.logger.warn(
        `Failed to fetch NFIRS data for dispatch ${xrefId}: ${response.statusText}`
      )
      return
    }
    const data = (await response.json()) as FirstDueNfirsNotification
    const { hasDiff, diff } = await this.diffLatestDispatchToNfirs(data)
    if (hasDiff) {
      this.ctx.logger.info(`Diff found for dispatch ${xrefId}`)
      for (const [key, value] of Object.entries(diff)) {
        this.latestDispatchData[key] = value
      }
      await this.ctx.client.mutation(api.dispatches.updateDispatch, {
        id: this.latestDispatchData._id,
        diff,
      })
    }
  }

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
    const syncTimer = this.ctx.logger.perf.start({
      id: 'syncAllDispatches',
      printf: (duration: number) =>
        `Full dispatch sync completed in ${duration}ms`,
    })

    try {
      // Clear existing dispatches in batches
      let clearedCount = 0
      let clearedDispatches = true

      this.ctx.logger.info(
        'Starting full dispatch sync - clearing existing dispatches'
      )

      while (clearedDispatches) {
        const batchCleared = await this.ctx.client.mutation(
          api.dispatches.paginatedClearDispatches,
          { numItems: 1000 }
        )
        clearedDispatches = batchCleared
        if (batchCleared) clearedCount += 1000
      }

      this.ctx.logger.info(`Cleared approximately ${clearedCount} dispatches`)
      this.lastDispatchTimeInvalid = true

      // Fetch all dispatches with pagination
      const allDispatches = await this.fetchAllDispatchesWithPagination()

      if (allDispatches.length === 0) {
        this.ctx.logger.info('No dispatches found during full sync')
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
      this.ctx.logger.info(
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

      this.ctx.logger.info(`Fetching page ${page} from FirstDue API`)

      const fetchTimer = this.ctx.logger.perf.start({
        id: `fetchDispatchesPage${page}`,
        printf: (duration: number) => `Fetched page ${page} in ${duration}ms`,
      })

      try {
        // Use fetchWithRetry instead of direct fetch
        const response = await this.fetchWithRetry(url, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.firstdueApiKey}`,
          },
        })

        const data: FirstDueDispatch[] = await response.json()
        const pagination = this.parseLinkHeader(response.headers.get('Link'))

        this.ctx.logger.debug(
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
        await this.sleep(1000)
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

    const queryTimer = this.ctx.logger.perf.start({
      id: 'getLastDispatchTime',
      printf: (duration: number) =>
        `Retrieved last dispatch time in ${duration}ms`,
    })

    try {
      const lastDispatchData = await this.ctx.client.query(
        api.dispatches.getLastDispatchData,
        {}
      )

      if (!lastDispatchData) {
        return 0
      }

      this.lastDispatchTime = lastDispatchData.dispatchCreatedAt
      this.lastDispatchTimeInvalid = false
      this.latestDispatchData = lastDispatchData

      this.ctx.logger.debug(
        `Last dispatch time: ${
          this.lastDispatchTime
            ? formatTimezoneDate(new Date(this.lastDispatchTime))
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
    const fetchTimer = this.ctx.logger.perf.start({
      id: 'checkForNewDispatches',
      onStart: () => {
        this.ctx.logger.info('Checking for new dispatches from FirstDue')
      },
      printf: (duration: number) =>
        `Checked for new dispatches in ${duration}ms`,
    })

    try {
      const url = new URL(`${config.firstdueApiUrl}/dispatches`)
      const lastDispatchTime = await this.getLastDispatchTime()

      if (!lastDispatchTime) {
        this.ctx.logger.info(
          'No last dispatch time found, will fetch recent dispatches'
        )
      } else {
        url.searchParams.set(
          'since',
          this.createIsoDateWithOffset(lastDispatchTime)
        )
        this.ctx.logger.info(
          `Fetching dispatches since: ${formatTimezoneDate(
            new Date(lastDispatchTime)
          )}`
        )
      }

      this.ctx.logger.debug(`API URL: ${url.toString()}`)

      // Use fetchWithRetry instead of direct fetch
      const response = await this.fetchWithRetry(url, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.firstdueApiKey}`,
        },
      })

      const data = await response.json()
      this.stats.lastFetchTime = formatDateTime(new Date())

      if (data.length === 0) {
        this.ctx.logger.info('No new dispatches found')
        return { newDispatches: 0, lastDispatchTime }
      }

      this.ctx.logger.info(`Found ${data.length} new dispatches`)
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
    const insertTimer = this.ctx.logger.perf.start({
      id: 'insertDispatches',
      printf: (duration: number) =>
        `Inserted ${dispatches.length} dispatches in ${duration}ms`,
    })

    try {
      const result = await this.ctx.client.mutation(
        api.dispatches.createDispatchs,
        { dispatches }
      )

      this.stats.totalInserted += result.length
      this.lastDispatchTimeInvalid = true

      this.ctx.logger.info(`Successfully inserted ${result.length} dispatches`)
    } finally {
      insertTimer.end()
    }
  }
}
