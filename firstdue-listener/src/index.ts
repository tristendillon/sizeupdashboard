import { createApp } from '@/app'
import { config } from '@/config'

const { app, dispatchListener } = createApp()

function gracefulShutdown(signal: string) {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`)
  dispatchListener.stop()
  process.exit(0)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`)
  console.log(`Environment: ${config.environment}`)

  dispatchListener.start()
})
