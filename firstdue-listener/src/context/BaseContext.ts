import { BaseLogger } from '@/logger'
import { client } from '@sizeupdashboard/convex/lib'

export class BaseContext {
  public logger: BaseLogger
  public client: typeof client

  constructor(context?: string) {
    this.logger = new BaseLogger(context)
    this.client = client
  }

  getLogger(): BaseLogger {
    return this.logger
  }

  getClient(): typeof client {
    return this.client
  }
}
