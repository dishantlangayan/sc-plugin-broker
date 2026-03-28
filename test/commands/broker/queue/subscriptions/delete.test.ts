import {AuthType, type BrokerAuth, type ScConnection} from '@dishantlangayan/sc-cli-core'
import {expect} from 'chai'
import {restore, type SinonStub, stub} from 'sinon'

import type {MsgVpnQueueSubscriptionDeleteResponse} from '../../../../../src/types/msgvpn-queue.js'

import BrokerQueueSubscriptionsDelete from '../../../../../src/commands/broker/queue/subscriptions/delete.js'

describe('broker:queue:subscriptions:delete', () => {
  let mockBroker: BrokerAuth
  let mockBrokerAuthManager: {
    brokerExists: SinonStub
    createConnection: SinonStub
    getBroker: SinonStub
    getDefaultBroker: SinonStub
  }
  let mockConnection: {
    delete: SinonStub
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

    // Setup mock connection with stubbed DELETE method
    mockConnection = {
      delete: stub().resolves({
        meta: {
          responseCode: 200,
        },
      } as MsgVpnQueueSubscriptionDeleteResponse),
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
    stub(BrokerQueueSubscriptionsDelete.prototype as any, 'getBrokerAuthManager').resolves(mockBrokerAuthManager)
    logStub = stub(BrokerQueueSubscriptionsDelete.prototype, 'log')
  })

  afterEach(() => {
    restore()
  })

  describe('SEMP API Calls', () => {
    it('should call correct SEMP endpoint with --no-prompt', async () => {
      await BrokerQueueSubscriptionsDelete.run([
        '--broker-name=test-broker',
        '--queue-name=testQueue',
        '--subscription-topic=orders/>',
        '--msg-vpn-name=default',
        '--no-prompt',
      ])

      expect(
        mockConnection.delete.calledWith('/SEMP/v2/config/msgVpns/default/queues/testQueue/subscriptions/orders%2F%3E'),
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
        mockConnection.delete.calledWith(
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

      expect(mockConnection.delete.called).to.be.true
      const endpoint = mockConnection.delete.getCall(0).args[0]
      expect(endpoint).to.include('data%2F%2B%2Fsensor')
    })
  })

  describe('Response Display', () => {
    it('should display success message on 200 response', async () => {
      await BrokerQueueSubscriptionsDelete.run([
        '--broker-name=test-broker',
        '--queue-name=testQueue',
        '--subscription-topic=orders/>',
        '--msg-vpn-name=default',
        '--no-prompt',
      ])

      expect(logStub.calledWith(
        "\nSuccessfully deleted subscription 'orders/>' from queue 'testQueue' in Message VPN 'default'",
      )).to.be.true
    })

    it('should return SEMP response', async () => {
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
    it('should skip confirmation when --no-prompt is set', async () => {
      await BrokerQueueSubscriptionsDelete.run([
        '--broker-name=test-broker',
        '--queue-name=testQueue',
        '--subscription-topic=orders/>',
        '--msg-vpn-name=default',
        '--no-prompt',
      ])

      expect(mockConnection.delete.called).to.be.true
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
