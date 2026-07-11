import BrokerQueueTemplateUpdate from '../../../../src/commands/broker/queue-template/update.js'
import {MsgVpnQueueTemplateUpdateResponse} from '../../../../src/types/msgvpn-queue-template.js'
import {
  buildSimpleResponse,
  expect,
  setupTestContext,
  type SinonStub,
  stubCommandMethod,
  type TestContext,
} from '../../../helpers/index.js'

describe('broker:queue-template:update', () => {
  let context: TestContext

  beforeEach(() => {
    context = setupTestContext({}, ['patch'])
    context.mockConnection.patch!.resolves(
      buildSimpleResponse({
        data: {
          msgVpnName: 'default',
          queueTemplateName: 'testTemplate',
        },
      }),
    )
  })

  afterEach(() => {
    context.cleanup()
  })

  describe('SEMP API Calls', () => {
    beforeEach(() => {
      stubCommandMethod(context.sandbox, BrokerQueueTemplateUpdate, 'getBrokerAuthManager', context.mockBrokerAuthManager)
    })

    it('should call correct SEMP endpoint with queue template name', async () => {
      await BrokerQueueTemplateUpdate.run([
        '--broker-name=test-broker',
        '--msg-vpn-name=default',
        '--name=testTemplate',
        '--permission=consume',
      ])

      expect(context.mockConnection.patch!.calledWith('/SEMP/v2/config/msgVpns/default/queueTemplates/testTemplate')).to
        .be.true
    })

    it('should use PATCH method not POST', async () => {
      await BrokerQueueTemplateUpdate.run([
        '--broker-name=test-broker',
        '--msg-vpn-name=default',
        '--name=testTemplate',
        '--permission=consume',
      ])

      expect(context.mockConnection.patch!.called).to.be.true
      expect(context.mockConnection.patch!.callCount).to.equal(1)
    })
  })

  describe('Flag Mapping', () => {
    beforeEach(() => {
      stubCommandMethod(context.sandbox, BrokerQueueTemplateUpdate, 'getBrokerAuthManager', context.mockBrokerAuthManager)
    })

    it('should map all flags correctly to SEMP request body', async () => {
      await BrokerQueueTemplateUpdate.run([
        '--broker-name=test-broker',
        '--msg-vpn-name=default',
        '--name=testTemplate',
        '--access-type=non-exclusive',
        '--dead-msg-queue=#DEAD_MSG_QUEUE',
        '--durability-override=durable',
        '--max-bind-count=5',
        '--max-delivered-unacked-msgs-per-flow=100',
        '--max-msg-size=1000000',
        '--max-msg-spool-usage=1024',
        '--max-redelivery-count=3',
        '--max-ttl=3600',
        '--permission=delete',
        '--queue-name-filter=order.*',
      ])

      const patchCall = context.mockConnection.patch!.getCall(0)
      const requestBody = patchCall.args[1]

      expect(requestBody).to.deep.equal({
        accessType: 'non-exclusive',
        deadMsgQueue: '#DEAD_MSG_QUEUE',
        durabilityOverride: 'durable',
        maxBindCount: 5,
        maxDeliveredUnackedMsgsPerFlow: 100,
        maxMsgSize: 1_000_000,
        maxMsgSpoolUsage: 1024,
        maxRedeliveryCount: 3,
        maxTtl: 3600,
        permission: 'delete',
        queueNameFilter: 'order.*',
      })
    })

    it('should NOT include queueTemplateName in request body', async () => {
      await BrokerQueueTemplateUpdate.run([
        '--broker-name=test-broker',
        '--msg-vpn-name=default',
        '--name=testTemplate',
        '--permission=consume',
      ])

      const patchCall = context.mockConnection.patch!.getCall(0)
      const requestBody = patchCall.args[1]

      expect(requestBody).to.not.have.property('queueTemplateName')
    })

    it('should map --queue-name-filter to queueNameFilter (not the template name)', async () => {
      await BrokerQueueTemplateUpdate.run([
        '--broker-name=test-broker',
        '--msg-vpn-name=default',
        '--name=testTemplate',
        '--queue-name-filter=invoice.*',
      ])

      const patchCall = context.mockConnection.patch!.getCall(0)
      const requestBody = patchCall.args[1]

      expect(requestBody).to.deep.equal({
        queueNameFilter: 'invoice.*',
      })
    })
  })

  describe('Partial Updates', () => {
    beforeEach(() => {
      stubCommandMethod(context.sandbox, BrokerQueueTemplateUpdate, 'getBrokerAuthManager', context.mockBrokerAuthManager)
    })

    it('should send minimal request with only one flag', async () => {
      await BrokerQueueTemplateUpdate.run([
        '--broker-name=test-broker',
        '--msg-vpn-name=default',
        '--name=testTemplate',
        '--max-msg-spool-usage=2048',
      ])

      const patchCall = context.mockConnection.patch!.getCall(0)
      const requestBody = patchCall.args[1]

      expect(requestBody).to.deep.equal({
        maxMsgSpoolUsage: 2048,
      })
    })

    it('should allow updating only permission', async () => {
      await BrokerQueueTemplateUpdate.run([
        '--broker-name=test-broker',
        '--msg-vpn-name=default',
        '--name=testTemplate',
        '--permission=read-only',
      ])

      const patchCall = context.mockConnection.patch!.getCall(0)
      const requestBody = patchCall.args[1]

      expect(requestBody).to.deep.equal({
        permission: 'read-only',
      })
    })

    it('should send an empty request body when no updatable flags are provided', async () => {
      await BrokerQueueTemplateUpdate.run([
        '--broker-name=test-broker',
        '--msg-vpn-name=default',
        '--name=testTemplate',
      ])

      const patchCall = context.mockConnection.patch!.getCall(0)
      const requestBody = patchCall.args[1]

      expect(requestBody).to.deep.equal({})
    })
  })

  describe('Response Display', () => {
    beforeEach(() => {
      stubCommandMethod(context.sandbox, BrokerQueueTemplateUpdate, 'getBrokerAuthManager', context.mockBrokerAuthManager)
      context.sandbox.stub(BrokerQueueTemplateUpdate.prototype, 'log')
    })

    it('should display success message with queue template details', async () => {
      const mockResponse: MsgVpnQueueTemplateUpdateResponse = {
        data: {
          msgVpnName: 'default',
          queueTemplateName: 'testTemplate',
        },
        meta: {
          request: {method: 'PATCH', uri: '/config/msgVpns/default/queueTemplates/testTemplate'},
          responseCode: 200,
        },
      }

      context.mockConnection.patch!.resolves(mockResponse)

      await BrokerQueueTemplateUpdate.run([
        '--broker-name=test-broker',
        '--msg-vpn-name=default',
        '--name=testTemplate',
        '--permission=consume',
      ])

      const logStub = BrokerQueueTemplateUpdate.prototype.log as SinonStub
      expect(logStub.called).to.be.true
    })

    it('should return MsgVpnQueueTemplateUpdateResponse', async () => {
      const mockResponse: MsgVpnQueueTemplateUpdateResponse = {
        data: {
          msgVpnName: 'default',
          queueTemplateName: 'testTemplate',
        },
        meta: {
          responseCode: 200,
        },
      }

      context.mockConnection.patch!.resolves(mockResponse)

      const result = await BrokerQueueTemplateUpdate.run([
        '--broker-name=test-broker',
        '--msg-vpn-name=default',
        '--name=testTemplate',
        '--max-msg-spool-usage=2048',
      ])

      expect(result).to.deep.equal(mockResponse)
    })
  })
})
