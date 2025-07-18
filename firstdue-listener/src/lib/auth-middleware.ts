import { Request, Response, NextFunction } from 'express'
import { config } from '@/config'
import { BaseLogger } from '@/logger'

const logger = new BaseLogger('auth-middleware')

/**
 * Authentication middleware that checks for API key in query parameters
 * Looks for 'API_KEY' parameter and compares it to the configured API key
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  // If no API key is configured, warn and allow access
  if (!config.appApiKey) {
    logger.warn(
      'No API key configured (API_KEY environment variable). API will be open with no authentication.',
      {
        path: req.path,
        method: req.method,
        ip: req.ip,
      }
    )
    next()
    return
  }

  // Extract API key from query parameters
  const providedApiKey = req.query.API_KEY as string

  // Check if API key was provided
  if (!providedApiKey) {
    logger.warn('API key required but not provided', {
      path: req.path,
      method: req.method,
      ip: req.ip,
    })
    res.status(401).json({
      error: 'Unauthorized',
      message: 'API key required. Please provide API_KEY as a query parameter.',
      timestamp: new Date().toISOString(),
    })
    return
  }

  // Validate API key
  if (providedApiKey !== config.appApiKey) {
    logger.warn('Invalid API key provided', {
      path: req.path,
      method: req.method,
      ip: req.ip,
      providedKey: providedApiKey.substring(0, 4) + '***', // Log only first 4 chars for security
    })
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid API key provided.',
      timestamp: new Date().toISOString(),
    })
    return
  }

  // API key is valid, proceed
  logger.debug('API key validated successfully', {
    path: req.path,
    method: req.method,
    ip: req.ip,
  })
  
  next()
}

/**
 * Optional middleware that can be used for routes that don't require authentication
 * but should log access attempts
 */
export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const providedApiKey = req.query.API_KEY as string
  
  if (config.appApiKey && providedApiKey && providedApiKey === config.appApiKey) {
    logger.debug('Authenticated access', {
      path: req.path,
      method: req.method,
      ip: req.ip,
    })
  } else {
    logger.info('Unauthenticated access', {
      path: req.path,
      method: req.method,
      ip: req.ip,
    })
  }
  
  next()
}