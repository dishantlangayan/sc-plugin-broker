import {AuthType, BrokerAuth, ScConnection} from '@dishantlangayan/sc-cli-core'
import {expect} from 'chai'
import {restore, type SinonStub, stub} from 'sinon'

import BrokerQueueCreate from '../../../../src/commands/broker/queue/create.js'
import {MsgVpnQueueCreateResponse} from '../../../../src/types/msgvpn-queue.js'

describe('broker:queue:create', () => {
  let mockBrokerAuthManager: {
    brokerExists: SinonStub
    createConnection: SinonStub
    getBroker: SinonStub
  }
  let mockConnection: {
    post: SinonStub
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
      post: stub().resolves({
        data: {
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
    }
  })

  describe('Default Values', () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub(BrokerQueueCreate.prototype as any, 'getBrokerAuthManager').resolves(mockBrokerAuthManager)
    })

    afterEach(() => {
      restore()
    })

    it('should default permission to "consume"', async () => {
      await BrokerQueueCreate.run([
        '--broker-name=test-broker',
        '--queue-name=testQueue',
        '--msg-vpn-name=default',
      ])

      const postCall = mockConnection.post.getCall(0)
      expect(postCall.args[1]).to.have.property('permission', 'consume')
    })

    it('should allow overriding permission default', async () => {
      await BrokerQueueCreate.run([
        '--broker-name=test-broker',
        '--queue-name=testQueue',
        '--msg-vpn-name=default',
        '--permission=no-access',
      ])

      const postCall = mockConnection.post.getCall(0)
      expect(postCall.args[1]).to.have.property('permission', 'no-access')
    })
  })

  describe('SEMP API Calls', () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub(BrokerQueueCreate.prototype as any, 'getBrokerAuthManager').resolves(mockBrokerAuthManager)
    })

    afterEach(() => {
      restore()
    })

    it('should call correct SEMP endpoint', async () => {
      await BrokerQueueCreate.run([
        '--broker-name=test-broker',
        '--queue-name=testQueue',
        '--msg-vpn-name=default',
      ])

      expect(mockConnection.post.calledWith('/SEMP/v2/config/msgVpns/default/queues')).to.be.true
    })

    it('should map all flags correctly to SEMP request body', async () => {
      await BrokerQueueCreate.run([
        '--broker-name=test-broker',
        '--queue-name=advancedQueue',
        '--msg-vpn-name=default',
        '--access-type=non-exclusive',
        '--dead-msg-queue=#DEAD_MSG_QUEUE',
        '--egress-enabled',
        '--ingress-enabled',
        '--max-msg-spool-usage=1024',
        '--max-redelivery-count=3',
        '--max-ttl=3600',
        '--owner=admin',
        '--permission=delete',
        '--respect-ttl-enabled',
      ])

      const postCall = mockConnection.post.getCall(0)
      const requestBody = postCall.args[1]

      expect(requestBody).to.deep.equal({
        accessType: 'non-exclusive',
        deadMsgQueue: '#DEAD_MSG_QUEUE',
        egressEnabled: true,
        ingressEnabled: true,
        maxMsgSpoolUsage: 1024,
        maxRedeliveryCount: 3,
        maxTtl: 3600,
        owner: 'admin',
        permission: 'delete',
        queueName: 'advancedQueue',
        respectTtlEnabled: true,
      })
    })

    it('should send minimal request with only required flags', async () => {
      await BrokerQueueCreate.run([
        '--broker-name=test-broker',
        '--queue-name=minimalQueue',
        '--msg-vpn-name=default',
      ])

      const postCall = mockConnection.post.getCall(0)
      const requestBody = postCall.args[1]

      expect(requestBody).to.deep.equal({
        permission: 'consume', // default value
        queueName: 'minimalQueue',
      })
    })
  })

  describe('Response Display', () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub(BrokerQueueCreate.prototype as any, 'getBrokerAuthManager').resolves(mockBrokerAuthManager)
      stub(BrokerQueueCreate.prototype, 'log')
    })

    afterEach(() => {
      restore()
    })

    it('should display success message with queue details', async () => {
      const mockResponse: MsgVpnQueueCreateResponse = {
        data: {
          msgVpnName: 'default',
          queueName: 'testQueue',
        },
        meta: {
          request: {method: 'POST', uri: '/config/msgVpns/default/queues'},
          responseCode: 200,
        },
      }

      mockConnection.post.resolves(mockResponse)

      await BrokerQueueCreate.run([
        '--broker-name=test-broker',
        '--queue-name=testQueue',
        '--msg-vpn-name=default',
      ])

      const logStub = BrokerQueueCreate.prototype.log as SinonStub
      expect(logStub.called).to.be.true
    })

    it('should return MsgVpnQueueCreateResponse', async () => {
      const mockResponse: MsgVpnQueueCreateResponse = {
        data: {
          msgVpnName: 'default',
          queueName: 'testQueue',
        },
        meta: {
          responseCode: 200,
        },
      }

      mockConnection.post.resolves(mockResponse)

      const result = await BrokerQueueCreate.run([
        '--broker-name=test-broker',
        '--queue-name=testQueue',
        '--msg-vpn-name=default',
      ])

      expect(result).to.deep.equal(mockResponse)
    })
  })
})
