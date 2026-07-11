import BrokerQueueTemplateDelete from '../../../../src/commands/broker/queue-template/delete.js'
import {MsgVpnQueueTemplateDeleteResponse} from '../../../../src/types/msgvpn-queue-template.js'
import {
  buildDeleteResponse,
  expect,
  setupTestContext,
  type SinonStub,
  stubCommandMethod,
  type TestContext,
} from '../../../helpers/index.js'

describe('broker:queue-template:delete', () => {
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
      stubCommandMethod(context.sandbox, BrokerQueueTemplateDelete, 'getBrokerAuthManager', context.mockBrokerAuthManager)
    })

    it('should call correct SEMP endpoint with --no-prompt', async () => {
      await BrokerQueueTemplateDelete.run([
        '--broker-name=test-broker',
        '--name=testTemplate',
        '--msg-vpn-name=default',
        '--no-prompt',
      ])

      expect(context.mockConnection.delete!.calledWith('/SEMP/v2/config/msgVpns/default/queueTemplates/testTemplate')).to
        .be.true
    })

    it('should delete queue template with special characters in name', async () => {
      await BrokerQueueTemplateDelete.run([
        '--broker-name=test-broker',
        '--name=test-template-123',
        '--msg-vpn-name=default',
        '--no-prompt',
      ])

      expect(
        context.mockConnection.delete!.calledWith('/SEMP/v2/config/msgVpns/default/queueTemplates/test-template-123'),
      ).to.be.true
    })
  })

  describe('Response Display', () => {
    beforeEach(() => {
      stubCommandMethod(context.sandbox, BrokerQueueTemplateDelete, 'getBrokerAuthManager', context.mockBrokerAuthManager)
      context.sandbox.stub(BrokerQueueTemplateDelete.prototype, 'log')
    })

    it('should display success message when responseCode is 200', async () => {
      const mockResponse: MsgVpnQueueTemplateDeleteResponse = {
        meta: {
          request: {method: 'DELETE', uri: '/config/msgVpns/default/queueTemplates/testTemplate'},
          responseCode: 200,
        },
      }

      context.mockConnection.delete!.resolves(mockResponse)

      await BrokerQueueTemplateDelete.run([
        '--broker-name=test-broker',
        '--name=testTemplate',
        '--msg-vpn-name=default',
        '--no-prompt',
      ])

      const logStub = BrokerQueueTemplateDelete.prototype.log as SinonStub
      expect(logStub.called).to.be.true
      // Verify success message was logged
      const successMessage = logStub
        .getCalls()
        .find((call: {args: string[]}) => call.args[0]?.includes('Successfully deleted'))
      expect(successMessage).to.exist
    })

    it('should display error message when responseCode is not 200', async () => {
      const mockResponse: MsgVpnQueueTemplateDeleteResponse = {
        meta: {
          responseCode: 404,
        },
      }

      context.mockConnection.delete!.resolves(mockResponse)
      const errorStub = context.sandbox.stub(BrokerQueueTemplateDelete.prototype, 'error')

      try {
        await BrokerQueueTemplateDelete.run([
          '--broker-name=test-broker',
          '--name=nonexistent',
          '--msg-vpn-name=default',
          '--no-prompt',
        ])
      } catch {
        // Expected error
      }

      expect(errorStub.calledWith("Failed to delete queue template 'nonexistent': HTTP 404")).to.be.true
    })

    it('should return MsgVpnQueueTemplateDeleteResponse as-is', async () => {
      const mockResponse: MsgVpnQueueTemplateDeleteResponse = {
        meta: {
          request: {method: 'DELETE', uri: '/config/msgVpns/default/queueTemplates/testTemplate'},
          responseCode: 200,
        },
      }

      context.mockConnection.delete!.resolves(mockResponse)

      const result = await BrokerQueueTemplateDelete.run([
        '--broker-name=test-broker',
        '--name=testTemplate',
        '--msg-vpn-name=default',
        '--no-prompt',
      ])

      expect(result).to.deep.equal(mockResponse)
    })
  })

  describe('--no-prompt flag', () => {
    beforeEach(() => {
      stubCommandMethod(context.sandbox, BrokerQueueTemplateDelete, 'getBrokerAuthManager', context.mockBrokerAuthManager)
      context.sandbox.stub(BrokerQueueTemplateDelete.prototype, 'log')
    })

    it('should skip confirmation when --no-prompt is set', async () => {
      await BrokerQueueTemplateDelete.run([
        '--broker-name=test-broker',
        '--name=testTemplate',
        '--msg-vpn-name=default',
        '--no-prompt',
      ])

      expect(context.mockConnection.delete!.called).to.be.true
    })

    it('should delete queue template without confirmation', async () => {
      const mockResponse: MsgVpnQueueTemplateDeleteResponse = {
        meta: {
          responseCode: 200,
        },
      }

      context.mockConnection.delete!.resolves(mockResponse)

      await BrokerQueueTemplateDelete.run([
        '--broker-name=test-broker',
        '--name=testTemplate',
        '--msg-vpn-name=default',
        '--no-prompt',
      ])

      const logStub = BrokerQueueTemplateDelete.prototype.log as SinonStub
      expect(logStub.called).to.be.true
      expect(context.mockConnection.delete!.calledOnce).to.be.true
    })
  })
})
