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
    getDefaultBroker: SinonStub
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
      getDefaultBroker: stub().resolves(null),
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

  describe('Solace Cloud broker - auto msg-vpn-name resolution', () => {
    beforeEach(() => {
      // Setup Solace Cloud broker with msgVpnName
      const cloudBroker: BrokerAuth = {
        accessToken: 'dGVzdDp0ZXN0',
        authType: AuthType.BASIC,
        isSolaceCloud: true,
        msgVpnName: 'cloud-vpn',
        name: 'cloud-broker',
        sempEndpoint: 'https://cloud.solace.com',
        sempPort: 943,
      }

      mockBrokerAuthManager.getBroker.resolves(cloudBroker)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub(BrokerQueueCreate.prototype as any, 'getBrokerAuthManager').resolves(mockBrokerAuthManager)
      stub(BrokerQueueCreate.prototype, 'log')
    })

    afterEach(() => {
      restore()
    })

    it('should use msgVpnName from BrokerAuth when msg-vpn-name flag not provided', async () => {
      await BrokerQueueCreate.run(['--broker-name=cloud-broker', '--queue-name=testQueue'])

      expect(mockConnection.post.calledWith('/SEMP/v2/config/msgVpns/cloud-vpn/queues')).to.be.true
    })

    it('should allow flag override for cloud brokers', async () => {
      await BrokerQueueCreate.run([
        '--broker-name=cloud-broker',
        '--queue-name=testQueue',
        '--msg-vpn-name=override-vpn',
      ])

      expect(mockConnection.post.calledWith('/SEMP/v2/config/msgVpns/override-vpn/queues')).to.be.true
    })
  })

  describe('Default broker support', () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub(BrokerQueueCreate.prototype as any, 'getBrokerAuthManager').resolves(mockBrokerAuthManager)
      stub(BrokerQueueCreate.prototype, 'log')
    })

    afterEach(() => {
      restore()
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
      mockBrokerAuthManager.getDefaultBroker.resolves(defaultBroker)
      mockBrokerAuthManager.getBroker.resolves(defaultBroker)

      await BrokerQueueCreate.run(['--queue-name=testQueue', '--msg-vpn-name=default'])

      expect(mockBrokerAuthManager.getDefaultBroker.called).to.be.true
      expect(mockBrokerAuthManager.createConnection.calledWith('default-broker')).to.be.true
    })

    it('should use default cloud broker and auto-resolve msg-vpn-name', async () => {
      const defaultCloudBroker: BrokerAuth = {
        accessToken: 'ZGVmYXVsdDpkZWZhdWx0',
        authType: AuthType.BASIC,
        isDefault: true,
        isSolaceCloud: true,
        msgVpnName: 'default-cloud-vpn',
        name: 'default-cloud-broker',
        sempEndpoint: 'https://default.solace.com',
        sempPort: 943,
      }
      mockBrokerAuthManager.getDefaultBroker.resolves(defaultCloudBroker)
      mockBrokerAuthManager.getBroker.resolves(defaultCloudBroker)

      await BrokerQueueCreate.run(['--queue-name=testQueue'])

      expect(mockBrokerAuthManager.getDefaultBroker.called).to.be.true
      expect(mockConnection.post.calledWith('/SEMP/v2/config/msgVpns/default-cloud-vpn/queues')).to.be.true
    })
  })

  describe('Error cases for msg-vpn-name requirement', () => {
    beforeEach(() => {
      // Setup non-cloud broker
      const basicBroker: BrokerAuth = {
        accessToken: 'dGVzdDp0ZXN0',
        authType: AuthType.BASIC,
        name: 'basic-broker',
        sempEndpoint: 'https://localhost',
        sempPort: 8080,
      }

      mockBrokerAuthManager.getBroker.resolves(basicBroker)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub(BrokerQueueCreate.prototype as any, 'getBrokerAuthManager').resolves(mockBrokerAuthManager)
    })

    afterEach(() => {
      restore()
    })

    it('should error when msg-vpn-name not provided for non-cloud broker', async () => {
      try {
        await BrokerQueueCreate.run(['--broker-name=basic-broker', '--queue-name=testQueue'])
        expect.fail('Should have thrown an error')
      } catch (error: unknown) {
        expect((error as Error).message).to.match(/msg-vpn-name.*required.*not using.*solace cloud/i)
      }
    })
  })
})
