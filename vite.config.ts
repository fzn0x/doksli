import type { ServerResponse } from 'node:http'
import react from '@vitejs/plugin-react'
import { type Connect, defineConfig, type Plugin } from 'vite'
import { GET } from './api/tweet.ts'

/** Serves api/tweet.ts locally so `vite` and `vite preview` match the Vercel deployment. */
function tweetApi(): Plugin {
  const handle = async (req: Connect.IncomingMessage, res: ServerResponse) => {
    const response = await GET(
      new Request(new URL(req.originalUrl ?? req.url ?? '/', 'http://localhost')),
    )
    res.statusCode = response.status
    response.headers.forEach((value, key) => {
      res.setHeader(key, value)
    })
    res.end(await response.text())
  }
  return {
    name: 'doksli-tweet-api',
    configureServer(server) {
      server.middlewares.use('/api/tweet', handle)
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/tweet', handle)
    },
  }
}

export default defineConfig({
  plugins: [react(), tweetApi()],
})
