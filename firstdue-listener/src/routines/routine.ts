import { RoutineLogger } from '@/logger'
import { RoutineContext } from '@/context/RoutineContext'

export interface RoutineStatus {
  running: boolean
  interval: number
  name: string
  lastExecution?: string
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

  constructor(name: string, context: typeof RoutineContext) {
    this.name = name
    this.ctx = new context(this.name)
  }

  start(): void {
    if (this.isRunning) {
      this.ctx.logger.logAlreadyRunning()
      return
    }

    this.ctx.logger.logStart(this.interval)
    this.isRunning = true

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
      this.stopReason = {
        error: e,
        message: e?.message || '',
      }
    }
  }

  private async executeRoutine(): Promise<void> {
    this.lastExecution = new Date()
    const timer = this.ctx.logger.perf.start({
      id: `${this.name}:executeRoutine`,
      startLog: () => {
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

  getStatus(): RoutineStatus {
    return {
      running: this.isRunning,
      interval: this.interval,
      name: this.name,
      lastExecution: this.lastExecution?.toISOString(),
      stopReason: this.stopReason,
    }
  }
}
