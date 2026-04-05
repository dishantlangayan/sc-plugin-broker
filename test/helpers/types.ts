import type {BrokerAuth} from '@dishantlangayan/sc-cli-core'
import type {SinonSandbox, SinonStub} from 'sinon'

/**
 * Options for creating a mock BrokerAuth instance
 */
export interface MockBrokerOptions {
  accessToken?: string
  authType?: string
  isSolaceCloud?: boolean
  msgVpnName?: string
  name?: string
  sempEndpoint?: string
  sempPort?: number
}

/**
 * Mock BrokerAuthManager with stubbed methods
 */
export interface MockBrokerAuthManager {
  addBroker?: SinonStub
  brokerExists: SinonStub
  createConnection: SinonStub
  getBroker: SinonStub
  getDefaultBroker: SinonStub
  setDefaultBroker?: SinonStub
  updateBroker?: SinonStub
}

/**
 * Mock ScConnection with HTTP method stubs
 */
export interface MockConnection {
  delete?: SinonStub
  get?: SinonStub
  patch?: SinonStub
  post?: SinonStub
}

/**
 * Options for building paginated responses
 */
export interface PaginatedResponseOptions<T = unknown> {
  cursorQuery?: string
  data: T[]
  hasNextPage?: boolean
  responseCode?: number
}

/**
 * Options for building simple responses
 */
export interface SimpleResponseOptions<T = unknown> {
  data: T
  responseCode?: number
}

/**
 * Complete test context with sandbox and all mocks
 */
export interface TestContext {
  cleanup: () => void
  mockBroker: BrokerAuth
  mockBrokerAuthManager: MockBrokerAuthManager
  mockConnection: MockConnection
  sandbox: SinonSandbox
}
