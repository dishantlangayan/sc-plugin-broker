import {AuthType, BrokerAuth, ScConnection} from '@dishantlangayan/sc-cli-core'
import {expect} from 'chai'
import {restore, type SinonStub, stub} from 'sinon'

import BrokerClientProfileCreate from '../../../../src/commands/broker/client-profile/create.js'
import {MsgVpnClientProfileCreateResponse} from '../../../../src/types/msgvpn-client-profile.js'

describe('broker:client-profile:create', () => {
  let mockBrokerAuthManager: {
    brokerExists: SinonStub
    createConnection: SinonStub
    getBroker: SinonStub
    getDefaultBroker: SinonStub
  }
  let mockConnection: {
    post: SinonStub
  }
  let mockBroker: BrokerAuth

  beforeEach(() => {
    // Setup mock broker
    mockBroker = {
      accessToken: 'dGVzdDp0ZXN0', // base64 encoded "test:test"
      authType: AuthType.BASIC,
      name: 'test-broker',
      sempEndpoint: 'https://localhost',
      sempPort: 8080,
    }

    // Setup mock connection
    mockConnection = {
      post: stub().resolves({
        data: {
          clientProfileName: 'testProfile',
          msgVpnName: 'default',
        },
        meta: {
          responseCode: 200,
        },
      }),
    }

    // Setup mock BrokerAuthManager
    mockBrokerAuthManager = {
      brokerExists: stub().resolves(true),
      createConnection: stub().resolves(mockConnection as unknown as ScConnection),
      getBroker: stub().resolves(mockBroker),
      getDefaultBroker: stub().resolves(null),
    }
  })

  describe('SEMP API Calls', () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub(BrokerClientProfileCreate.prototype as any, 'getBrokerAuthManager').resolves(mockBrokerAuthManager)
    })

    afterEach(() => {
      restore()
    })

    it('should call correct SEMP endpoint', async () => {
      await BrokerClientProfileCreate.run([
        '--broker-name=test-broker',
        '--client-profile-name=testProfile',
        '--msg-vpn-name=default',
      ])

      expect(mockConnection.post.calledWith('/SEMP/v2/config/msgVpns/default/clientProfiles')).to.be.true
    })

    it('should map required flag to request body', async () => {
      await BrokerClientProfileCreate.run([
        '--broker-name=test-broker',
        '--client-profile-name=testProfile',
        '--msg-vpn-name=default',
      ])

      const postCall = mockConnection.post.getCall(0)
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

      const postCall = mockConnection.post.getCall(0)
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

      const postCall = mockConnection.post.getCall(0)
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

      const postCall = mockConnection.post.getCall(0)
      const requestBody = postCall.args[1]

      expect(requestBody).to.have.property('compressionEnabled', false)
    })
  })

  describe('Response Display', () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub(BrokerClientProfileCreate.prototype as any, 'getBrokerAuthManager').resolves(mockBrokerAuthManager)
      stub(BrokerClientProfileCreate.prototype, 'log')
    })

    afterEach(() => {
      restore()
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

      mockConnection.post.resolves(mockResponse)

      const result = await BrokerClientProfileCreate.run([
        '--broker-name=test-broker',
        '--client-profile-name=testProfile',
        '--msg-vpn-name=default',
      ])

      expect(result).to.deep.equal(mockResponse)
    })
  })
})
