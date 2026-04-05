import {createSandbox, type SinonSandbox} from 'sinon'

import type {MockBrokerOptions, TestContext} from './types.js'

import {createMockBroker, createMockBrokerAuthManager} from './broker-mocks.js'
import {createMockConnection, type HttpMethod} from './connection-mocks.js'

/**
 * Set up a complete test context with sandbox, mocks, and cleanup
 *
 * This is the primary helper that eliminates most test setup duplication.
 * It creates a sandbox, mock broker, mock connection, and mock auth manager,
 * all pre-wired and ready to use.
 *
 * @param brokerOptions - Optional configuration for the mock broker
 * @param connectionMethods - HTTP methods to stub on the connection (defaults to ['post'])
 * @returns A TestContext with all mocks and a cleanup function
 *
 * @example
 * describe('my test suite', () => {
 *   let context: TestContext
 *
 *   beforeEach(() => {
 *     context = setupTestContext({}, ['post'])
 *     context.mockConnection.post!.resolves(
 *       buildSimpleResponse({ data: { queueName: 'test' } })
 *     )
 *   })
 *
 *   afterEach(() => {
 *     context.cleanup()
 *   })
 *
 *   it('should work', async () => {
 *     // test code
 *   })
 * })
 */
export function setupTestContext(
  brokerOptions: MockBrokerOptions = {},
  connectionMethods: HttpMethod[] = ['post'],
): TestContext {
  const sandbox = createSandbox()
  const mockBroker = createMockBroker(brokerOptions)
  const mockConnection = createMockConnection(sandbox, connectionMethods)
  const mockBrokerAuthManager = createMockBrokerAuthManager(sandbox, mockBroker, mockConnection)

  return {
    cleanup: () => sandbox.restore(),
    mockBroker,
    mockBrokerAuthManager,
    mockConnection,
    sandbox,
  }
}

/**
 * Stub a method on a command class prototype
 *
 * @param sandbox - Sinon sandbox for creating the stub
 * @param CommandClass - The command class to stub
 * @param methodName - The name of the method to stub
 * @param returnValue - The value the stub should resolve/return with
 * @returns The created stub
 *
 * @example
 * stubCommandMethod(
 *   context.sandbox,
 *   BrokerQueueCreate,
 *   'getBrokerAuthManager',
 *   context.mockBrokerAuthManager
 * )
 *
 * @example
 * const logStub = stubCommandMethod(
 *   context.sandbox,
 *   BrokerQueueList,
 *   'log',
 *   undefined
 * )
 */
export function stubCommandMethod<T = unknown>(
  sandbox: SinonSandbox,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  CommandClass: any,
  methodName: string,
  returnValue: T,
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stub = sandbox.stub(CommandClass.prototype as any, methodName)

  if (returnValue !== undefined) {
    // If returnValue looks like a Promise or has a 'then' method, use resolves
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (returnValue && typeof (returnValue as any).then === 'function') {
      stub.resolves(returnValue)
    } else if (methodName === 'log' || methodName === 'error' || methodName === 'warn') {
      // For logging methods, don't add resolves/returns
      return stub
    } else {
      stub.resolves(returnValue)
    }
  }

  return stub
}

/**
 * Stub the log method on a command class
 *
 * Convenience wrapper around stubCommandMethod for logging
 *
 * @param sandbox - Sinon sandbox for creating the stub
 * @param CommandClass - The command class to stub
 * @returns The created stub
 *
 * @example
 * const logStub = stubCommandLog(context.sandbox, BrokerQueueCreate)
 * // Later in tests:
 * expect(logStub.calledOnce).to.be.true
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function stubCommandLog(sandbox: SinonSandbox, CommandClass: any) {
  return sandbox.stub(CommandClass.prototype, 'log')
}

/**
 * Stub the error method on a command class
 *
 * Convenience wrapper around stubCommandMethod for errors
 *
 * @param sandbox - Sinon sandbox for creating the stub
 * @param CommandClass - The command class to stub
 * @returns The created stub
 *
 * @example
 * const errorStub = stubCommandError(context.sandbox, BrokerQueueCreate)
 * // Later in tests:
 * expect(errorStub.calledOnce).to.be.true
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function stubCommandError(sandbox: SinonSandbox, CommandClass: any) {
  return sandbox.stub(CommandClass.prototype, 'error')
}
