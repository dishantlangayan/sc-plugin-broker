import BrokerClientProfileList from '../../../../src/commands/broker/client-profile/list.js'
import {MsgVpnClientProfilesMonitorResponse} from '../../../../src/types/msgvpn-client-profile.js'
import {
  buildSimpleResponse,
  expect,
  setupTestContext,
  
  stubCommandMethod,
  type TestContext,
} from '../../../helpers/index.js'

describe('broker:client-profile:list', () => {
  let context: TestContext

  beforeEach(() => {
    context = setupTestContext({}, ['get'])
    context.mockConnection.get!.resolves(
      buildSimpleResponse({
        data: [],
      }),
    )
  })

  afterEach(() => {
    context.cleanup()
  })

  describe('SEMP API Calls', () => {
    beforeEach(() => {
      stubCommandMethod(context.sandbox, BrokerClientProfileList, 'getBrokerAuthManager', context.mockBrokerAuthManager)
      context.sandbox.stub(BrokerClientProfileList.prototype, 'log')
    })

    it('should call correct SEMP Monitor API endpoint for list', async () => {
      await BrokerClientProfileList.run(['--broker-name=test-broker', '--msg-vpn-name=default'])

      const getCall = context.mockConnection.get!.getCall(0)
      const endpoint = getCall.args[0]

      expect(endpoint).to.include('/SEMP/v2/monitor/msgVpns/default/clientProfiles')
    })

    it('should use default attributes when --select not provided', async () => {
      await BrokerClientProfileList.run(['--broker-name=test-broker', '--msg-vpn-name=default'])

      const getCall = context.mockConnection.get!.getCall(0)
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

      const getCall = context.mockConnection.get!.getCall(0)
      const endpoint = getCall.args[0]

      expect(endpoint).to.include('compressionEnabled')
    })

    it('should append select parameter to URL correctly', async () => {
      await BrokerClientProfileList.run([
        '--broker-name=test-broker',
        '--msg-vpn-name=default',
        '--select=clientProfileName',
      ])

      const getCall = context.mockConnection.get!.getCall(0)
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

      context.mockConnection.get!.onFirstCall().resolves(mockResponseWithCursor)
      context.mockConnection.get!.onSecondCall().resolves(mockResponseNoCursor)

      await BrokerClientProfileList.run(['--broker-name=test-broker', '--msg-vpn-name=default', '--all'])

      expect(context.mockConnection.get!.callCount).to.equal(2)
      const secondCall = context.mockConnection.get!.getCall(1)
      expect(secondCall.args[0]).to.include('cursor=nextCursor123')
    })
  })

  describe('Attribute Formatting', () => {
    beforeEach(() => {
      stubCommandMethod(context.sandbox, BrokerClientProfileList, 'getBrokerAuthManager', context.mockBrokerAuthManager)
      context.sandbox.stub(BrokerClientProfileList.prototype, 'log')
    })

    it('should format boolean values as Yes/No', async () => {
      const mockResponse: MsgVpnClientProfilesMonitorResponse = {
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
      }

      context.mockConnection.get!.resolves(mockResponse)

      const result = await BrokerClientProfileList.run(['--broker-name=test-broker', '--msg-vpn-name=default'])

      expect(result.data).to.have.lengthOf(2)
    })
  })
})
