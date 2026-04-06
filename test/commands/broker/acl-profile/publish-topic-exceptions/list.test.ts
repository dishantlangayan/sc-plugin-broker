import BrokerAclProfilePublishTopicExceptionsList from '../../../../../src/commands/broker/acl-profile/publish-topic-exceptions/list.js'
import {
  buildSimpleResponse,
  expect,
  setupTestContext,
  stubCommandMethod,
  type TestContext,
} from '../../../../helpers/index.js'

describe('broker:acl-profile:publish-topic-exceptions:list', () => {
  let context: TestContext

  beforeEach(() => {
    context = setupTestContext({}, ['get'])
    context.mockConnection.get!.resolves(
      buildSimpleResponse({
        data: [
          {
            publishTopicException: 'orders/*/created',
            publishTopicExceptionSyntax: 'smf',
          },
          {
            publishTopicException: 'devices/+/telemetry',
            publishTopicExceptionSyntax: 'mqtt',
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
        BrokerAclProfilePublishTopicExceptionsList,
        'getBrokerAuthManager',
        context.mockBrokerAuthManager,
      )
      context.sandbox.stub(BrokerAclProfilePublishTopicExceptionsList.prototype, 'log')
    })

    it('should call correct SEMP endpoint', async () => {
      await BrokerAclProfilePublishTopicExceptionsList.run([
        '--broker-name=test-broker',
        '--acl-profile-name=testProfile',
        '--msg-vpn-name=default',
      ])

      expect(
        context.mockConnection.get!.calledWith(
          '/SEMP/v2/monitor/msgVpns/default/aclProfiles/testProfile/publishTopicExceptions',
        ),
      ).to.be.true
    })
  })
})
