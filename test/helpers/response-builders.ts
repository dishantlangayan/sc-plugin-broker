import type {PaginatedResponseOptions, SimpleResponseOptions} from './types.js'

/**
 * Build a paginated SEMP response for list operations
 *
 * @param options - Configuration for the paginated response
 * @returns A SEMP response object with pagination metadata
 *
 * @example
 * const response = buildPaginatedResponse({
 *   data: [{ queueName: 'q1' }, { queueName: 'q2' }],
 *   hasNextPage: true,
 *   cursorQuery: 'cursor=abc123'
 * })
 *
 * @example
 * const response = buildPaginatedResponse({
 *   data: [{ clientProfileName: 'profile1' }],
 *   responseCode: 200
 * })
 */
export function buildPaginatedResponse<T = unknown>(options: PaginatedResponseOptions<T>) {
  const {cursorQuery, data, hasNextPage = false, responseCode = 200} = options

  return {
    data,
    meta: {
      paging: {
        cursorQuery: hasNextPage ? cursorQuery : undefined,
      },
      responseCode,
    },
  }
}

/**
 * Build a simple SEMP response for create/update operations
 *
 * @param options - Configuration for the simple response
 * @returns A SEMP response object with data and metadata
 *
 * @example
 * const response = buildSimpleResponse({
 *   data: { queueName: 'testQueue', msgVpnName: 'default' }
 * })
 *
 * @example
 * const response = buildSimpleResponse({
 *   data: { clientProfileName: 'profile1' },
 *   responseCode: 201
 * })
 */
export function buildSimpleResponse<T = unknown>(options: SimpleResponseOptions<T>) {
  const {data, responseCode = 200} = options

  return {
    data,
    meta: {
      responseCode,
    },
  }
}

/**
 * Build a delete SEMP response (no data, just metadata)
 *
 * @param responseCode - HTTP response code (defaults to 200)
 * @returns A SEMP response object with only metadata
 *
 * @example
 * const response = buildDeleteResponse()
 * // Returns: { meta: { responseCode: 200 } }
 *
 * @example
 * const response = buildDeleteResponse(204)
 * // Returns: { meta: { responseCode: 204 } }
 */
export function buildDeleteResponse(responseCode = 200) {
  return {
    meta: {
      responseCode,
    },
  }
}
