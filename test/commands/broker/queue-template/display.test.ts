import BrokerQueueTemplateDisplay from '../../../../src/commands/broker/queue-template/display.js'
import {MsgVpnQueueTemplateMonitorResponse} from '../../../../src/types/msgvpn-queue-template.js'
import {
  buildSimpleResponse,
  expect,
  setupTestContext,
  type SinonStub,
  stubCommandMethod,
  type TestContext,
} from '../../../helpers/index.js'

describe('broker:queue-template:display', () => {
  let context: TestContext

  beforeEach(() => {
    context = setupTestContext({}, ['get'])
    context.mockConnection.get!.resolves(
      buildSimpleResponse({
        data: {
          accessType: 'exclusive',
          msgVpnName: 'default',
          queueTemplateName: 'testTemplate',
        },
      }),
    )
  })

  afterEach(() => {
    context.cleanup()
  })

  describe('Basic Queue Template Display', () => {
    beforeEach(() => {
      stubCommandMethod(context.sandbox, BrokerQueueTemplateDisplay, 'getBrokerAuthManager', context.mockBrokerAuthManager)
      context.sandbox.stub(BrokerQueueTemplateDisplay.prototype, 'log')
    })

    it('should successfully retrieve and display queue template details', async () => {
      const mockResponse: MsgVpnQueueTemplateMonitorResponse = {
        data: {
          accessType: 'exclusive',
          maxBindCount: 10,
          maxMsgSpoolUsage: 5000,
          msgVpnName: 'default',
          permission: 'consume',
          queueNameFilter: 'order.*',
          queueTemplateName: 'testTemplate',
        },
        meta: {
          request: {method: 'GET', uri: '/monitor/msgVpns/default/queueTemplates/testTemplate'},
          responseCode: 200,
        },
      }

      context.mockConnection.get!.resolves(mockResponse)

      const result = await BrokerQueueTemplateDisplay.run([
        '--broker-name=test-broker',
        '--msg-vpn-name=default',
        '--name=testTemplate',
      ])

      expect(result.queueTemplate).to.deep.equal(mockResponse)
      const logStub = BrokerQueueTemplateDisplay.prototype.log as SinonStub
      expect(logStub.called).to.be.true

      // Verify queue template details header is shown
      const logCalls = logStub.getCalls().map(call => call.args[0])
      expect(logCalls.some((call: string) => call.includes('Queue Template Details'))).to.be.true
    })
  })

  describe('SEMP Monitor API Calls', () => {
    beforeEach(() => {
      stubCommandMethod(context.sandbox, BrokerQueueTemplateDisplay, 'getBrokerAuthManager', context.mockBrokerAuthManager)
      context.sandbox.stub(BrokerQueueTemplateDisplay.prototype, 'log')
    })

    it('should call correct Monitor API endpoint for queue template details', async () => {
      await BrokerQueueTemplateDisplay.run([
        '--broker-name=test-broker',
        '--msg-vpn-name=default',
        '--name=testTemplate',
      ])

      expect(context.mockConnection.get!.calledWith('/SEMP/v2/monitor/msgVpns/default/queueTemplates/testTemplate')).to
        .be.true
    })

    it('should call the endpoint only once', async () => {
      await BrokerQueueTemplateDisplay.run([
        '--broker-name=test-broker',
        '--msg-vpn-name=default',
        '--name=testTemplate',
      ])

      expect(context.mockConnection.get!.callCount).to.equal(1)
    })
  })
})
