import BrokerAclProfileClientConnectExceptionsDelete from '../../../../../src/commands/broker/acl-profile/client-connect-exceptions/delete.js'
import {
  buildDeleteResponse,
  expect,
  setupTestContext,
  stubCommandMethod,
  type TestContext,
} from '../../../../helpers/index.js'

describe('broker:acl-profile:client-connect-exceptions:delete', () => {
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
        BrokerAclProfileClientConnectExceptionsDelete,
        'getBrokerAuthManager',
        context.mockBrokerAuthManager,
      )
    })

    it('should call correct SEMP endpoint with URL-encoded address', async () => {
      await BrokerAclProfileClientConnectExceptionsDelete.run([
        '--broker-name=test-broker',
        '--acl-profile-name=testProfile',
        '--msg-vpn-name=default',
        '--client-connect-exception-address=192.168.1.0/24',
        '--no-prompt',
      ])

      const expectedEndpoint =
        '/SEMP/v2/config/msgVpns/default/aclProfiles/testProfile/clientConnectExceptions/192.168.1.0%2F24'
      expect(context.mockConnection.delete!.calledWith(expectedEndpoint)).to.be.true
    })
  })
})
