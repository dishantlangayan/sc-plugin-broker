import {AuthType, BrokerAuth, ScConnection} from '@dishantlangayan/sc-cli-core'
import {expect} from 'chai'
import {restore, type SinonStub, stub} from 'sinon'

import BrokerQueueUpdate from '../../../../src/commands/broker/queue/update.js'
import {MsgVpnQueueUpdateResponse} from '../../../../src/types/msgvpn-queue.js'

describe('broker:queue:update', () => {
  let mockBrokerAuthManager: {
    brokerExists: SinonStub
    createConnection: SinonStub
    getBroker: SinonStub
    getDefaultBroker: SinonStub
  }
  let mockConnection: {
    patch: SinonStub
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
      patch: stub().resolves({
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
      getDefaultBroker: stub().resolves(null),
    }
  })

  describe('SEMP API Calls', () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub(BrokerQueueUpdate.prototype as any, 'getBrokerAuthManager').resolves(mockBrokerAuthManager)
    })

    afterEach(() => {
      restore()
    })

    it('should call correct SEMP endpoint with queue name', async () => {
      await BrokerQueueUpdate.run([
        '--broker-name=test-broker',
        '--queue-name=testQueue',
        '--msg-vpn-name=default',
      ])

      expect(mockConnection.patch.calledWith('/SEMP/v2/config/msgVpns/default/queues/testQueue')).to.be.true
    })

    it('should use PATCH method not POST', async () => {
      await BrokerQueueUpdate.run([
        '--broker-name=test-broker',
        '--queue-name=myQueue',
        '--msg-vpn-name=default',
        '--egress-enabled',
      ])

      expect(mockConnection.patch.called).to.be.true
      expect(mockConnection.patch.callCount).to.equal(1)
    })
  })

  describe('Flag Mapping', () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub(BrokerQueueUpdate.prototype as any, 'getBrokerAuthManager').resolves(mockBrokerAuthManager)
    })

    afterEach(() => {
      restore()
    })

    it('should map all flags correctly to SEMP request body', async () => {
      await BrokerQueueUpdate.run([
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

      const patchCall = mockConnection.patch.getCall(0)
      const requestBody = patchCall.args[1]

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
        respectTtlEnabled: true,
      })
    })

    it('should NOT include queueName in request body', async () => {
      await BrokerQueueUpdate.run([
        '--broker-name=test-broker',
        '--queue-name=testQueue',
        '--msg-vpn-name=default',
        '--egress-enabled',
      ])

      const patchCall = mockConnection.patch.getCall(0)
      const requestBody = patchCall.args[1]

      expect(requestBody).to.not.have.property('queueName')
    })

    it('should handle boolean flags with allowNo correctly', async () => {
      await BrokerQueueUpdate.run([
        '--broker-name=test-broker',
        '--queue-name=testQueue',
        '--msg-vpn-name=default',
        '--no-egress-enabled',
        '--no-ingress-enabled',
      ])

      const patchCall = mockConnection.patch.getCall(0)
      const requestBody = patchCall.args[1]

      expect(requestBody).to.deep.equal({
        egressEnabled: false,
        ingressEnabled: false,
      })
    })
  })

  describe('Partial Updates', () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub(BrokerQueueUpdate.prototype as any, 'getBrokerAuthManager').resolves(mockBrokerAuthManager)
    })

    afterEach(() => {
      restore()
    })

    it('should send minimal request with only one flag', async () => {
      await BrokerQueueUpdate.run([
        '--broker-name=test-broker',
        '--queue-name=minimalQueue',
        '--msg-vpn-name=default',
        '--egress-enabled',
      ])

      const patchCall = mockConnection.patch.getCall(0)
      const requestBody = patchCall.args[1]

      expect(requestBody).to.deep.equal({
        egressEnabled: true,
      })
    })

    it('should allow updating only permission', async () => {
      await BrokerQueueUpdate.run([
        '--broker-name=test-broker',
        '--queue-name=testQueue',
        '--msg-vpn-name=default',
        '--permission=read-only',
      ])

      const patchCall = mockConnection.patch.getCall(0)
      const requestBody = patchCall.args[1]

      expect(requestBody).to.deep.equal({
        permission: 'read-only',
      })
    })
  })

  describe('Response Display', () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub(BrokerQueueUpdate.prototype as any, 'getBrokerAuthManager').resolves(mockBrokerAuthManager)
      stub(BrokerQueueUpdate.prototype, 'log')
    })

    afterEach(() => {
      restore()
    })

    it('should display success message with queue details', async () => {
      const mockResponse: MsgVpnQueueUpdateResponse = {
        data: {
          msgVpnName: 'default',
          queueName: 'testQueue',
        },
        meta: {
          request: {method: 'PATCH', uri: '/config/msgVpns/default/queues/testQueue'},
          responseCode: 200,
        },
      }

      mockConnection.patch.resolves(mockResponse)

      await BrokerQueueUpdate.run([
        '--broker-name=test-broker',
        '--queue-name=testQueue',
        '--msg-vpn-name=default',
        '--egress-enabled',
      ])

      const logStub = BrokerQueueUpdate.prototype.log as SinonStub
      expect(logStub.called).to.be.true
    })

    it('should return MsgVpnQueueUpdateResponse', async () => {
      const mockResponse: MsgVpnQueueUpdateResponse = {
        data: {
          msgVpnName: 'default',
          queueName: 'testQueue',
        },
        meta: {
          responseCode: 200,
        },
      }

      mockConnection.patch.resolves(mockResponse)

      const result = await BrokerQueueUpdate.run([
        '--broker-name=test-broker',
        '--queue-name=testQueue',
        '--msg-vpn-name=default',
        '--max-msg-spool-usage=2048',
      ])

      expect(result).to.deep.equal(mockResponse)
    })
  })
})
