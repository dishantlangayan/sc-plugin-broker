import BrokerAclProfileSubscribeTopicExceptionsList from '../../../../../src/commands/broker/acl-profile/subscribe-topic-exceptions/list.js'
import {
  buildSimpleResponse,
  expect,
  setupTestContext,
  stubCommandMethod,
  type TestContext,
} from '../../../../helpers/index.js'

describe('broker:acl-profile:subscribe-topic-exceptions:list', () => {
  let context: TestContext

  beforeEach(() => {
    context = setupTestContext({}, ['get'])
    context.mockConnection.get!.resolves(
      buildSimpleResponse({
        data: [
          {
            subscribeTopicException: 'orders/*/created',
            subscribeTopicExceptionSyntax: 'smf',
          },
          {
            subscribeTopicException: 'devices/+/telemetry',
            subscribeTopicExceptionSyntax: 'mqtt',
          },
        ],
      }),
    )
  })

  afterEach(() => {
    context.cleanup()
  })

  describe('SEMP API Calls', () => {
    beforeEach(() => {
      stubCommandMethod(
        context.sandbox,
        BrokerAclProfileSubscribeTopicExceptionsList,
        'getBrokerAuthManager',
        context.mockBrokerAuthManager,
      )
      context.sandbox.stub(BrokerAclProfileSubscribeTopicExceptionsList.prototype, 'log')
    })

    it('should call correct SEMP endpoint', async () => {
      await BrokerAclProfileSubscribeTopicExceptionsList.run([
        '--broker-name=test-broker',
        '--acl-profile-name=testProfile',
        '--msg-vpn-name=default',
      ])

      expect(
        context.mockConnection.get!.calledWith(
          '/SEMP/v2/monitor/msgVpns/default/aclProfiles/testProfile/subscribeTopicExceptions',
        ),
      ).to.be.true
    })
  })
})
