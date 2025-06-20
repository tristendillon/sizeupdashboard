import { ConvexClient } from 'convex/browser'

const url = process.env.CONVEX_URL

if (!url) {
  throw new Error('CONVEX_URL is not set')
}

const client = new ConvexClient(url)

export { client }
