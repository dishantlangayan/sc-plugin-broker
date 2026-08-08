import {AuthType, type BrokerAuth} from '@dishantlangayan/sc-cli-core'

import BrokerQueueTemplateCreate from '../../../../src/commands/broker/queue-template/create.js'
import {MsgVpnQueueTemplateCreateResponse} from '../../../../src/types/msgvpn-queue-template.js'
import {
  buildSimpleResponse,
  createMockCloudBroker,
  expect,
  setupTestContext,
  type SinonStub,
  stubCommandMethod,
  type TestContext,
} from '../../../helpers/index.js'

describe('broker:queue-template:create', () => {
  let context: TestContext

  beforeEach(() => {
    context = setupTestContext({}, ['post'])
    context.mockConnection.post!.resolves(
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
      stubCommandMethod(context.sandbox, BrokerQueueTemplateCreate, 'getBrokerAuthManager', context.mockBrokerAuthManager)
    })

    it('should call correct SEMP endpoint', async () => {
      await BrokerQueueTemplateCreate.run([
        '--broker-name=test-broker',
        '--name=testTemplate',
        '--msg-vpn-name=default',
      ])

      expect(context.mockConnection.post!.calledWith('/SEMP/v2/config/msgVpns/default/queueTemplates')).to.be.true
    })

    it('should map all flags correctly to SEMP request body', async () => {
      await BrokerQueueTemplateCreate.run([
        '--broker-name=test-broker',
        '--name=advancedTemplate',
        '--msg-vpn-name=default',
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

      const postCall = context.mockConnection.post!.getCall(0)
      const requestBody = postCall.args[1]

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
        queueTemplateName: 'advancedTemplate',
      })
    })

    it('should send minimal request with only the required name flag', async () => {
      await BrokerQueueTemplateCreate.run([
        '--broker-name=test-broker',
        '--name=minimalTemplate',
        '--msg-vpn-name=default',
      ])

      const postCall = context.mockConnection.post!.getCall(0)
      const requestBody = postCall.args[1]

      expect(requestBody).to.deep.equal({
        queueTemplateName: 'minimalTemplate',
      })
    })

    it('should include integer flags when set to 0', async () => {
      await BrokerQueueTemplateCreate.run([
        '--broker-name=test-broker',
        '--name=zeroTemplate',
        '--msg-vpn-name=default',
        '--max-msg-spool-usage=0',
      ])

      const postCall = context.mockConnection.post!.getCall(0)
      const requestBody = postCall.args[1]

      expect(requestBody).to.deep.equal({
        maxMsgSpoolUsage: 0,
        queueTemplateName: 'zeroTemplate',
      })
    })
  })

  describe('Response Display', () => {
    beforeEach(() => {
      stubCommandMethod(context.sandbox, BrokerQueueTemplateCreate, 'getBrokerAuthManager', context.mockBrokerAuthManager)
      context.sandbox.stub(BrokerQueueTemplateCreate.prototype, 'log')
    })

    it('should display success message with queue template details', async () => {
      const mockResponse: MsgVpnQueueTemplateCreateResponse = {
        data: {
          msgVpnName: 'default',
          queueTemplateName: 'testTemplate',
        },
        meta: {
          request: {method: 'POST', uri: '/config/msgVpns/default/queueTemplates'},
          responseCode: 200,
        },
      }

      context.mockConnection.post!.resolves(mockResponse)

      await BrokerQueueTemplateCreate.run([
        '--broker-name=test-broker',
        '--name=testTemplate',
        '--msg-vpn-name=default',
      ])

      const logStub = BrokerQueueTemplateCreate.prototype.log as SinonStub
      expect(logStub.called).to.be.true
    })

    it('should return MsgVpnQueueTemplateCreateResponse', async () => {
      const mockResponse: MsgVpnQueueTemplateCreateResponse = {
        data: {
          msgVpnName: 'default',
          queueTemplateName: 'testTemplate',
        },
        meta: {
          responseCode: 200,
        },
      }

      context.mockConnection.post!.resolves(mockResponse)

      const result = await BrokerQueueTemplateCreate.run([
        '--broker-name=test-broker',
        '--name=testTemplate',
        '--msg-vpn-name=default',
      ])

      expect(result).to.deep.equal(mockResponse)
    })
  })

  describe('Solace Cloud broker - auto msg-vpn-name resolution', () => {
    beforeEach(() => {
      const cloudBroker = createMockCloudBroker({
        msgVpnName: 'cloud-vpn',
        name: 'cloud-broker',
        sempEndpoint: 'https://cloud.solace.com',
        sempPort: 943,
      })

      context.mockBrokerAuthManager.getBroker.resolves(cloudBroker)
      stubCommandMethod(context.sandbox, BrokerQueueTemplateCreate, 'getBrokerAuthManager', context.mockBrokerAuthManager)
      context.sandbox.stub(BrokerQueueTemplateCreate.prototype, 'log')
    })

    it('should use msgVpnName from BrokerAuth when msg-vpn-name flag not provided', async () => {
      await BrokerQueueTemplateCreate.run(['--broker-name=cloud-broker', '--name=testTemplate'])

      expect(context.mockConnection.post!.calledWith('/SEMP/v2/config/msgVpns/cloud-vpn/queueTemplates')).to.be.true
    })

    it('should allow flag override for cloud brokers', async () => {
      await BrokerQueueTemplateCreate.run([
        '--broker-name=cloud-broker',
        '--name=testTemplate',
        '--msg-vpn-name=override-vpn',
      ])

      expect(context.mockConnection.post!.calledWith('/SEMP/v2/config/msgVpns/override-vpn/queueTemplates')).to.be.true
    })
  })

  describe('Default broker support', () => {
    beforeEach(() => {
      stubCommandMethod(context.sandbox, BrokerQueueTemplateCreate, 'getBrokerAuthManager', context.mockBrokerAuthManager)
      context.sandbox.stub(BrokerQueueTemplateCreate.prototype, 'log')
    })

    it('should use default broker when broker-name and broker-id not provided', async () => {
      const defaultBroker: BrokerAuth = {
        accessToken: 'ZGVmYXVsdDpkZWZhdWx0',
        authType: AuthType.BASIC,
        isDefault: true,
        name: 'default-broker',
        sempEndpoint: 'https://default',
        sempPort: 8080,
      }
      context.mockBrokerAuthManager.getDefaultBroker.resolves(defaultBroker)
      context.mockBrokerAuthManager.getBroker.resolves(defaultBroker)

      await BrokerQueueTemplateCreate.run(['--name=testTemplate', '--msg-vpn-name=default'])

      expect(context.mockBrokerAuthManager.getDefaultBroker.called).to.be.true
      expect(context.mockBrokerAuthManager.createConnection.calledWith('default-broker')).to.be.true
    })
  })

  describe('Error cases for msg-vpn-name requirement', () => {
    beforeEach(() => {
      const basicBroker: BrokerAuth = {
        accessToken: 'dGVzdDp0ZXN0',
        authType: AuthType.BASIC,
        name: 'basic-broker',
        sempEndpoint: 'https://localhost',
        sempPort: 8080,
      }

      context.mockBrokerAuthManager.getBroker.resolves(basicBroker)
      stubCommandMethod(context.sandbox, BrokerQueueTemplateCreate, 'getBrokerAuthManager', context.mockBrokerAuthManager)
    })

    it('should error when msg-vpn-name not provided for non-cloud broker', async () => {
      try {
        await BrokerQueueTemplateCreate.run(['--broker-name=basic-broker', '--name=testTemplate'])
        expect.fail('Should have thrown an error')
      } catch (error: unknown) {
        expect((error as Error).message).to.match(/msg-vpn-name.*required.*no default message vpn/i)
      }
    })
  })
})
