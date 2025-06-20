import { BaseLogger, LogMeta } from './BaseLogger'

export class RoutineLogger extends BaseLogger {
  private routineName: string

  constructor(routineName: string) {
    super(`Routine:${routineName}`)
    this.routineName = routineName
  }

  logStart(interval: number): void {
    this.info(
      `Starting ${this.routineName} routine with ${interval}ms interval`
    )
  }

  logStop(): void {
    this.info(`${this.routineName} routine stopped`)
  }

  logExecution(timestamp: string): void {
    this.info(`${this.routineName} routine execution started`, { timestamp })
  }

  logExecutionError(error: Error | unknown): void {
    const errorMeta: LogMeta = {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }
    this.error(
      `Error: ${errorMeta.error} in ${this.routineName} routine`,
      errorMeta
    )
  }

  logAlreadyRunning(): void {
    this.warn(`${this.routineName} routine already running`)
  }
}
