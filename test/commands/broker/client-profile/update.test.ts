import {AuthType, BrokerAuth, ScConnection} from '@dishantlangayan/sc-cli-core'
import {expect} from 'chai'
import {restore, type SinonStub, stub} from 'sinon'

import BrokerClientProfileUpdate from '../../../../src/commands/broker/client-profile/update.js'
import {MsgVpnClientProfileUpdateResponse} from '../../../../src/types/msgvpn-client-profile.js'

describe('broker:client-profile:update', () => {
  let mockBrokerAuthManager: {
    brokerExists: SinonStub
    createConnection: SinonStub
    getBroker: SinonStub
    getDefaultBroker: SinonStub
  }
  let mockConnection: {
    patch: SinonStub
  }
  let mockBroker: BrokerAuth

  beforeEach(() => {
    // Setup mock broker
    mockBroker = {
      accessToken: 'dGVzdDp0ZXN0',
      authType: AuthType.BASIC,
      name: 'test-broker',
      sempEndpoint: 'https://localhost',
      sempPort: 8080,
    }

    // Setup mock connection
    mockConnection = {
      patch: stub().resolves({
        data: {
          clientProfileName: 'testProfile',
          compressionEnabled: true,
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
      stub(BrokerClientProfileUpdate.prototype as any, 'getBrokerAuthManager').resolves(mockBrokerAuthManager)
      stub(BrokerClientProfileUpdate.prototype, 'log')
    })

    afterEach(() => {
      restore()
    })

    it('should call correct SEMP Config API PATCH endpoint', async () => {
      await BrokerClientProfileUpdate.run([
        '--broker-name=test-broker',
        '--client-profile-name=testProfile',
        '--msg-vpn-name=default',
        '--compression-enabled',
      ])

      expect(mockConnection.patch.calledWith('/SEMP/v2/config/msgVpns/default/clientProfiles/testProfile')).to.be.true
    })

    it('should NOT include clientProfileName in request body', async () => {
      await BrokerClientProfileUpdate.run([
        '--broker-name=test-broker',
        '--client-profile-name=testProfile',
        '--msg-vpn-name=default',
        '--compression-enabled',
      ])

      const patchCall = mockConnection.patch.getCall(0)
      const requestBody = patchCall.args[1]

      expect(requestBody).to.not.have.property('clientProfileName')
    })

    it('should only include provided flags (partial update)', async () => {
      await BrokerClientProfileUpdate.run([
        '--broker-name=test-broker',
        '--client-profile-name=testProfile',
        '--msg-vpn-name=default',
        '--compression-enabled',
        '--eliding-delay=50',
      ])

      const patchCall = mockConnection.patch.getCall(0)
      const requestBody = patchCall.args[1]

      expect(requestBody).to.deep.equal({
        compressionEnabled: true,
        elidingDelay: 50,
      })
    })

    it('should handle boolean flags correctly', async () => {
      await BrokerClientProfileUpdate.run([
        '--broker-name=test-broker',
        '--client-profile-name=testProfile',
        '--msg-vpn-name=default',
        '--no-compression-enabled',
        '--allow-guaranteed-msg-send-enabled',
      ])

      const patchCall = mockConnection.patch.getCall(0)
      const requestBody = patchCall.args[1]

      expect(requestBody).to.have.property('compressionEnabled', false)
      expect(requestBody).to.have.property('allowGuaranteedMsgSendEnabled', true)
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

      mockConnection.patch.resolves(mockResponse)

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
