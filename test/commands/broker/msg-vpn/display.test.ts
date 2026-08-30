import BrokerMsgVpnDisplay from '../../../../src/commands/broker/msg-vpn/display.js'
import {MsgVpnMonitorResponse} from '../../../../src/types/msgvpn.js'
import {
  buildSimpleResponse,
  expect,
  setupTestContext,
  type SinonStub,
  stubCommandMethod,
  type TestContext,
} from '../../../helpers/index.js'

describe('broker:msg-vpn:display', () => {
  let context: TestContext

  beforeEach(() => {
    context = setupTestContext({}, ['get'])
    context.mockConnection.get!.resolves(
      buildSimpleResponse({
        data: {
          enabled: true,
          msgVpnName: 'testVpn',
        },
      }),
    )
  })

  afterEach(() => {
    context.cleanup()
  })

  describe('Basic Message VPN Display', () => {
    beforeEach(() => {
      stubCommandMethod(context.sandbox, BrokerMsgVpnDisplay, 'getBrokerAuthManager', context.mockBrokerAuthManager)
      context.sandbox.stub(BrokerMsgVpnDisplay.prototype, 'log')
    })

    it('should call correct SEMP monitor endpoint', async () => {
      await BrokerMsgVpnDisplay.run(['--broker-name=test-broker', '--name=testVpn'])

      expect(context.mockConnection.get!.calledWith('/SEMP/v2/monitor/msgVpns/testVpn')).to.be.true
    })

    it('should successfully retrieve and display Message VPN details', async () => {
      const mockResponse: MsgVpnMonitorResponse = {
        data: {
          enabled: true,
          maxConnectionCount: 100,
          msgSpoolMsgCount: 5,
          msgVpnName: 'testVpn',
          state: 'up',
        },
        meta: {
          responseCode: 200,
        },
      }

      context.mockConnection.get!.resolves(mockResponse)

      const result = await BrokerMsgVpnDisplay.run([
        '--broker-name=test-broker',
        '--name=testVpn',
      ])

      expect(result).to.deep.equal(mockResponse)
      const logStub = BrokerMsgVpnDisplay.prototype.log as SinonStub
      expect(logStub.called).to.be.true
    })
  })
})
