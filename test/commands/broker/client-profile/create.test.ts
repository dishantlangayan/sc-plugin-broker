import BrokerClientProfileCreate from '../../../../src/commands/broker/client-profile/create.js'
import {MsgVpnClientProfileCreateResponse} from '../../../../src/types/msgvpn-client-profile.js'
import {
  buildSimpleResponse,
  expect,
  setupTestContext,
  
  stubCommandMethod,
  type TestContext,
} from '../../../helpers/index.js'

describe('broker:client-profile:create', () => {
  let context: TestContext

  beforeEach(() => {
    context = setupTestContext({}, ['post'])
    context.mockConnection.post!.resolves(
      buildSimpleResponse({
        data: {
          clientProfileName: 'testProfile',
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
        BrokerClientProfileCreate,
        'getBrokerAuthManager',
        context.mockBrokerAuthManager,
      )
    })

    it('should call correct SEMP endpoint', async () => {
      await BrokerClientProfileCreate.run([
        '--broker-name=test-broker',
        '--client-profile-name=testProfile',
        '--msg-vpn-name=default',
      ])

      expect(context.mockConnection.post!.calledWith('/SEMP/v2/config/msgVpns/default/clientProfiles')).to.be.true
    })

    it('should map required flag to request body', async () => {
      await BrokerClientProfileCreate.run([
        '--broker-name=test-broker',
        '--client-profile-name=testProfile',
        '--msg-vpn-name=default',
      ])

      const postCall = context.mockConnection.post!.getCall(0)
      const requestBody = postCall.args[1]

      expect(requestBody).to.have.property('clientProfileName', 'testProfile')
    })

    it('should map all optional flags correctly to SEMP request body', async () => {
      await BrokerClientProfileCreate.run([
        '--broker-name=test-broker',
        '--client-profile-name=advancedProfile',
        '--msg-vpn-name=default',
        '--allow-bridge-connections-enabled',
        '--allow-guaranteed-endpoint-create-durability=durable',
        '--allow-guaranteed-endpoint-create-enabled',
        '--allow-guaranteed-msg-receive-enabled',
        '--allow-guaranteed-msg-send-enabled',
        '--allow-shared-subscriptions-enabled',
        '--allow-transacted-sessions-enabled',
        '--api-queue-management-copy-from-on-create-name=sourceQueue',
        '--api-queue-management-copy-from-on-create-template-name=sourceTemplate',
        '--compression-enabled',
        '--eliding-delay=100',
        '--eliding-enabled',
        '--tls-allow-downgrade-to-plain-text-enabled',
      ])

      const postCall = context.mockConnection.post!.getCall(0)
      const requestBody = postCall.args[1]

      expect(requestBody).to.deep.equal({
        allowBridgeConnectionsEnabled: true,
        allowGuaranteedEndpointCreateDurability: 'durable',
        allowGuaranteedEndpointCreateEnabled: true,
        allowGuaranteedMsgReceiveEnabled: true,
        allowGuaranteedMsgSendEnabled: true,
        allowSharedSubscriptionsEnabled: true,
        allowTransactedSessionsEnabled: true,
        apiQueueManagementCopyFromOnCreateName: 'sourceQueue',
        apiQueueManagementCopyFromOnCreateTemplateName: 'sourceTemplate',
        clientProfileName: 'advancedProfile',
        compressionEnabled: true,
        elidingDelay: 100,
        elidingEnabled: true,
        tlsAllowDowngradeToPlainTextEnabled: true,
      })
    })

    it('should exclude undefined flags from request body', async () => {
      await BrokerClientProfileCreate.run([
        '--broker-name=test-broker',
        '--client-profile-name=minimalProfile',
        '--msg-vpn-name=default',
      ])

      const postCall = context.mockConnection.post!.getCall(0)
      const requestBody = postCall.args[1]

      expect(requestBody).to.deep.equal({
        clientProfileName: 'minimalProfile',
      })
    })

    it('should handle boolean flags correctly', async () => {
      await BrokerClientProfileCreate.run([
        '--broker-name=test-broker',
        '--client-profile-name=testProfile',
        '--msg-vpn-name=default',
        '--no-compression-enabled',
      ])

      const postCall = context.mockConnection.post!.getCall(0)
      const requestBody = postCall.args[1]

      expect(requestBody).to.have.property('compressionEnabled', false)
    })
  })

  describe('Response Display', () => {
    beforeEach(() => {
      stubCommandMethod(
        context.sandbox,
        BrokerClientProfileCreate,
        'getBrokerAuthManager',
        context.mockBrokerAuthManager,
      )
      context.sandbox.stub(BrokerClientProfileCreate.prototype, 'log')
    })

    it('should return MsgVpnClientProfileCreateResponse', async () => {
      const mockResponse: MsgVpnClientProfileCreateResponse = {
        data: {
          clientProfileName: 'testProfile',
          msgVpnName: 'default',
        },
        meta: {
          responseCode: 200,
        },
      }

      context.mockConnection.post!.resolves(mockResponse)

      const result = await BrokerClientProfileCreate.run([
        '--broker-name=test-broker',
        '--client-profile-name=testProfile',
        '--msg-vpn-name=default',
      ])

      expect(result).to.deep.equal(mockResponse)
    })
  })
})
