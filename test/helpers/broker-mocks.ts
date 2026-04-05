import type {SinonSandbox} from 'sinon'

import {AuthType, type BrokerAuth, type ScConnection} from '@dishantlangayan/sc-cli-core'

import type {MockBrokerAuthManager, MockBrokerOptions, MockConnection} from './types.js'

/**
 * Create a standard mock BrokerAuth instance
 *
 * @param options - Optional configuration for the mock broker
 * @returns A mock BrokerAuth object with test credentials
 *
 * @example
 * const broker = createMockBroker()
 * // Returns: { accessToken: 'dGVzdDp0ZXN0', name: 'test-broker', ... }
 *
 * @example
 * const broker = createMockBroker({ name: 'my-broker', sempPort: 9000 })
 */
export function createMockBroker(options: MockBrokerOptions = {}): BrokerAuth {
  return {
    accessToken: options.accessToken ?? 'dGVzdDp0ZXN0', // base64 encoded "test:test"
    authType: (options.authType ?? AuthType.BASIC) as AuthType,
    msgVpnName: options.msgVpnName,
    name: options.name ?? 'test-broker',
    sempEndpoint: options.sempEndpoint ?? 'https://localhost',
    sempPort: options.sempPort ?? 8080,
  }
}

/**
 * Create a mock Solace Cloud BrokerAuth instance
 *
 * @param options - Optional configuration for the cloud broker
 * @returns A mock BrokerAuth object configured for Solace Cloud
 *
 * @example
 * const cloudBroker = createMockCloudBroker({ msgVpnName: 'my-vpn' })
 * // Returns: { isSolaceCloud: true, msgVpnName: 'my-vpn', ... }
 */
export function createMockCloudBroker(options: MockBrokerOptions = {}): BrokerAuth {
  return {
    ...createMockBroker(options),
    isSolaceCloud: true,
    msgVpnName: options.msgVpnName ?? 'default',
  }
}

/**
 * Create a mock default BrokerAuth instance
 *
 * @param options - Optional configuration for the default broker
 * @returns A mock BrokerAuth object configured as the default
 *
 * @example
 * const defaultBroker = createMockDefaultBroker()
 */
export function createMockDefaultBroker(options: MockBrokerOptions = {}): BrokerAuth {
  return createMockBroker({
    name: 'default-broker',
    ...options,
  })
}

/**
 * Create a complete mock BrokerAuthManager with all required stubs
 *
 * @param sandbox - Sinon sandbox for creating stubs
 * @param broker - The mock broker to return from getBroker
 * @param connection - The mock connection to return from createConnection
 * @param options - Optional configuration
 * @param options.addBroker - Whether to include addBroker stub (default: true)
 * @param options.brokerExists - Default value for brokerExists stub (default: true)
 * @param options.defaultBroker - Default broker for getDefaultBroker stub (default: null)
 * @param options.setDefaultBroker - Whether to include setDefaultBroker stub (default: true)
 * @param options.updateBroker - Whether to include updateBroker stub (default: true)
 * @returns A mock BrokerAuthManager with stubbed methods
 *
 * @example
 * const manager = createMockBrokerAuthManager(sandbox, mockBroker, mockConnection)
 * // All methods are pre-stubbed and ready to use
 *
 * @example
 * const manager = createMockBrokerAuthManager(sandbox, mockBroker, mockConnection, {
 *   brokerExists: true,
 *   defaultBroker: mockDefaultBroker
 * })
 */
export function createMockBrokerAuthManager(
  sandbox: SinonSandbox,
  broker: BrokerAuth,
  connection: MockConnection,
  options: {
    addBroker?: boolean
    brokerExists?: boolean
    defaultBroker?: BrokerAuth | null
    setDefaultBroker?: boolean
    updateBroker?: boolean
  } = {},
): MockBrokerAuthManager {
  const manager: MockBrokerAuthManager = {
    brokerExists: sandbox.stub().resolves(options.brokerExists ?? true),
    createConnection: sandbox.stub().resolves(connection as unknown as ScConnection),
    getBroker: sandbox.stub().resolves(broker),
    getDefaultBroker: sandbox.stub().resolves(options.defaultBroker ?? null),
  }

  // Add optional methods based on options
  if (options.addBroker !== false) {
    manager.addBroker = sandbox.stub().resolves()
  }

  if (options.setDefaultBroker !== false) {
    manager.setDefaultBroker = sandbox.stub().resolves()
  }

  if (options.updateBroker !== false) {
    manager.updateBroker = sandbox.stub().resolves()
  }

  return manager
}
