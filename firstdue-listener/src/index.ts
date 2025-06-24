import { createApp } from '@/app'
import { config } from '@/config'
import { BaseLogger } from '@/logger'

const { app, routines } = createApp()
const logger = new BaseLogger('Server')

function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}. Shutting down gracefully...`)
  routines.forEach((routine) => routine.stop())
  process.exit(0)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

app.listen(config.port, () => {
  logger.info(`Server running on port ${config.port}`)
  logger.info(`Environment: ${config.environment}`)

  routines.forEach(async (routine) => await routine.start())
})
