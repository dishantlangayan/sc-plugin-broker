import {AuthType, type BrokerAuth, type ScConnection} from '@dishantlangayan/sc-cli-core'
import {expect} from 'chai'
import {restore, type SinonStub, stub} from 'sinon'

import type {MsgVpnQueueSubscriptionCreateResponse} from '../../../../../src/types/msgvpn-queue.js'

import BrokerQueueSubscriptionsCreate from '../../../../../src/commands/broker/queue/subscriptions/create.js'

describe('broker:queue:subscriptions:create', () => {
  let mockBroker: BrokerAuth
  let mockBrokerAuthManager: {
    brokerExists: SinonStub
    createConnection: SinonStub
    getBroker: SinonStub
    getDefaultBroker: SinonStub
  }
  let mockConnection: {
    post: SinonStub
  }
  let logStub: SinonStub

  beforeEach(() => {
    // Setup mock broker with required credentials
    mockBroker = {
      accessToken: 'dGVzdDp0ZXN0', // base64 encoded "test:test"
      authType: AuthType.BASIC,
      name: 'test-broker',
      sempEndpoint: 'https://localhost',
      sempPort: 8080,
    }

    // Setup mock connection with stubbed POST method
    mockConnection = {
      post: stub().resolves({
        data: {
          msgVpnName: 'default',
          queueName: 'testQueue',
          subscriptionTopic: 'orders/>',
        },
        meta: {
          responseCode: 200,
        },
      } as MsgVpnQueueSubscriptionCreateResponse),
    }

    // Setup mock BrokerAuthManager
    mockBrokerAuthManager = {
      brokerExists: stub().resolves(true),
      createConnection: stub().resolves(mockConnection as unknown as ScConnection),
      getBroker: stub().resolves(mockBroker),
      getDefaultBroker: stub().resolves(null),
    }

    // Stub the getBrokerAuthManager method on the command
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stub(BrokerQueueSubscriptionsCreate.prototype as any, 'getBrokerAuthManager').resolves(mockBrokerAuthManager)
    logStub = stub(BrokerQueueSubscriptionsCreate.prototype, 'log')
  })

  afterEach(() => {
    restore()
  })

  describe('SEMP API Calls', () => {
    it('should call correct SEMP endpoint', async () => {
      await BrokerQueueSubscriptionsCreate.run([
        '--broker-name=test-broker',
        '--queue-name=testQueue',
        '--subscription-topic=orders/>',
        '--msg-vpn-name=default',
      ])

      expect(
        mockConnection.post.calledWith('/SEMP/v2/config/msgVpns/default/queues/testQueue/subscriptions'),
      ).to.be.true
    })

    it('should map subscription-topic flag to request body', async () => {
      await BrokerQueueSubscriptionsCreate.run([
        '--broker-name=test-broker',
        '--queue-name=testQueue',
        '--subscription-topic=events/user/*',
        '--msg-vpn-name=default',
      ])

      const postCall = mockConnection.post.getCall(0)
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

      const postCall = mockConnection.post.getCall(0)
      const requestBody = postCall.args[1]

      expect(requestBody.subscriptionTopic).to.equal('data/sensor/+/temperature')
    })
  })

  describe('Response Display', () => {
    it('should display subscription details on success', async () => {
      await BrokerQueueSubscriptionsCreate.run([
        '--broker-name=test-broker',
        '--queue-name=testQueue',
        '--subscription-topic=orders/>',
        '--msg-vpn-name=default',
      ])

      expect(logStub.called).to.be.true
    })

    it('should return SEMP response', async () => {
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
