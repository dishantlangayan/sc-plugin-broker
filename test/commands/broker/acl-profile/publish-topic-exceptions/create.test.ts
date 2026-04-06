import BrokerAclProfilePublishTopicExceptionsCreate from '../../../../../src/commands/broker/acl-profile/publish-topic-exceptions/create.js'
import {
  buildSimpleResponse,
  expect,
  setupTestContext,
  stubCommandMethod,
  type TestContext,
} from '../../../../helpers/index.js'

describe('broker:acl-profile:publish-topic-exceptions:create', () => {
  let context: TestContext

  beforeEach(() => {
    context = setupTestContext({}, ['post'])
    context.mockConnection.post!.resolves(
      buildSimpleResponse({
        data: {
          aclProfileName: 'testProfile',
          msgVpnName: 'default',
          publishTopicException: 'orders/*/created',
          publishTopicExceptionSyntax: 'smf',
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
        BrokerAclProfilePublishTopicExceptionsCreate,
        'getBrokerAuthManager',
        context.mockBrokerAuthManager,
      )
    })

    it('should call correct SEMP endpoint', async () => {
      await BrokerAclProfilePublishTopicExceptionsCreate.run([
        '--broker-name=test-broker',
        '--acl-profile-name=testProfile',
        '--msg-vpn-name=default',
        '--publish-topic-exception=orders/*/created',
        '--syntax=smf',
      ])

      expect(
        context.mockConnection.post!.calledWith(
          '/SEMP/v2/config/msgVpns/default/aclProfiles/testProfile/publishTopicExceptions',
        ),
      ).to.be.true
    })

    it('should map flags to SEMP request body', async () => {
      await BrokerAclProfilePublishTopicExceptionsCreate.run([
        '--broker-name=test-broker',
        '--acl-profile-name=testProfile',
        '--msg-vpn-name=default',
        '--publish-topic-exception=devices/+/telemetry',
        '--syntax=mqtt',
      ])

      const postCall = context.mockConnection.post!.getCall(0)
      const requestBody = postCall.args[1]

      expect(requestBody).to.deep.equal({
        publishTopicException: 'devices/+/telemetry',
        publishTopicExceptionSyntax: 'mqtt',
      })
    })
  })
})
