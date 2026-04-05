import BrokerQueueSubscriptionsCreate from '../../../../../src/commands/broker/queue/subscriptions/create.js'
import {MsgVpnQueueSubscriptionCreateResponse} from '../../../../../src/types/msgvpn-queue.js'
import {
  buildSimpleResponse,
  expect,
  setupTestContext,
  type SinonStub,
  stubCommandMethod,
  type TestContext,
} from '../../../../helpers/index.js'

describe('broker:queue:subscriptions:create', () => {
  let context: TestContext

  beforeEach(() => {
    context = setupTestContext({}, ['post'])
    context.mockConnection.post!.resolves(
      buildSimpleResponse({
        data: {
          msgVpnName: 'default',
          queueName: 'testQueue',
          subscriptionTopic: 'orders/>',
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
        BrokerQueueSubscriptionsCreate,
        'getBrokerAuthManager',
        context.mockBrokerAuthManager,
      )
    })

    it('should call correct SEMP endpoint', async () => {
      await BrokerQueueSubscriptionsCreate.run([
        '--broker-name=test-broker',
        '--queue-name=testQueue',
        '--subscription-topic=orders/>',
        '--msg-vpn-name=default',
      ])

      expect(
        context.mockConnection.post!.calledWith('/SEMP/v2/config/msgVpns/default/queues/testQueue/subscriptions'),
      ).to.be.true
    })

    it('should map subscription-topic flag to request body', async () => {
      await BrokerQueueSubscriptionsCreate.run([
        '--broker-name=test-broker',
        '--queue-name=testQueue',
        '--subscription-topic=events/user/*',
        '--msg-vpn-name=default',
      ])

      const postCall = context.mockConnection.post!.getCall(0)
      const requestBody = postCall.args[1]

      expect(requestBody).to.deep.equal({
        subscriptionTopic: 'events/user/*',
      })
    })

    it('should handle wildcard characters in subscription topic', async () => {
      await BrokerQueueSubscriptionsCreate.run([
        '--broker-name=test-broker',
        '--queue-name=testQueue',
        '--subscription-topic=data/sensor/+/temperature',
        '--msg-vpn-name=default',
      ])

      const postCall = context.mockConnection.post!.getCall(0)
      const requestBody = postCall.args[1]

      expect(requestBody.subscriptionTopic).to.equal('data/sensor/+/temperature')
    })
  })

  describe('Response Display', () => {
    beforeEach(() => {
      stubCommandMethod(
        context.sandbox,
        BrokerQueueSubscriptionsCreate,
        'getBrokerAuthManager',
        context.mockBrokerAuthManager,
      )
      context.sandbox.stub(BrokerQueueSubscriptionsCreate.prototype, 'log')
    })

    it('should display subscription details on success', async () => {
      await BrokerQueueSubscriptionsCreate.run([
        '--broker-name=test-broker',
        '--queue-name=testQueue',
        '--subscription-topic=orders/>',
        '--msg-vpn-name=default',
      ])

      const logStub = BrokerQueueSubscriptionsCreate.prototype.log as SinonStub
      expect(logStub.called).to.be.true
    })

    it('should return SEMP response', async () => {
      const mockResponse: MsgVpnQueueSubscriptionCreateResponse = {
        data: {
          msgVpnName: 'default',
          queueName: 'testQueue',
          subscriptionTopic: 'orders/>',
        },
        meta: {
          responseCode: 200,
        },
      }

      context.mockConnection.post!.resolves(mockResponse)

      const result = await BrokerQueueSubscriptionsCreate.run([
        '--broker-name=test-broker',
        '--queue-name=testQueue',
        '--subscription-topic=orders/>',
        '--msg-vpn-name=default',
      ])

      expect(result.data).to.exist
      expect(result.data?.queueName).to.equal('testQueue')
      expect(result.data?.subscriptionTopic).to.equal('orders/>')
      expect(result.meta.responseCode).to.equal(200)
    })
  })

  describe('Flag Validation', () => {
    it('should error when queue-name is missing', async () => {
      try {
        await BrokerQueueSubscriptionsCreate.run([
          '--broker-name=test-broker',
          '--subscription-topic=orders/>',
          '--msg-vpn-name=default',
        ])
        expect.fail('Should have thrown error')
      } catch (error: unknown) {
        expect(error).to.be.instanceOf(Error)
        const err = error as Error
        expect(err.message).to.match(/Missing required flag/)
        expect(err.message).to.match(/queue-name/)
      }
    })

    it('should error when subscription-topic is missing', async () => {
      try {
        await BrokerQueueSubscriptionsCreate.run([
          '--broker-name=test-broker',
          '--queue-name=testQueue',
          '--msg-vpn-name=default',
        ])
        expect.fail('Should have thrown error')
      } catch (error: unknown) {
        expect(error).to.be.instanceOf(Error)
        const err = error as Error
        expect(err.message).to.match(/Missing required flag/)
        expect(err.message).to.match(/subscription-topic/)
      }
    })
  })
})
