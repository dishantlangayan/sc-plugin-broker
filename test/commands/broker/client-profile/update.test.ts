import BrokerClientProfileUpdate from '../../../../src/commands/broker/client-profile/update.js'
import {MsgVpnClientProfileUpdateResponse} from '../../../../src/types/msgvpn-client-profile.js'
import {
  buildSimpleResponse,
  expect,
  setupTestContext,
  
  stubCommandMethod,
  type TestContext,
} from '../../../helpers/index.js'

describe('broker:client-profile:update', () => {
  let context: TestContext

  beforeEach(() => {
    context = setupTestContext({}, ['patch'])
    context.mockConnection.patch!.resolves(
      buildSimpleResponse({
        data: {
          clientProfileName: 'testProfile',
          compressionEnabled: true,
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
      stubCommandMethod(
        context.sandbox,
        BrokerClientProfileUpdate,
        'getBrokerAuthManager',
        context.mockBrokerAuthManager,
      )
    })

    it('should call correct SEMP Config API PATCH endpoint', async () => {
      await BrokerClientProfileUpdate.run([
        '--broker-name=test-broker',
        '--client-profile-name=testProfile',
        '--msg-vpn-name=default',
        '--compression-enabled',
      ])

      expect(context.mockConnection.patch!.calledWith('/SEMP/v2/config/msgVpns/default/clientProfiles/testProfile'))
        .to.be.true
    })

    it('should use PATCH method not POST', async () => {
      await BrokerClientProfileUpdate.run([
        '--broker-name=test-broker',
        '--client-profile-name=testProfile',
        '--msg-vpn-name=default',
        '--compression-enabled',
      ])

      expect(context.mockConnection.patch!.called).to.be.true
      expect(context.mockConnection.patch!.callCount).to.equal(1)
    })
  })

  describe('Flag Mapping', () => {
    beforeEach(() => {
      stubCommandMethod(
        context.sandbox,
        BrokerClientProfileUpdate,
        'getBrokerAuthManager',
        context.mockBrokerAuthManager,
      )
    })

    it('should NOT include clientProfileName in request body', async () => {
      await BrokerClientProfileUpdate.run([
        '--broker-name=test-broker',
        '--client-profile-name=testProfile',
        '--msg-vpn-name=default',
        '--compression-enabled',
      ])

      const patchCall = context.mockConnection.patch!.getCall(0)
      const requestBody = patchCall.args[1]

      expect(requestBody).to.not.have.property('clientProfileName')
    })

    it('should handle boolean flags correctly', async () => {
      await BrokerClientProfileUpdate.run([
        '--broker-name=test-broker',
        '--client-profile-name=testProfile',
        '--msg-vpn-name=default',
        '--no-compression-enabled',
        '--allow-guaranteed-msg-send-enabled',
      ])

      const patchCall = context.mockConnection.patch!.getCall(0)
      const requestBody = patchCall.args[1]

      expect(requestBody).to.have.property('compressionEnabled', false)
      expect(requestBody).to.have.property('allowGuaranteedMsgSendEnabled', true)
    })
  })

  describe('Partial Updates', () => {
    beforeEach(() => {
      stubCommandMethod(
        context.sandbox,
        BrokerClientProfileUpdate,
        'getBrokerAuthManager',
        context.mockBrokerAuthManager,
      )
    })

    it('should only include provided flags (partial update)', async () => {
      await BrokerClientProfileUpdate.run([
        '--broker-name=test-broker',
        '--client-profile-name=testProfile',
        '--msg-vpn-name=default',
        '--compression-enabled',
        '--eliding-delay=50',
      ])

      const patchCall = context.mockConnection.patch!.getCall(0)
      const requestBody = patchCall.args[1]

      expect(requestBody).to.deep.equal({
        compressionEnabled: true,
        elidingDelay: 50,
      })
    })
  })

  describe('Response Display', () => {
    beforeEach(() => {
      stubCommandMethod(
        context.sandbox,
        BrokerClientProfileUpdate,
        'getBrokerAuthManager',
        context.mockBrokerAuthManager,
      )
      context.sandbox.stub(BrokerClientProfileUpdate.prototype, 'log')
    })

    it('should return MsgVpnClientProfileUpdateResponse', async () => {
      const mockResponse: MsgVpnClientProfileUpdateResponse = {
        data: {
          clientProfileName: 'testProfile',
          msgVpnName: 'default',
        },
        meta: {
          responseCode: 200,
        },
      }

      context.mockConnection.patch!.resolves(mockResponse)

      const result = await BrokerClientProfileUpdate.run([
        '--broker-name=test-broker',
        '--client-profile-name=testProfile',
        '--msg-vpn-name=default',
        '--compression-enabled',
      ])

      expect(result).to.deep.equal(mockResponse)
    })
  })
})
