import { RoutineLogger } from '@/logger'
import { RoutineContext } from '@/context/RoutineContext'
import { config } from '@/config'

export interface RoutineStatus {
  running: boolean
  interval: {
    ms: number
    formatted: string
  }
  name: string
  lastExecution?: {
    iso: string
    tz: string
  }
  nextExecution?: {
    iso: string
    tz: string
  }
  stopReason?: RoutineStopReason
}
interface RoutineStopReason {
  error: Error | null
  message: string
}

export abstract class BaseRoutine {
  protected intervalId: NodeJS.Timeout | null = null
  protected isRunning = false
  protected lastExecution?: Date
  protected ctx: RoutineContext
  protected stopReason?: RoutineStopReason
  readonly name: string
  protected abstract readonly interval: number
  protected startFn?: () => Promise<void> | void
  protected startedAt?: Date
  constructor(
    name: string,
    context: typeof RoutineContext,
    options?: {
      onStart?: () => Promise<void> | void
    }
  ) {
    this.name = name
    this.startedAt = new Date()
    this.ctx = new context(this.name)
    this.startFn = options?.onStart
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      this.ctx.logger.logAlreadyRunning()
      return
    }

    this.ctx.logger.logStart(this.interval)
    this.isRunning = true

    if (this.startFn) {
      await this.startFn()
    }

    await this.executeRoutine()
    this.intervalId = setInterval(async () => {
      await this.executeRoutine()
    }, this.interval)
  }

  stop(e: Error | null = null): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
      this.isRunning = false
      this.ctx.logger.logStop()
      if (e) {
        this.stopReason = {
          error: e,
          message: e?.message || '',
        }
      }
    }
  }

  private async executeRoutine(): Promise<void> {
    this.lastExecution = new Date()
    const timer = this.ctx.logger.perf.start({
      id: `${this.name}:executeRoutine`,
      onStart: () => {
        this.ctx.logger.info(`Executing routine ${this.name}...`)
      },
      printf: (duration: number) => {
        return `Executed routine in ${duration}ms`
      },
    })
    try {
      await this.execute()
    } catch (error) {
      this.ctx.logger.logExecutionError(error)
      this.stop(error as Error)
    } finally {
      timer.end()
    }
  }

  protected abstract execute(): void | Promise<void>

  private formatInterval(interval: number): string {
    const ms = interval

    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    const remainingHours = hours % 24
    const remainingMinutes = minutes % 60
    const remainingSeconds = seconds % 60

    const parts: string[] = []

    if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`)
    if (remainingHours > 0)
      parts.push(`${remainingHours} hour${remainingHours !== 1 ? 's' : ''}`)
    if (remainingMinutes > 0)
      parts.push(
        `${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`
      )
    if (remainingSeconds > 0 && parts.length === 0) {
      // only include seconds if no larger units were added
      parts.push(`${remainingSeconds}s`)
    }

    if (parts.length > 1) {
      const last = parts.pop()
      return parts.join(', ') + ' and ' + last
    }

    return parts[0] || `${ms}ms`
  }

  getStatus(): RoutineStatus {
    const next = new Date(
      (this.lastExecution?.getTime() || this.startedAt?.getTime() || 0) +
        this.interval
    )
    return {
      running: this.isRunning,
      interval: {
        ms: this.interval,
        formatted: this.formatInterval(this.interval),
      },
      name: this.name,
      lastExecution: this.lastExecution
        ? {
            iso: this.lastExecution.toISOString(),
            tz:
              this.lastExecution.toLocaleString('en-US', {
                timeZone: config.timezone,
              }) || '',
          }
        : undefined,
      nextExecution: {
        iso: next.toISOString(),
        tz:
          next.toLocaleString('en-US', {
            timeZone: config.timezone,
          }) || '',
      },
      stopReason: this.stopReason,
    }
  }
}
