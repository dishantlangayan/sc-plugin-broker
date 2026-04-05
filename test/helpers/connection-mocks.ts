import type {SinonSandbox} from 'sinon'

import type {MockConnection} from './types.js'

/**
 * HTTP methods that can be stubbed on a connection
 */
export type HttpMethod = 'delete' | 'get' | 'patch' | 'post'

/**
 * Create a mock ScConnection with specified HTTP method stubs
 *
 * @param sandbox - Sinon sandbox for creating stubs
 * @param methods - Array of HTTP methods to stub (e.g., ['post', 'get'])
 * @param defaultResolve - Optional default value for stubs to resolve with
 * @returns A mock connection with the specified method stubs
 *
 * @example
 * const conn = createMockConnection(sandbox, ['post'])
 * conn.post.resolves({ data: { queueName: 'test' }, meta: { responseCode: 200 } })
 *
 * @example
 * const conn = createMockConnection(
 *   sandbox,
 *   ['get', 'post'],
 *   { meta: { responseCode: 200 } }
 * )
 * // All methods pre-configured with default response
 */
export function createMockConnection(
  sandbox: SinonSandbox,
  methods: HttpMethod[] = ['get', 'post', 'patch', 'delete'],
  defaultResolve?: unknown,
): MockConnection {
  const connection: MockConnection = {}

  for (const method of methods) {
    connection[method] = sandbox.stub()
    if (defaultResolve !== undefined) {
      connection[method]!.resolves(defaultResolve)
    }
  }

  return connection
}
