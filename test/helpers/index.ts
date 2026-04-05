/**
 * Test Helpers
 *
 * Shared utilities for eliminating test setup duplication across the test suite.
 *
 * @example Quick Start
 * ```typescript
 * import {
 *   expect,
 *   setupTestContext,
 *   stubCommandMethod,
 *   buildSimpleResponse,
 *   type TestContext,
 * } from '../../helpers'
 *
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
 *   describe('SEMP API Calls', () => {
 *     beforeEach(() => {
 *       stubCommandMethod(
 *         context.sandbox,
 *         MyCommand,
 *         'getBrokerAuthManager',
 *         context.mockBrokerAuthManager
 *       )
 *     })
 *
 *     it('should work', async () => {
 *       await MyCommand.run(['--broker-name=test'])
 *       expect(context.mockConnection.post!.calledOnce).to.be.true
 *     })
 *   })
 * })
 * ```
 */

// Re-export broker mocks
export * from './broker-mocks.js'

// Re-export config mocks
export * from './config-mocks.js'

// Re-export connection mocks
export * from './connection-mocks.js'

// Re-export response builders
export * from './response-builders.js'

// Re-export test context helpers
export * from './test-context.js'

// Re-export all types
export * from './types.js'

// Convenience re-exports from external libraries
export {expect} from 'chai'
export {createSandbox, type SinonSandbox, type SinonStub} from 'sinon'
