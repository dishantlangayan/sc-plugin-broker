import BrokerAclProfilePublishTopicExceptionsDelete from '../../../../../src/commands/broker/acl-profile/publish-topic-exceptions/delete.js'
import {
  buildDeleteResponse,
  expect,
  setupTestContext,
  stubCommandMethod,
  type TestContext,
} from '../../../../helpers/index.js'

describe('broker:acl-profile:publish-topic-exceptions:delete', () => {
  let context: TestContext

  beforeEach(() => {
    context = setupTestContext({}, ['delete'])
    context.mockConnection.delete!.resolves(buildDeleteResponse())
  })

  afterEach(() => {
    context.cleanup()
  })

  describe('SEMP API Calls', () => {
    beforeEach(() => {
      stubCommandMethod(
        context.sandbox,
        BrokerAclProfilePublishTopicExceptionsDelete,
        'getBrokerAuthManager',
        context.mockBrokerAuthManager,
      )
    })

    it('should call correct SEMP endpoint with composite key URL-encoded', async () => {
      await BrokerAclProfilePublishTopicExceptionsDelete.run([
        '--broker-name=test-broker',
        '--acl-profile-name=testProfile',
        '--msg-vpn-name=default',
        '--publish-topic-exception=orders/*/created',
        '--syntax=smf',
        '--no-prompt',
      ])

      const expectedEndpoint =
        '/SEMP/v2/config/msgVpns/default/aclProfiles/testProfile/publishTopicExceptions/smf,orders%2F*%2Fcreated'
      expect(context.mockConnection.delete!.calledWith(expectedEndpoint)).to.be.true
    })
  })
})
