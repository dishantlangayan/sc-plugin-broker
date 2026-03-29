import {AuthType, BrokerAuth, ScConnection} from '@dishantlangayan/sc-cli-core'
import {expect} from 'chai'
import {restore, type SinonStub, stub} from 'sinon'

import BrokerClientProfileDisplay from '../../../../src/commands/broker/client-profile/display.js'
import {MsgVpnClientProfileMonitorResponse} from '../../../../src/types/msgvpn-client-profile.js'

describe('broker:client-profile:display', () => {
  let mockBrokerAuthManager: {
    brokerExists: SinonStub
    createConnection: SinonStub
    getBroker: SinonStub
    getDefaultBroker: SinonStub
  }
  let mockConnection: {
    get: SinonStub
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
      get: stub().resolves({
        data: {
          allowGuaranteedMsgReceiveEnabled: true,
          allowGuaranteedMsgSendEnabled: true,
          clientProfileName: 'testProfile',
          compressionEnabled: false,
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
      stub(BrokerClientProfileDisplay.prototype as any, 'getBrokerAuthManager').resolves(mockBrokerAuthManager)
      stub(BrokerClientProfileDisplay.prototype, 'log')
    })

    afterEach(() => {
      restore()
    })

    it('should call correct SEMP Monitor API endpoint with profile name in path', async () => {
      await BrokerClientProfileDisplay.run([
        '--broker-name=test-broker',
        '--client-profile-name=testProfile',
        '--msg-vpn-name=default',
      ])

      expect(mockConnection.get.calledWith('/SEMP/v2/monitor/msgVpns/default/clientProfiles/testProfile')).to.be.true
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

      mockConnection.get.resolves(mockResponse)

      const result = await BrokerClientProfileDisplay.run([
        '--broker-name=test-broker',
        '--client-profile-name=testProfile',
        '--msg-vpn-name=default',
      ])

      expect(result).to.deep.equal(mockResponse)
    })
  })
})
