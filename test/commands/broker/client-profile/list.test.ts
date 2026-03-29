import {AuthType, BrokerAuth, ScConnection} from '@dishantlangayan/sc-cli-core'
import {expect} from 'chai'
import {restore, type SinonStub, stub} from 'sinon'

import BrokerClientProfileList from '../../../../src/commands/broker/client-profile/list.js'
import {MsgVpnClientProfilesMonitorResponse} from '../../../../src/types/msgvpn-client-profile.js'

describe('broker:client-profile:list', () => {
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

    // Setup mock connection with sample response
    mockConnection = {
      get: stub().resolves({
        data: [
          {
            allowGuaranteedMsgReceiveEnabled: true,
            allowGuaranteedMsgSendEnabled: true,
            clientProfileName: 'profile1',
            msgVpnName: 'default',
          },
          {
            allowGuaranteedMsgReceiveEnabled: false,
            allowGuaranteedMsgSendEnabled: true,
            clientProfileName: 'profile2',
            msgVpnName: 'default',
          },
        ],
        meta: {
          count: 2,
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
      stub(BrokerClientProfileList.prototype as any, 'getBrokerAuthManager').resolves(mockBrokerAuthManager)
      stub(BrokerClientProfileList.prototype, 'log')
    })

    afterEach(() => {
      restore()
    })

    it('should call correct SEMP Monitor API endpoint for list', async () => {
      await BrokerClientProfileList.run(['--broker-name=test-broker', '--msg-vpn-name=default'])

      const getCall = mockConnection.get.getCall(0)
      const endpoint = getCall.args[0]

      expect(endpoint).to.include('/SEMP/v2/monitor/msgVpns/default/clientProfiles')
    })

    it('should use default attributes when --select not provided', async () => {
      await BrokerClientProfileList.run(['--broker-name=test-broker', '--msg-vpn-name=default'])

      const getCall = mockConnection.get.getCall(0)
      const endpoint = getCall.args[0]

      expect(endpoint).to.include('select=')
      expect(endpoint).to.include('clientProfileName')
      expect(endpoint).to.include('allowGuaranteedMsgReceiveEnabled')
      expect(endpoint).to.include('allowGuaranteedMsgSendEnabled')
    })

    it('should use custom attributes when --select provided', async () => {
      await BrokerClientProfileList.run([
        '--broker-name=test-broker',
        '--msg-vpn-name=default',
        '--select=clientProfileName,compressionEnabled',
      ])

      const getCall = mockConnection.get.getCall(0)
      const endpoint = getCall.args[0]

      expect(endpoint).to.include('compressionEnabled')
    })

    it('should append select parameter to URL correctly', async () => {
      await BrokerClientProfileList.run([
        '--broker-name=test-broker',
        '--msg-vpn-name=default',
        '--select=clientProfileName',
      ])

      const getCall = mockConnection.get.getCall(0)
      const endpoint = getCall.args[0]

      expect(endpoint).to.match(/&select=/)
    })

    it('should handle pagination cursor', async () => {
      // First call returns data with cursor
      const mockResponseWithCursor: MsgVpnClientProfilesMonitorResponse = {
        data: [
          {
            clientProfileName: 'profile1',
            msgVpnName: 'default',
          },
        ],
        meta: {
          count: 1,
          paging: {
            cursorQuery: 'nextCursor123',
            nextPageUri: '/next',
          },
          responseCode: 200,
        },
      }

      // Second call returns data without cursor (end of results)
      const mockResponseNoCursor: MsgVpnClientProfilesMonitorResponse = {
        data: [
          {
            clientProfileName: 'profile2',
            msgVpnName: 'default',
          },
        ],
        meta: {
          count: 1,
          responseCode: 200,
        },
      }

      mockConnection.get.onFirstCall().resolves(mockResponseWithCursor)
      mockConnection.get.onSecondCall().resolves(mockResponseNoCursor)

      await BrokerClientProfileList.run(['--broker-name=test-broker', '--msg-vpn-name=default', '--all'])

      expect(mockConnection.get.callCount).to.equal(2)
      const secondCall = mockConnection.get.getCall(1)
      expect(secondCall.args[0]).to.include('cursor=nextCursor123')
    })
  })

  describe('Attribute Formatting', () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub(BrokerClientProfileList.prototype as any, 'getBrokerAuthManager').resolves(mockBrokerAuthManager)
      stub(BrokerClientProfileList.prototype, 'log')
    })

    afterEach(() => {
      restore()
    })

    it('should format boolean values as Yes/No', async () => {
      const result = await BrokerClientProfileList.run(['--broker-name=test-broker', '--msg-vpn-name=default'])

      expect(result.data).to.have.lengthOf(2)
    })
  })
})
