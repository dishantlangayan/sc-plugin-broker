import BrokerQueueUpdate from '../../../../src/commands/broker/queue/update.js'
import {MsgVpnQueueUpdateResponse} from '../../../../src/types/msgvpn-queue.js'
import {
  buildSimpleResponse,
  expect,
  setupTestContext,
  type SinonStub,
  stubCommandMethod,
  type TestContext,
} from '../../../helpers/index.js'

describe('broker:queue:update', () => {
  let context: TestContext

  beforeEach(() => {
    context = setupTestContext({}, ['patch'])
    context.mockConnection.patch!.resolves(
      buildSimpleResponse({
        data: {
          msgVpnName: 'default',
          queueName: 'testQueue',
        },
      }),
    )
  })

  afterEach(() => {
    context.cleanup()
  })

  describe('SEMP API Calls', () => {
    beforeEach(() => {
      stubCommandMethod(context.sandbox, BrokerQueueUpdate, 'getBrokerAuthManager', context.mockBrokerAuthManager)
    })

    it('should call correct SEMP endpoint with queue name', async () => {
      await BrokerQueueUpdate.run([
        '--broker-name=test-broker',
        '--queue-name=testQueue',
        '--msg-vpn-name=default',
      ])

      expect(context.mockConnection.patch!.calledWith('/SEMP/v2/config/msgVpns/default/queues/testQueue')).to.be
        .true
    })

    it('should use PATCH method not POST', async () => {
      await BrokerQueueUpdate.run([
        '--broker-name=test-broker',
        '--queue-name=myQueue',
        '--msg-vpn-name=default',
        '--egress-enabled',
      ])

      expect(context.mockConnection.patch!.called).to.be.true
      expect(context.mockConnection.patch!.callCount).to.equal(1)
    })
  })

  describe('Flag Mapping', () => {
    beforeEach(() => {
      stubCommandMethod(context.sandbox, BrokerQueueUpdate, 'getBrokerAuthManager', context.mockBrokerAuthManager)
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

      const patchCall = context.mockConnection.patch!.getCall(0)
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

      const patchCall = context.mockConnection.patch!.getCall(0)
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

      const patchCall = context.mockConnection.patch!.getCall(0)
      const requestBody = patchCall.args[1]

      expect(requestBody).to.deep.equal({
        egressEnabled: false,
        ingressEnabled: false,
      })
    })
  })

  describe('Partial Updates', () => {
    beforeEach(() => {
      stubCommandMethod(context.sandbox, BrokerQueueUpdate, 'getBrokerAuthManager', context.mockBrokerAuthManager)
    })

    it('should send minimal request with only one flag', async () => {
      await BrokerQueueUpdate.run([
        '--broker-name=test-broker',
        '--queue-name=minimalQueue',
        '--msg-vpn-name=default',
        '--egress-enabled',
      ])

      const patchCall = context.mockConnection.patch!.getCall(0)
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

      const patchCall = context.mockConnection.patch!.getCall(0)
      const requestBody = patchCall.args[1]

      expect(requestBody).to.deep.equal({
        permission: 'read-only',
      })
    })
  })

  describe('Response Display', () => {
    beforeEach(() => {
      stubCommandMethod(context.sandbox, BrokerQueueUpdate, 'getBrokerAuthManager', context.mockBrokerAuthManager)
      context.sandbox.stub(BrokerQueueUpdate.prototype, 'log')
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

      context.mockConnection.patch!.resolves(mockResponse)

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

      context.mockConnection.patch!.resolves(mockResponse)

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
