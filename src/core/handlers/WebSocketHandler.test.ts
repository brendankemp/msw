import { WebSocketHandler } from './WebSocketHandler'

describe('parse', () => {
  it('matches an exact url', () => {
    expect(
      new WebSocketHandler('ws://localhost:3000').parse({
        url: new URL('ws://localhost:3000'),
      }),
    ).toEqual({
      match: {
        matches: true,
        params: {},
      },
    })
  })

  it('ignores trailing slash', () => {
    expect(
      new WebSocketHandler('ws://localhost:3000').parse({
        url: new URL('ws://localhost:3000/'),
      }),
    ).toEqual({
      match: {
        matches: true,
        params: {},
      },
    })

    expect(
      new WebSocketHandler('ws://localhost:3000/').parse({
        url: new URL('ws://localhost:3000/'),
      }),
    ).toEqual({
      match: {
        matches: true,
        params: {},
      },
    })
  })

  it('supports path parameters', () => {
    expect(
      new WebSocketHandler('ws://localhost:3000/:serviceName').parse({
        url: new URL('ws://localhost:3000/auth'),
      }),
    ).toEqual({
      match: {
        matches: true,
        params: {
          serviceName: 'auth',
        },
      },
    })
  })

  it('ignores "/socket.io/" prefix in the client url', () => {
    expect(
      new WebSocketHandler('ws://localhost:3000').parse({
        url: new URL(
          'ws://localhost:3000/socket.io/?EIO=4&transport=websocket',
        ),
      }),
    ).toEqual({
      match: {
        matches: true,
        params: {},
      },
    })

    expect(
      new WebSocketHandler('ws://localhost:3000/non-matching').parse({
        url: new URL(
          'ws://localhost:3000/socket.io/?EIO=4&transport=websocket',
        ),
      }),
    ).toEqual({
      match: {
        matches: false,
        params: {},
      },
    })
  })

  it('preserves non-prefix "/socket.io/" path segment', () => {
    /**
     * @note It is highly unlikely but we still shouldn't modify the
     * WebSocket client URL if it contains a user-defined "socket.io" segment.
     */
    expect(
      new WebSocketHandler('ws://localhost:3000/clients/socket.io/123').parse({
        url: new URL('ws://localhost:3000/clients/socket.io/123'),
      }),
    ).toEqual({
      match: {
        matches: true,
        params: {},
      },
    })

    expect(
      new WebSocketHandler('ws://localhost:3000').parse({
        url: new URL('ws://localhost:3000/clients/socket.io/123'),
      }),
    ).toEqual({
      match: {
        matches: false,
        params: {},
      },
    })
  })

  it('supports a custom resolution context (base url)', () => {
    expect(
      new WebSocketHandler('/api/ws').parse({
        url: new URL('ws://localhost:3000/api/ws'),
        resolutionContext: {
          baseUrl: 'ws://localhost:3000/',
        },
      }),
    ).toEqual({
      match: {
        matches: true,
        params: {},
      },
    })
  })
})

describe('test', () => {
  it('returns true for a matching string', () => {
    expect(
      new WebSocketHandler('ws://localhost/ws').test('ws://localhost/ws'),
    ).toBe(true)
  })

  it('returns false for a non-matching string', () => {
    expect(
      new WebSocketHandler('ws://localhost/ws').test('ws://localhost/other'),
    ).toBe(false)
  })

  it('returns true for a relative matching string', () => {
    expect(
      new WebSocketHandler('ws://localhost/ws').test('/ws', {
        baseUrl: 'ws://localhost',
      }),
    ).toBe(true)
  })

  it('returns false for a relative non-matching string', () => {
    expect(
      new WebSocketHandler('ws://localhost/ws').test('/other', {
        baseUrl: 'ws://localhost',
      }),
    ).toBe(false)
  })

  it('returns true for a matching URL', () => {
    expect(
      new WebSocketHandler('ws://localhost/ws').test(
        new URL('ws://localhost/ws'),
      ),
    ).toBe(true)
  })

  it('returns false for a non-matching URL', () => {
    expect(
      new WebSocketHandler('ws://localhost/ws').test(
        new URL('ws://localhost/other'),
      ),
    ).toBe(false)
  })

  it('returns true for a matching HTTP url string', () => {
    expect(
      new WebSocketHandler('ws://localhost/ws').test('http://localhost/ws'),
    ).toBe(true)
  })

  it('returns false for a non-matching HTTP url string', () => {
    expect(
      new WebSocketHandler('ws://localhost/ws').test('http://localhost/other'),
    ).toBe(false)
  })

  it('returns true for any host given a wildcard host', () => {
    expect(new WebSocketHandler('ws://*').test('ws://localhost:5000')).toBe(
      true,
    )
    expect(new WebSocketHandler('ws://*').test('ws://example.com')).toBe(true)
  })

  it('returns true for any host given a bare wildcard', () => {
    expect(new WebSocketHandler('*').test('ws://example.com')).toBe(true)
  })

  // A wildcard in the path is not a wildcard authority, so these still resolve
  // against the base url and stay scoped to its host.
  it('scopes a relative path containing a wildcard to the base url', () => {
    expect(
      new WebSocketHandler('/ws/*').test('ws://localhost/ws/anything', {
        baseUrl: 'ws://localhost',
      }),
    ).toBe(true)

    expect(
      new WebSocketHandler('/ws/*').test('ws://elsewhere/ws/anything', {
        baseUrl: 'ws://localhost',
      }),
    ).toBe(false)
  })

  it('scopes an absolute path containing a wildcard to its host', () => {
    expect(
      new WebSocketHandler('ws://localhost/ws/*').test(
        'ws://localhost/ws/anything',
      ),
    ).toBe(true)

    expect(
      new WebSocketHandler('ws://localhost/ws/*').test(
        'ws://elsewhere/ws/anything',
      ),
    ).toBe(false)
  })

  it('normalizes the scheme of an HTTP url containing a wildcard path', () => {
    expect(
      new WebSocketHandler('http://localhost/ws/*').test(
        'ws://localhost/ws/anything',
      ),
    ).toBe(true)
  })

  it('ignores a trailing slash on a url containing a wildcard path', () => {
    expect(
      new WebSocketHandler('ws://localhost/ws/*/').test(
        'ws://localhost/ws/anything/',
      ),
    ).toBe(true)
  })
})
