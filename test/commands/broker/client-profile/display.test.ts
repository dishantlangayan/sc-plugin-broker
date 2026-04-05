import BrokerClientProfileDisplay from '../../../../src/commands/broker/client-profile/display.js'
import {MsgVpnClientProfileMonitorResponse} from '../../../../src/types/msgvpn-client-profile.js'
import {
  buildSimpleResponse,
  expect,
  setupTestContext,
  type SinonStub,
  stubCommandMethod,
  type TestContext,
} from '../../../helpers/index.js'

describe('broker:client-profile:display', () => {
  let context: TestContext

  beforeEach(() => {
    context = setupTestContext({}, ['get'])
    context.mockConnection.get!.resolves(
      buildSimpleResponse({
        data: {
          allowGuaranteedMsgReceiveEnabled: true,
          allowGuaranteedMsgSendEnabled: true,
          clientProfileName: 'testProfile',
          compressionEnabled: false,
          msgVpnName: 'default',
        },
      }),
    )
  })

  afterEach(() => {
    context.cleanup()
  })

  describe('SEMP API Calls', () => {
    beforeEach(() => {
      stubCommandMethod(context.sandbox, BrokerClientProfileDisplay, 'getBrokerAuthManager', context.mockBrokerAuthManager)
      context.sandbox.stub(BrokerClientProfileDisplay.prototype, 'log')
    })

    it('should call correct SEMP Monitor API endpoint with profile name in path', async () => {
      await BrokerClientProfileDisplay.run([
        '--broker-name=test-broker',
        '--client-profile-name=testProfile',
        '--msg-vpn-name=default',
      ])

      expect(context.mockConnection.get!.calledWith('/SEMP/v2/monitor/msgVpns/default/clientProfiles/testProfile')).to.be.true
    })

    it('should display response using printObjectAsKeyValueTable', async () => {
      await BrokerClientProfileDisplay.run([
        '--broker-name=test-broker',
        '--client-profile-name=testProfile',
        '--msg-vpn-name=default',
      ])

      const logStub = BrokerClientProfileDisplay.prototype.log as SinonStub
      expect(logStub.called).to.be.true
    })

    it('should return MsgVpnClientProfileMonitorResponse', async () => {
      const mockResponse: MsgVpnClientProfileMonitorResponse = {
        data: {
          clientProfileName: 'testProfile',
          msgVpnName: 'default',
        },
        meta: {
          responseCode: 200,
        },
      }

      context.mockConnection.get!.resolves(mockResponse)

      const result = await BrokerClientProfileDisplay.run([
        '--broker-name=test-broker',
        '--client-profile-name=testProfile',
        '--msg-vpn-name=default',
      ])

      expect(result).to.deep.equal(mockResponse)
    })
  })
})
