import BrokerMsgVpnCreate from '../../../../src/commands/broker/msg-vpn/create.js'
import {MsgVpnCreateResponse} from '../../../../src/types/msgvpn.js'
import {
  buildSimpleResponse,
  createMockCloudBroker,
  expect,
  setupTestContext,
  stubCommandMethod,
  type TestContext,
} from '../../../helpers/index.js'

describe('broker:msg-vpn:create', () => {
  let context: TestContext

  beforeEach(() => {
    context = setupTestContext({}, ['post'])
    context.mockConnection.post!.resolves(
      buildSimpleResponse({
        data: {
          msgVpnName: 'testVpn',
        },
      }),
    )
  })

  afterEach(() => {
    context.cleanup()
  })

  describe('SEMP API Calls', () => {
    beforeEach(() => {
      stubCommandMethod(context.sandbox, BrokerMsgVpnCreate, 'getBrokerAuthManager', context.mockBrokerAuthManager)
      context.sandbox.stub(BrokerMsgVpnCreate.prototype, 'log')
    })

    it('should call correct SEMP endpoint', async () => {
      await BrokerMsgVpnCreate.run(['--broker-name=test-broker', '--name=testVpn'])

      expect(context.mockConnection.post!.calledWith('/SEMP/v2/config/msgVpns')).to.be.true
    })

    it('should map all flags correctly to SEMP request body', async () => {
      await BrokerMsgVpnCreate.run([
        '--broker-name=test-broker',
        '--name=advancedVpn',
        '--enabled',
        '--authentication-basic-enabled',
        '--authentication-basic-type=internal',
        '--event-large-msg-threshold=2048',
        '--max-connection-count=100',
        '--max-egress-flow-count=50',
        '--max-endpoint-count=200',
        '--max-ingress-flow-count=50',
        '--max-msg-spool-usage=1024',
        '--max-subscription-count=500',
        '--max-transacted-session-count=10',
        '--max-transaction-count=20',
      ])

      const postCall = context.mockConnection.post!.getCall(0)
      const requestBody = postCall.args[1]

      expect(requestBody).to.deep.equal({
        authenticationBasicEnabled: true,
        authenticationBasicType: 'internal',
        enabled: true,
        eventLargeMsgThreshold: 2048,
        maxConnectionCount: 100,
        maxEgressFlowCount: 50,
        maxEndpointCount: 200,
        maxIngressFlowCount: 50,
        maxMsgSpoolUsage: 1024,
        maxSubscriptionCount: 500,
        maxTransactedSessionCount: 10,
        maxTransactionCount: 20,
        msgVpnName: 'advancedVpn',
      })
    })

    it('should send minimal request with required flags and enabled default', async () => {
      await BrokerMsgVpnCreate.run(['--broker-name=test-broker', '--name=minimalVpn'])

      const postCall = context.mockConnection.post!.getCall(0)
      const requestBody = postCall.args[1]

      expect(requestBody).to.deep.equal({
        enabled: true, // enabled defaults to true
        msgVpnName: 'minimalVpn',
      })
    })

    it('should send disabled state when --no-enabled is used', async () => {
      await BrokerMsgVpnCreate.run([
        '--broker-name=test-broker',
        '--name=testVpn',
        '--no-enabled',
      ])

      const postCall = context.mockConnection.post!.getCall(0)
      expect(postCall.args[1]).to.have.property('enabled', false)
    })
  })

  describe('Response Display', () => {
    beforeEach(() => {
      stubCommandMethod(context.sandbox, BrokerMsgVpnCreate, 'getBrokerAuthManager', context.mockBrokerAuthManager)
      context.sandbox.stub(BrokerMsgVpnCreate.prototype, 'log')
    })

    it('should return MsgVpnCreateResponse', async () => {
      const mockResponse: MsgVpnCreateResponse = {
        data: {
          msgVpnName: 'testVpn',
        },
        meta: {
          responseCode: 200,
        },
      }

      context.mockConnection.post!.resolves(mockResponse)

      const result = await BrokerMsgVpnCreate.run([
        '--broker-name=test-broker',
        '--name=testVpn',
      ])

      expect(result).to.deep.equal(mockResponse)
    })
  })

  describe('Solace Cloud broker restriction', () => {
    beforeEach(() => {
      const cloudBroker = createMockCloudBroker({
        msgVpnName: 'cloud-vpn',
        name: 'cloud-broker',
      })

      context.mockBrokerAuthManager.getBroker.resolves(cloudBroker)
      stubCommandMethod(context.sandbox, BrokerMsgVpnCreate, 'getBrokerAuthManager', context.mockBrokerAuthManager)
      context.sandbox.stub(BrokerMsgVpnCreate.prototype, 'log')
    })

    it('should error and not call the API when broker is a Solace Cloud broker', async () => {
      try {
        await BrokerMsgVpnCreate.run(['--broker-name=cloud-broker', '--name=newVpn'])
        expect.fail('Should have thrown an error')
      } catch (error) {
        expect((error as Error).message).to.match(/cannot be created on a Solace Cloud broker/i)
      }

      expect(context.mockConnection.post!.called).to.be.false
    })
  })
})
