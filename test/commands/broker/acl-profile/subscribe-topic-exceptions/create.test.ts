import BrokerAclProfileSubscribeTopicExceptionsCreate from '../../../../../src/commands/broker/acl-profile/subscribe-topic-exceptions/create.js'
import {
  buildSimpleResponse,
  expect,
  setupTestContext,
  stubCommandMethod,
  type TestContext,
} from '../../../../helpers/index.js'

describe('broker:acl-profile:subscribe-topic-exceptions:create', () => {
  let context: TestContext

  beforeEach(() => {
    context = setupTestContext({}, ['post'])
    context.mockConnection.post!.resolves(
      buildSimpleResponse({
        data: {
          aclProfileName: 'testProfile',
          msgVpnName: 'default',
          subscribeTopicException: 'orders/*/created',
          subscribeTopicExceptionSyntax: 'smf',
        },
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
        BrokerAclProfileSubscribeTopicExceptionsCreate,
        'getBrokerAuthManager',
        context.mockBrokerAuthManager,
      )
    })

    it('should call correct SEMP endpoint', async () => {
      await BrokerAclProfileSubscribeTopicExceptionsCreate.run([
        '--broker-name=test-broker',
        '--acl-profile-name=testProfile',
        '--msg-vpn-name=default',
        '--subscribe-topic-exception=orders/*/created',
        '--syntax=smf',
      ])

      expect(
        context.mockConnection.post!.calledWith(
          '/SEMP/v2/config/msgVpns/default/aclProfiles/testProfile/subscribeTopicExceptions',
        ),
      ).to.be.true
    })

    it('should map flags to SEMP request body', async () => {
      await BrokerAclProfileSubscribeTopicExceptionsCreate.run([
        '--broker-name=test-broker',
        '--acl-profile-name=testProfile',
        '--msg-vpn-name=default',
        '--subscribe-topic-exception=devices/+/telemetry',
        '--syntax=mqtt',
      ])

      const postCall = context.mockConnection.post!.getCall(0)
      const requestBody = postCall.args[1]

      expect(requestBody).to.deep.equal({
        subscribeTopicException: 'devices/+/telemetry',
        subscribeTopicExceptionSyntax: 'mqtt',
      })
    })
  })
})
