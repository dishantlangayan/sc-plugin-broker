import BrokerAclProfileSubscribeShareNameExceptionsDelete from '../../../../../src/commands/broker/acl-profile/subscribe-share-name-exceptions/delete.js'
import {
  buildDeleteResponse,
  expect,
  setupTestContext,
  stubCommandMethod,
  type TestContext,
} from '../../../../helpers/index.js'

describe('broker:acl-profile:subscribe-share-name-exceptions:delete', () => {
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
        BrokerAclProfileSubscribeShareNameExceptionsDelete,
        'getBrokerAuthManager',
        context.mockBrokerAuthManager,
      )
    })

    it('should call correct SEMP endpoint with composite key URL-encoded', async () => {
      await BrokerAclProfileSubscribeShareNameExceptionsDelete.run([
        '--broker-name=test-broker',
        '--acl-profile-name=testProfile',
        '--msg-vpn-name=default',
        '--subscribe-share-name-exception=orders/*',
        '--syntax=smf',
        '--no-prompt',
      ])

      const expectedEndpoint =
        '/SEMP/v2/config/msgVpns/default/aclProfiles/testProfile/subscribeShareNameExceptions/smf,orders%2F*'
      expect(context.mockConnection.delete!.calledWith(expectedEndpoint)).to.be.true
    })
  })
})
