import {AuthType, BrokerAuth, ScConnection} from '@dishantlangayan/sc-cli-core'
import {expect} from 'chai'
import {restore, type SinonStub, stub} from 'sinon'

import BrokerQueueDisplay from '../../../../src/commands/broker/queue/display.js'
import {MsgVpnQueueMonitorResponse, MsgVpnQueueSubscriptionsResponse} from '../../../../src/types/msgvpn-queue.js'

describe('broker:queue:display', () => {
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
      accessToken: 'dGVzdDp0ZXN0', // base64 encoded "test:test"
      authType: AuthType.BASIC,
      name: 'test-broker',
      sempEndpoint: 'https://localhost',
      sempPort: 8080,
    }

    // Setup mock connection
    mockConnection = {
      get: stub().resolves({
        data: {
          accessType: 'exclusive',
          msgVpnName: 'default',
          queueName: 'testQueue',
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

  describe('Basic Queue Display', () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub(BrokerQueueDisplay.prototype as any, 'getBrokerAuthManager').resolves(mockBrokerAuthManager)
      stub(BrokerQueueDisplay.prototype, 'log')
    })

    afterEach(() => {
      restore()
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

      mockConnection.get.resolves(mockResponse)

      const result = await BrokerQueueDisplay.run([
        '--broker-name=test-broker',
        '--queue-name=testQueue',
        '--msg-vpn-name=default',
      ])

      expect(result.queue).to.deep.equal(mockResponse)
      const logStub = BrokerQueueDisplay.prototype.log as SinonStub
      expect(logStub.called).to.be.true
    })
  })

  describe('SEMP Monitor API Calls', () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub(BrokerQueueDisplay.prototype as any, 'getBrokerAuthManager').resolves(mockBrokerAuthManager)
      stub(BrokerQueueDisplay.prototype, 'log')
    })

    afterEach(() => {
      restore()
    })

    it('should call correct Monitor API endpoint for queue details', async () => {
      await BrokerQueueDisplay.run([
        '--broker-name=test-broker',
        '--queue-name=testQueue',
        '--msg-vpn-name=default',
      ])

      expect(mockConnection.get.calledWith('/SEMP/v2/monitor/msgVpns/default/queues/testQueue')).to.be.true
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

      mockConnection.get.onSecondCall().resolves(mockSubsResponse)

      await BrokerQueueDisplay.run([
        '--broker-name=test-broker',
        '--queue-name=testQueue',
        '--msg-vpn-name=default',
        '--show-subscriptions',
      ])

      expect(mockConnection.get.callCount).to.equal(2)
      expect(mockConnection.get.secondCall.calledWith('/SEMP/v2/monitor/msgVpns/default/queues/testQueue/subscriptions'))
        .to.be.true
    })

    it('should not fetch subscriptions when --show-subscriptions flag is not set', async () => {
      await BrokerQueueDisplay.run([
        '--broker-name=test-broker',
        '--queue-name=testQueue',
        '--msg-vpn-name=default',
      ])

      expect(mockConnection.get.callCount).to.equal(1)
    })
  })

  describe('Subscriptions Display', () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub(BrokerQueueDisplay.prototype as any, 'getBrokerAuthManager').resolves(mockBrokerAuthManager)
      stub(BrokerQueueDisplay.prototype, 'log')
    })

    afterEach(() => {
      restore()
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

      mockConnection.get.onSecondCall().resolves(mockSubsResponse)

      const result = await BrokerQueueDisplay.run([
        '--broker-name=test-broker',
        '--queue-name=testQueue',
        '--msg-vpn-name=default',
        '--show-subscriptions',
      ])

      expect(result.subscriptions).to.deep.equal(mockSubsResponse)
      const logStub = BrokerQueueDisplay.prototype.log as SinonStub
      expect(logStub.called).to.be.true
    })

    it('should handle empty subscriptions list', async () => {
      const mockSubsResponse: MsgVpnQueueSubscriptionsResponse = {
        data: [],
        meta: {
          responseCode: 200,
        },
      }

      mockConnection.get.onSecondCall().resolves(mockSubsResponse)

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
  })
})
