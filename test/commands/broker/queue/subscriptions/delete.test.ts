import BrokerQueueSubscriptionsDelete from '../../../../../src/commands/broker/queue/subscriptions/delete.js'
import {MsgVpnQueueSubscriptionDeleteResponse} from '../../../../../src/types/msgvpn-queue.js'
import {
  buildDeleteResponse,
  expect,
  setupTestContext,
  type SinonStub,
  stubCommandMethod,
  type TestContext,
} from '../../../../helpers/index.js'

describe('broker:queue:subscriptions:delete', () => {
  let context: TestContext

  beforeEach(() => {
    context = setupTestContext({}, ['delete'])
    context.mockConnection.delete!.resolves(buildDeleteResponse())
  })

  afterEach(() => {
    context.cleanup()
  })

  describe('SEMP API Calls', () => {
    beforeEach(() => {
      stubCommandMethod(
        context.sandbox,
        BrokerQueueSubscriptionsDelete,
        'getBrokerAuthManager',
        context.mockBrokerAuthManager,
      )
    })

    it('should call correct SEMP endpoint with --no-prompt', async () => {
      await BrokerQueueSubscriptionsDelete.run([
        '--broker-name=test-broker',
        '--queue-name=testQueue',
        '--subscription-topic=orders/>',
        '--msg-vpn-name=default',
        '--no-prompt',
      ])

      expect(
        context.mockConnection.delete!.calledWith('/SEMP/v2/config/msgVpns/default/queues/testQueue/subscriptions/orders%2F%3E'),
      ).to.be.true
    })

    it('should URL encode subscription topic in endpoint', async () => {
      await BrokerQueueSubscriptionsDelete.run([
        '--broker-name=test-broker',
        '--queue-name=testQueue',
        '--subscription-topic=events/user/*',
        '--msg-vpn-name=default',
        '--no-prompt',
      ])

      expect(
        context.mockConnection.delete!.calledWith(
          '/SEMP/v2/config/msgVpns/default/queues/testQueue/subscriptions/events%2Fuser%2F*',
        ),
      ).to.be.true
    })

    it('should handle special characters in subscription topic', async () => {
      await BrokerQueueSubscriptionsDelete.run([
        '--broker-name=test-broker',
        '--queue-name=testQueue',
        '--subscription-topic=data/+/sensor',
        '--msg-vpn-name=default',
        '--no-prompt',
      ])

      expect(context.mockConnection.delete!.called).to.be.true
      const endpoint = context.mockConnection.delete!.getCall(0).args[0]
      expect(endpoint).to.include('data%2F%2B%2Fsensor')
    })
  })

  describe('Response Display', () => {
    beforeEach(() => {
      stubCommandMethod(
        context.sandbox,
        BrokerQueueSubscriptionsDelete,
        'getBrokerAuthManager',
        context.mockBrokerAuthManager,
      )
      context.sandbox.stub(BrokerQueueSubscriptionsDelete.prototype, 'log')
    })

    it('should display success message on 200 response', async () => {
      await BrokerQueueSubscriptionsDelete.run([
        '--broker-name=test-broker',
        '--queue-name=testQueue',
        '--subscription-topic=orders/>',
        '--msg-vpn-name=default',
        '--no-prompt',
      ])

      const logStub = BrokerQueueSubscriptionsDelete.prototype.log as SinonStub
      expect(logStub.calledWith(
        "\nSuccessfully deleted subscription 'orders/>' from queue 'testQueue' in Message VPN 'default'",
      )).to.be.true
    })

    it('should return SEMP response', async () => {
      const mockResponse: MsgVpnQueueSubscriptionDeleteResponse = {
        meta: {
          responseCode: 200,
        },
      }

      context.mockConnection.delete!.resolves(mockResponse)

      const result = await BrokerQueueSubscriptionsDelete.run([
        '--broker-name=test-broker',
        '--queue-name=testQueue',
        '--subscription-topic=orders/>',
        '--msg-vpn-name=default',
        '--no-prompt',
      ])

      expect(result.meta).to.exist
      expect(result.meta.responseCode).to.equal(200)
    })
  })

  describe('--no-prompt Flag', () => {
    beforeEach(() => {
      stubCommandMethod(
        context.sandbox,
        BrokerQueueSubscriptionsDelete,
        'getBrokerAuthManager',
        context.mockBrokerAuthManager,
      )
    })

    it('should skip confirmation when --no-prompt is set', async () => {
      await BrokerQueueSubscriptionsDelete.run([
        '--broker-name=test-broker',
        '--queue-name=testQueue',
        '--subscription-topic=orders/>',
        '--msg-vpn-name=default',
        '--no-prompt',
      ])

      expect(context.mockConnection.delete!.called).to.be.true
    })
  })

  describe('Flag Validation', () => {
    it('should error when queue-name is missing', async () => {
      try {
        await BrokerQueueSubscriptionsDelete.run([
          '--broker-name=test-broker',
          '--subscription-topic=orders/>',
          '--msg-vpn-name=default',
          '--no-prompt',
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
        await BrokerQueueSubscriptionsDelete.run([
          '--broker-name=test-broker',
          '--queue-name=testQueue',
          '--msg-vpn-name=default',
          '--no-prompt',
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
