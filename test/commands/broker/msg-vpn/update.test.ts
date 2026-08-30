import BrokerMsgVpnUpdate from '../../../../src/commands/broker/msg-vpn/update.js'
import {MsgVpnUpdateResponse} from '../../../../src/types/msgvpn.js'
import {
  buildSimpleResponse,
  expect,
  setupTestContext,
  stubCommandMethod,
  type TestContext,
} from '../../../helpers/index.js'

describe('broker:msg-vpn:update', () => {
  let context: TestContext

  beforeEach(() => {
    context = setupTestContext({}, ['patch'])
    context.mockConnection.patch!.resolves(
      buildSimpleResponse({
        data: {
          msgVpnName: 'testVpn',
        },
      }),
    )
  })

  afterEach(() => {
    context.cleanup()
  })

  describe('SEMP API Calls', () => {
    beforeEach(() => {
      stubCommandMethod(context.sandbox, BrokerMsgVpnUpdate, 'getBrokerAuthManager', context.mockBrokerAuthManager)
      context.sandbox.stub(BrokerMsgVpnUpdate.prototype, 'log')
    })

    it('should call correct SEMP endpoint with VPN name in path', async () => {
      await BrokerMsgVpnUpdate.run([
        '--broker-name=test-broker',
        '--name=testVpn',
        '--enabled',
      ])

      expect(context.mockConnection.patch!.calledWith('/SEMP/v2/config/msgVpns/testVpn')).to.be.true
    })

    it('should only include provided flags in the request body', async () => {
      await BrokerMsgVpnUpdate.run([
        '--broker-name=test-broker',
        '--name=testVpn',
        '--max-connection-count=200',
        '--max-msg-spool-usage=2048',
      ])

      const patchCall = context.mockConnection.patch!.getCall(0)
      const requestBody = patchCall.args[1]

      expect(requestBody).to.deep.equal({
        maxConnectionCount: 200,
        maxMsgSpoolUsage: 2048,
      })
    })

    it('should not include msgVpnName in the request body', async () => {
      await BrokerMsgVpnUpdate.run([
        '--broker-name=test-broker',
        '--name=testVpn',
        '--enabled',
      ])

      const patchCall = context.mockConnection.patch!.getCall(0)
      expect(patchCall.args[1]).to.not.have.property('msgVpnName')
    })

    it('should send disabled state when --no-enabled is used', async () => {
      await BrokerMsgVpnUpdate.run([
        '--broker-name=test-broker',
        '--name=testVpn',
        '--no-enabled',
      ])

      const patchCall = context.mockConnection.patch!.getCall(0)
      expect(patchCall.args[1]).to.have.property('enabled', false)
    })
  })

  describe('Response Display', () => {
    beforeEach(() => {
      stubCommandMethod(context.sandbox, BrokerMsgVpnUpdate, 'getBrokerAuthManager', context.mockBrokerAuthManager)
      context.sandbox.stub(BrokerMsgVpnUpdate.prototype, 'log')
    })

    it('should return MsgVpnUpdateResponse', async () => {
      const mockResponse: MsgVpnUpdateResponse = {
        data: {
          enabled: true,
          msgVpnName: 'testVpn',
        },
        meta: {
          responseCode: 200,
        },
      }

      context.mockConnection.patch!.resolves(mockResponse)

      const result = await BrokerMsgVpnUpdate.run([
        '--broker-name=test-broker',
        '--name=testVpn',
        '--enabled',
      ])

      expect(result).to.deep.equal(mockResponse)
    })
  })
})
