import type { ws } from 'msw'
import type { setupWorker } from 'msw/browser'
import { test, expect } from '../playwright.extend'

declare global {
  interface Window {
    msw: {
      ws: typeof ws
      setupWorker: typeof setupWorker
    }
  }
}

test('matches any host given a wildcard host with a scheme', async ({
  loadExample,
  page,
}) => {
  await loadExample(new URL('./ws.runtime.js', import.meta.url), {
    skipActivation: true,
  })

  await page.evaluate(async () => {
    const { setupWorker, ws } = window.msw
    // A wildcard host behind a scheme, as opposed to the bare "*" every other
    // test uses. Chromium resolves this to "ws://%2A", which matches no host.
    const service = ws.link('ws://*')

    const worker = setupWorker(
      service.addEventListener('connection', ({ client }) => {
        client.addEventListener('message', (event) => {
          if (event.data === 'hello') {
            client.send('hello from mock')
          }
        })
      }),
    )
    await worker.start()
  })

  const clientMessage = await page.evaluate(() => {
    const socket = new WebSocket('ws://localhost:5000/socket.io/')
    return new Promise((resolve, reject) => {
      socket.onopen = () => socket.send('hello')
      socket.onmessage = (event) => resolve(event.data)
      socket.onerror = () => reject(new Error('connection failed'))
    })
  })

  expect(clientMessage).toBe('hello from mock')
})
