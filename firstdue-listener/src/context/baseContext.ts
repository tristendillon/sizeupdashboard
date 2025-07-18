import { config } from '@/config'
import { BaseLogger } from '@/logger'
import { client } from '@sizeupdashboard/convex/lib'

export class BaseContext {
  public logger: BaseLogger
  public client: ReturnType<typeof client>

  constructor(context?: string) {
    this.logger = new BaseLogger(context)
    this.client = client(config.convexUrl)
  }
}
