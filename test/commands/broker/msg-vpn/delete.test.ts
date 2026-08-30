import BrokerMsgVpnDelete from '../../../../src/commands/broker/msg-vpn/delete.js'
import {MsgVpnDeleteResponse} from '../../../../src/types/msgvpn.js'
import {
  buildDeleteResponse,
  createMockCloudBroker,
  expect,
  setupTestContext,
  type SinonStub,
  stubCommandMethod,
  type TestContext,
} from '../../../helpers/index.js'

describe('broker:msg-vpn:delete', () => {
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
      stubCommandMethod(context.sandbox, BrokerMsgVpnDelete, 'getBrokerAuthManager', context.mockBrokerAuthManager)
      context.sandbox.stub(BrokerMsgVpnDelete.prototype, 'log')
    })

    it('should call correct SEMP endpoint with --no-prompt', async () => {
      await BrokerMsgVpnDelete.run([
        '--broker-name=test-broker',
        '--name=testVpn',
        '--no-prompt',
      ])

      expect(context.mockConnection.delete!.calledWith('/SEMP/v2/config/msgVpns/testVpn')).to.be.true
    })
  })

  describe('Response Display', () => {
    beforeEach(() => {
      stubCommandMethod(context.sandbox, BrokerMsgVpnDelete, 'getBrokerAuthManager', context.mockBrokerAuthManager)
      context.sandbox.stub(BrokerMsgVpnDelete.prototype, 'log')
    })

    it('should display success message when responseCode is 200', async () => {
      const mockResponse: MsgVpnDeleteResponse = {
        meta: {
          responseCode: 200,
        },
      }

      context.mockConnection.delete!.resolves(mockResponse)

      await BrokerMsgVpnDelete.run([
        '--broker-name=test-broker',
        '--name=testVpn',
        '--no-prompt',
      ])

      const logStub = BrokerMsgVpnDelete.prototype.log as SinonStub
      const successMessage = logStub
        .getCalls()
        .find((call: {args: string[]}) => call.args[0]?.includes('Successfully deleted'))
      expect(successMessage).to.exist
    })

    it('should display error message when responseCode is not 200', async () => {
      const mockResponse: MsgVpnDeleteResponse = {
        meta: {
          responseCode: 404,
        },
      }

      context.mockConnection.delete!.resolves(mockResponse)
      const errorStub = context.sandbox.stub(BrokerMsgVpnDelete.prototype, 'error')

      try {
        await BrokerMsgVpnDelete.run([
          '--broker-name=test-broker',
          '--name=nonexistent',
          '--no-prompt',
        ])
      } catch {
        // Expected error
      }

      expect(errorStub.calledWith("Failed to delete Message VPN 'nonexistent': HTTP 404")).to.be.true
    })

    it('should return MsgVpnDeleteResponse as-is', async () => {
      const mockResponse: MsgVpnDeleteResponse = {
        meta: {
          responseCode: 200,
        },
      }

      context.mockConnection.delete!.resolves(mockResponse)

      const result = await BrokerMsgVpnDelete.run([
        '--broker-name=test-broker',
        '--name=testVpn',
        '--no-prompt',
      ])

      expect(result).to.deep.equal(mockResponse)
    })
  })

  describe('Solace Cloud broker restriction', () => {
    beforeEach(() => {
      const cloudBroker = createMockCloudBroker({
        msgVpnName: 'cloud-vpn',
        name: 'cloud-broker',
      })

      context.mockBrokerAuthManager.getBroker.resolves(cloudBroker)
      stubCommandMethod(context.sandbox, BrokerMsgVpnDelete, 'getBrokerAuthManager', context.mockBrokerAuthManager)
      context.sandbox.stub(BrokerMsgVpnDelete.prototype, 'log')
    })

    it('should error and not call the API when broker is a Solace Cloud broker', async () => {
      try {
        await BrokerMsgVpnDelete.run(['--broker-name=cloud-broker', '--name=cloud-vpn', '--no-prompt'])
        expect.fail('Should have thrown an error')
      } catch (error) {
        expect((error as Error).message).to.match(/cannot be deleted on a Solace Cloud broker/i)
      }

      expect(context.mockConnection.delete!.called).to.be.false
    })
  })
})
