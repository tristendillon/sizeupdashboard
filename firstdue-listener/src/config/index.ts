import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
dotenv.config({ path: '.env' })

export type LogLevel = 'error' | 'warn' | 'info' | 'timer' | 'debug' | 'verbose'
export type Environment = 'development' | 'production' | 'test'

export const config = {
  port: parseInt(process.env.PORT || '8080', 10),
  environment: (process.env.NODE_ENV || 'development') as Environment,
  timezone: process.env.TIMEZONE || 'America/Chicago',
  logLevel: (process.env.LOG_LEVEL ||
    (process.env.NODE_ENV === 'development' ? 'debug' : 'info')) as LogLevel,
  firstdueApiKey: process.env.FIRSTDUE_API_KEY,
  firstdueApiUrl: 'https://sizeup.firstduesizeup.com/fd-api/v1',
}
