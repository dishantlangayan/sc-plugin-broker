import BrokerMsgVpnList from '../../../../src/commands/broker/msg-vpn/list.js'
import {MsgVpnMonitor, MsgVpnsMonitorResponse} from '../../../../src/types/msgvpn.js'
import {
  buildSimpleResponse,
  expect,
  setupTestContext,
  type SinonStub,
  stubCommandMethod,
  type TestContext,
} from '../../../helpers/index.js'

describe('broker:msg-vpn:list', () => {
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

  describe('Basic Functionality', () => {
    beforeEach(() => {
      stubCommandMethod(context.sandbox, BrokerMsgVpnList, 'getBrokerAuthManager', context.mockBrokerAuthManager)
      context.sandbox.stub(BrokerMsgVpnList.prototype, 'log')
    })

    it('should call correct SEMP monitor endpoint', async () => {
      await BrokerMsgVpnList.run(['--broker-name=test-broker'])

      const getCall = context.mockConnection.get!.getCall(0)
      const url = getCall.args[0] as string
      expect(url).to.include('/SEMP/v2/monitor/msgVpns?')
    })

    it('should successfully list Message VPNs', async () => {
      const mockVpns: MsgVpnMonitor[] = [
        {enabled: true, msgSpoolMsgCount: 5, msgVpnName: 'vpn1', state: 'up'},
        {enabled: false, msgSpoolMsgCount: 0, msgVpnName: 'vpn2', state: 'down'},
      ]

      const mockResponse: MsgVpnsMonitorResponse = {
        data: mockVpns,
        meta: {
          responseCode: 200,
        },
      }

      context.mockConnection.get!.resolves(mockResponse)

      const result = await BrokerMsgVpnList.run(['--broker-name=test-broker'])

      expect(result.data).to.have.lengthOf(2)
      expect(result.data[0].msgVpnName).to.equal('vpn1')
      expect(result.data[1].msgVpnName).to.equal('vpn2')
    })

    it('should handle empty Message VPN list', async () => {
      const mockResponse: MsgVpnsMonitorResponse = {
        data: [],
        meta: {
          responseCode: 200,
        },
      }

      context.mockConnection.get!.resolves(mockResponse)

      const result = await BrokerMsgVpnList.run(['--broker-name=test-broker'])

      expect(result.data).to.have.lengthOf(0)
      const logStub = BrokerMsgVpnList.prototype.log as SinonStub
      const logCalls = logStub.getCalls().map(call => call.args[0])
      expect(logCalls.some((call: string) => call.includes('No Message VPNs found'))).to.be.true
    })
  })

  describe('Query Parameters', () => {
    beforeEach(() => {
      stubCommandMethod(context.sandbox, BrokerMsgVpnList, 'getBrokerAuthManager', context.mockBrokerAuthManager)
      context.sandbox.stub(BrokerMsgVpnList.prototype, 'log')
    })

    it('should use count parameter from flag', async () => {
      await BrokerMsgVpnList.run(['--broker-name=test-broker', '--count=20'])

      const url = context.mockConnection.get!.getCall(0).args[0] as string
      expect(url).to.include('count=20')
    })

    it('should add where parameter when name flag is provided', async () => {
      await BrokerMsgVpnList.run(['--broker-name=test-broker', '--name=prod*'])

      const url = context.mockConnection.get!.getCall(0).args[0] as string
      expect(url).to.include('where=msgVpnName')
      expect(url).to.match(/where=msgVpnName.*prod/)
    })

    it('should not add where parameter when name flag is not provided', async () => {
      await BrokerMsgVpnList.run(['--broker-name=test-broker'])

      const url = context.mockConnection.get!.getCall(0).args[0] as string
      expect(url).to.not.include('where=')
    })

    it('should error when more than 10 attributes are provided', async () => {
      try {
        await BrokerMsgVpnList.run([
          '--broker-name=test-broker',
          '--select=a,b,c,d,e,f,g,h,i,j,k',
        ])
        expect.fail('Should have thrown an error')
      } catch (error) {
        expect((error as Error).message).to.include('Maximum 10 attributes')
      }
    })
  })

  describe('Pagination', () => {
    beforeEach(() => {
      stubCommandMethod(context.sandbox, BrokerMsgVpnList, 'getBrokerAuthManager', context.mockBrokerAuthManager)
      context.sandbox.stub(BrokerMsgVpnList.prototype, 'log')
    })

    it('should fetch all pages without prompting when --all flag is set', async () => {
      const firstPageResponse: MsgVpnsMonitorResponse = {
        data: [{msgVpnName: 'vpn1'}, {msgVpnName: 'vpn2'}],
        meta: {
          paging: {
            cursorQuery: 'cursor123',
            nextPageUri: '/next',
          },
          responseCode: 200,
        },
      }

      const secondPageResponse: MsgVpnsMonitorResponse = {
        data: [{msgVpnName: 'vpn3'}],
        meta: {
          responseCode: 200,
        },
      }

      context.mockConnection.get!.onFirstCall().resolves(firstPageResponse)
      context.mockConnection.get!.onSecondCall().resolves(secondPageResponse)

      const result = await BrokerMsgVpnList.run(['--broker-name=test-broker', '--all'])

      expect(context.mockConnection.get!.callCount).to.equal(2)
      expect(result.data).to.have.lengthOf(3)
      const secondCallUrl = context.mockConnection.get!.getCall(1).args[0] as string
      expect(secondCallUrl).to.include('cursor=cursor123')
    })
  })
})
