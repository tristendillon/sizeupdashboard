import { config } from '@/config'

export interface RoutineStatus {
  running: boolean
  interval: number
  name: string
  lastExecution?: string
}

export abstract class BaseRoutine {
  protected intervalId: NodeJS.Timeout | null = null
  protected isRunning = false
  protected lastExecution?: Date

  abstract readonly name: string
  protected abstract readonly interval: number

  start(): void {
    if (this.isRunning) {
      console.log(`${this.name} routine already running`)
      return
    }

    console.log(
      `Starting ${this.name} routine with ${this.interval}ms interval`
    )
    this.isRunning = true

    this.intervalId = setInterval(() => {
      this.executeRoutine()
    }, this.interval)
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
      this.isRunning = false
      console.log(`${this.name} routine stopped`)
    }
  }

  private executeRoutine(): void {
    this.lastExecution = new Date()
    const timestamp = this.lastExecution.toISOString()
    console.log(`[${timestamp}] ${this.name} routine execution started`)

    try {
      this.execute()
    } catch (error) {
      console.error(`Error in ${this.name} routine:`, error)
    }
  }

  protected abstract execute(): void | Promise<void>

  getStatus(): RoutineStatus {
    return {
      running: this.isRunning,
      interval: this.interval,
      name: this.name,
      lastExecution: this.lastExecution?.toISOString(),
    }
  }
}
