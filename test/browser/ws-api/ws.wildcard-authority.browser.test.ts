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

/**
 * @note Engines disagree on `new URL('ws://*')`: Chromium percent-encodes the
 * wildcard host, WebKit and Node preserve it. These must run in a browser to
 * exercise the encoding path.
 */
test('matches any host against a wildcard authority', async ({
  loadExample,
  page,
}) => {
  await loadExample(new URL('./ws.runtime.js', import.meta.url), {
    skipActivation: true,
  })

  await page.evaluate(async () => {
    const { setupWorker, ws } = window.msw
    const service = ws.link('ws://*')

    const worker = setupWorker(
      service.addEventListener('connection', ({ client }) => {
        client.addEventListener('message', () => client.send('hello from mock'))
      }),
    )
    await worker.start()
  })

  const clientMessage = await page.evaluate(() => {
    const socket = new WebSocket('ws://example.com/chat')
    return new Promise((resolve, reject) => {
      socket.onopen = () => socket.send('hello')
      socket.onmessage = (event) => resolve(event.data)
      socket.onerror = reject
    })
  })

  expect(clientMessage).toBe('hello from mock')
})

test('normalises the scheme of a wildcard authority', async ({
  loadExample,
  page,
}) => {
  await loadExample(new URL('./ws.runtime.js', import.meta.url), {
    skipActivation: true,
  })

  await page.evaluate(async () => {
    const { setupWorker, ws } = window.msw
    const service = ws.link('http://*')

    const worker = setupWorker(
      service.addEventListener('connection', ({ client }) => {
        client.addEventListener('message', () => client.send('hello from mock'))
      }),
    )
    await worker.start()
  })

  const clientMessage = await page.evaluate(() => {
    const socket = new WebSocket('ws://example.com/chat')
    return new Promise((resolve, reject) => {
      socket.onopen = () => socket.send('hello')
      socket.onmessage = (event) => resolve(event.data)
      socket.onerror = reject
    })
  })

  expect(clientMessage).toBe('hello from mock')
})
