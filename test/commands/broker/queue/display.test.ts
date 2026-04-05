import BrokerQueueDisplay from '../../../../src/commands/broker/queue/display.js'
import {MsgVpnQueueMonitorResponse, MsgVpnQueueSubscriptionsResponse} from '../../../../src/types/msgvpn-queue.js'
import {
  buildSimpleResponse,
  expect,
  setupTestContext,
  type SinonStub,
  stubCommandMethod,
  type TestContext,
} from '../../../helpers/index.js'

describe('broker:queue:display', () => {
  let context: TestContext

  beforeEach(() => {
    context = setupTestContext({}, ['get'])
    context.mockConnection.get!.resolves(
      buildSimpleResponse({
        data: {
          accessType: 'exclusive',
          msgVpnName: 'default',
          queueName: 'testQueue',
        },
      }),
    )
  })

  afterEach(() => {
    context.cleanup()
  })

  describe('Basic Queue Display', () => {
    beforeEach(() => {
      stubCommandMethod(context.sandbox, BrokerQueueDisplay, 'getBrokerAuthManager', context.mockBrokerAuthManager)
      context.sandbox.stub(BrokerQueueDisplay.prototype, 'log')
    })

    it('should successfully retrieve and display queue details', async () => {
      const mockResponse: MsgVpnQueueMonitorResponse = {
        data: {
          accessType: 'exclusive',
          durable: true,
          egressEnabled: true,
          ingressEnabled: true,
          maxMsgSpoolUsage: 5000,
          msgSpoolUsage: 1024,
          msgVpnName: 'default',
          permission: 'consume',
          queueName: 'testQueue',
        },
        meta: {
          request: {method: 'GET', uri: '/monitor/msgVpns/default/queues/testQueue'},
          responseCode: 200,
        },
      }

      context.mockConnection.get!.resolves(mockResponse)

      const result = await BrokerQueueDisplay.run([
        '--broker-name=test-broker',
        '--queue-name=testQueue',
        '--msg-vpn-name=default',
      ])

      expect(result.queue).to.deep.equal(mockResponse)
      const logStub = BrokerQueueDisplay.prototype.log as SinonStub
      expect(logStub.called).to.be.true

      // Verify queue details are shown when flag is not set
      const logCalls = logStub.getCalls().map(call => call.args[0])
      expect(logCalls.some((call: string) => call.includes('Queue Details'))).to.be.true
    })
  })

  describe('SEMP Monitor API Calls', () => {
    beforeEach(() => {
      stubCommandMethod(context.sandbox, BrokerQueueDisplay, 'getBrokerAuthManager', context.mockBrokerAuthManager)
      context.sandbox.stub(BrokerQueueDisplay.prototype, 'log')
    })

    it('should call correct Monitor API endpoint for queue details', async () => {
      await BrokerQueueDisplay.run([
        '--broker-name=test-broker',
        '--queue-name=testQueue',
        '--msg-vpn-name=default',
      ])

      expect(context.mockConnection.get!.calledWith('/SEMP/v2/monitor/msgVpns/default/queues/testQueue')).to.be.true
    })

    it('should call subscriptions endpoint when --show-subscriptions flag is set', async () => {
      const mockSubsResponse: MsgVpnQueueSubscriptionsResponse = {
        data: [
          {msgVpnName: 'default', queueName: 'testQueue', subscriptionTopic: 'topic/a'},
          {msgVpnName: 'default', queueName: 'testQueue', subscriptionTopic: 'topic/b'},
        ],
        meta: {
          responseCode: 200,
        },
      }

      context.mockConnection.get!.onSecondCall().resolves(mockSubsResponse)

      await BrokerQueueDisplay.run([
        '--broker-name=test-broker',
        '--queue-name=testQueue',
        '--msg-vpn-name=default',
        '--show-subscriptions',
      ])

      expect(context.mockConnection.get!.callCount).to.equal(2)
      expect(context.mockConnection.get!.secondCall.calledWith('/SEMP/v2/monitor/msgVpns/default/queues/testQueue/subscriptions'))
        .to.be.true
    })

    it('should not fetch subscriptions when --show-subscriptions flag is not set', async () => {
      await BrokerQueueDisplay.run([
        '--broker-name=test-broker',
        '--queue-name=testQueue',
        '--msg-vpn-name=default',
      ])

      expect(context.mockConnection.get!.callCount).to.equal(1)
    })
  })

  describe('Subscriptions Display', () => {
    beforeEach(() => {
      stubCommandMethod(context.sandbox, BrokerQueueDisplay, 'getBrokerAuthManager', context.mockBrokerAuthManager)
      context.sandbox.stub(BrokerQueueDisplay.prototype, 'log')
    })

    it('should display subscriptions when --show-subscriptions flag is set', async () => {
      const mockSubsResponse: MsgVpnQueueSubscriptionsResponse = {
        data: [
          {msgVpnName: 'default', queueName: 'testQueue', subscriptionTopic: 'topic/a'},
          {msgVpnName: 'default', queueName: 'testQueue', subscriptionTopic: 'topic/b'},
        ],
        meta: {
          responseCode: 200,
        },
      }

      context.mockConnection.get!.onSecondCall().resolves(mockSubsResponse)

      const result = await BrokerQueueDisplay.run([
        '--broker-name=test-broker',
        '--queue-name=testQueue',
        '--msg-vpn-name=default',
        '--show-subscriptions',
      ])

      expect(result.subscriptions).to.deep.equal(mockSubsResponse)
      const logStub = BrokerQueueDisplay.prototype.log as SinonStub
      expect(logStub.called).to.be.true

      // Verify queue details are NOT shown and subscriptions ARE shown
      const logCalls = logStub.getCalls().map(call => call.args[0])
      expect(logCalls.some((call: string) => call.includes('Queue Details'))).to.be.false
      expect(logCalls.some((call: string) => call.includes('Queue Subscriptions'))).to.be.true
    })

    it('should handle empty subscriptions list', async () => {
      const mockSubsResponse: MsgVpnQueueSubscriptionsResponse = {
        data: [],
        meta: {
          responseCode: 200,
        },
      }

      context.mockConnection.get!.onSecondCall().resolves(mockSubsResponse)

      await BrokerQueueDisplay.run([
        '--broker-name=test-broker',
        '--queue-name=testQueue',
        '--msg-vpn-name=default',
        '--show-subscriptions',
      ])

      const logStub = BrokerQueueDisplay.prototype.log as SinonStub
      const logCalls = logStub.getCalls().map(call => call.args[0])
      expect(logCalls.some((call: string) => call.includes('No subscriptions found'))).to.be.true
    })

    it('should NOT display queue details when --show-subscriptions flag is set', async () => {
      const mockSubsResponse: MsgVpnQueueSubscriptionsResponse = {
        data: [
          {msgVpnName: 'default', queueName: 'testQueue', subscriptionTopic: 'topic/a'},
        ],
        meta: {
          responseCode: 200,
        },
      }

      context.mockConnection.get!.onSecondCall().resolves(mockSubsResponse)

      await BrokerQueueDisplay.run([
        '--broker-name=test-broker',
        '--queue-name=testQueue',
        '--msg-vpn-name=default',
        '--show-subscriptions',
      ])

      const logStub = BrokerQueueDisplay.prototype.log as SinonStub
      const logCalls = logStub.getCalls().map(call => call.args[0])

      // Verify queue details are NOT shown
      expect(logCalls.some((call: string) => call.includes('Queue Details'))).to.be.false

      // Verify subscriptions ARE shown
      expect(logCalls.some((call: string) => call.includes('Queue Subscriptions'))).to.be.true
    })
  })
})
