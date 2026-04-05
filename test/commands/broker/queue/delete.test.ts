import {runCommand} from '@oclif/test'

import BrokerQueueDelete from '../../../../src/commands/broker/queue/delete.js'
import {MsgVpnQueueDeleteResponse} from '../../../../src/types/msgvpn-queue.js'
import {
  buildDeleteResponse,
  expect,
  setupTestContext,
  type SinonStub,
  stubCommandMethod,
  type TestContext,
} from '../../../helpers/index.js'

describe('broker:queue:delete', () => {
  let context: TestContext

  beforeEach(() => {
    context = setupTestContext({}, ['delete'])
    context.mockConnection.delete!.resolves(buildDeleteResponse())
  })

  afterEach(() => {
    context.cleanup()
  })

  describe('SEMP API Calls', () => {
    beforeEach(() => {
      stubCommandMethod(context.sandbox, BrokerQueueDelete, 'getBrokerAuthManager', context.mockBrokerAuthManager)
    })

    it('should call correct SEMP endpoint with --no-prompt', async () => {
      await BrokerQueueDelete.run([
        '--broker-name=test-broker',
        '--queue-name=testQueue',
        '--msg-vpn-name=default',
        '--no-prompt',
      ])

      expect(context.mockConnection.delete!.calledWith('/SEMP/v2/config/msgVpns/default/queues/testQueue')).to.be.true
    })

    it('should delete queue with special characters in name', async () => {
      await BrokerQueueDelete.run([
        '--broker-name=test-broker',
        '--queue-name=test-queue-123',
        '--msg-vpn-name=default',
        '--no-prompt',
      ])

      expect(context.mockConnection.delete!.calledWith('/SEMP/v2/config/msgVpns/default/queues/test-queue-123')).to.be
        .true
    })
  })

  describe('Response Display', () => {
    beforeEach(() => {
      stubCommandMethod(context.sandbox, BrokerQueueDelete, 'getBrokerAuthManager', context.mockBrokerAuthManager)
      context.sandbox.stub(BrokerQueueDelete.prototype, 'log')
    })

    it('should display success message when responseCode is 200', async () => {
      const mockResponse: MsgVpnQueueDeleteResponse = {
        meta: {
          request: {method: 'DELETE', uri: '/config/msgVpns/default/queues/testQueue'},
          responseCode: 200,
        },
      }

      context.mockConnection.delete!.resolves(mockResponse)

      await BrokerQueueDelete.run([
        '--broker-name=test-broker',
        '--queue-name=testQueue',
        '--msg-vpn-name=default',
        '--no-prompt',
      ])

      const logStub = BrokerQueueDelete.prototype.log as SinonStub
      expect(logStub.called).to.be.true
      // Verify success message was logged
      const successMessage = logStub.getCalls().find((call: {args: string[]}) =>
        call.args[0]?.includes('Successfully deleted'),
      )
      expect(successMessage).to.exist
    })

    it('should display error message when responseCode is not 200', async () => {
      const mockResponse: MsgVpnQueueDeleteResponse = {
        meta: {
          responseCode: 404,
        },
      }

      context.mockConnection.delete!.resolves(mockResponse)
      const errorStub = context.sandbox.stub(BrokerQueueDelete.prototype, 'error')

      try {
        await BrokerQueueDelete.run([
          '--broker-name=test-broker',
          '--queue-name=nonexistent',
          '--msg-vpn-name=default',
          '--no-prompt',
        ])
      } catch {
        // Expected error
      }

      expect(errorStub.calledWith("Failed to delete queue 'nonexistent': HTTP 404")).to.be.true
    })

    it('should return MsgVpnQueueDeleteResponse as-is', async () => {
      const mockResponse: MsgVpnQueueDeleteResponse = {
        meta: {
          request: {method: 'DELETE', uri: '/config/msgVpns/default/queues/testQueue'},
          responseCode: 200,
        },
      }

      context.mockConnection.delete!.resolves(mockResponse)

      const result = await BrokerQueueDelete.run([
        '--broker-name=test-broker',
        '--queue-name=testQueue',
        '--msg-vpn-name=default',
        '--no-prompt',
      ])

      expect(result).to.deep.equal(mockResponse)
    })
  })

  describe('--no-prompt flag', () => {
    beforeEach(() => {
      stubCommandMethod(context.sandbox, BrokerQueueDelete, 'getBrokerAuthManager', context.mockBrokerAuthManager)
      context.sandbox.stub(BrokerQueueDelete.prototype, 'log')
    })

    it('should skip confirmation when --no-prompt is set', async () => {
      await BrokerQueueDelete.run([
        '--broker-name=test-broker',
        '--queue-name=testQueue',
        '--msg-vpn-name=default',
        '--no-prompt',
      ])

      expect(context.mockConnection.delete!.called).to.be.true
    })

    it('should delete queue without confirmation', async () => {
      const mockResponse: MsgVpnQueueDeleteResponse = {
        meta: {
          responseCode: 200,
        },
      }

      context.mockConnection.delete!.resolves(mockResponse)

      await BrokerQueueDelete.run([
        '--broker-name=test-broker',
        '--queue-name=testQueue',
        '--msg-vpn-name=default',
        '--no-prompt',
      ])

      const logStub = BrokerQueueDelete.prototype.log as SinonStub
      expect(logStub.called).to.be.true
      expect(context.mockConnection.delete!.calledOnce).to.be.true
    })
  })

  describe('Required flags', () => {
    it('should error when --queue-name is missing', async () => {
      const result = await runCommand('broker:queue:delete --broker-name=test-broker --msg-vpn-name=default --no-prompt')

      expect(result.error).to.exist
      if (result.error) {
        expect(result.error.message).to.match(/Missing required flag/)
        expect(result.error.message).to.match(/queue-name/)
      }
    })
  })
})
