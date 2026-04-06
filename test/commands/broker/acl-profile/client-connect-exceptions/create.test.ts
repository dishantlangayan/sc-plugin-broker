import BrokerAclProfileClientConnectExceptionsCreate from '../../../../../src/commands/broker/acl-profile/client-connect-exceptions/create.js'
import {
  buildSimpleResponse,
  expect,
  setupTestContext,
  stubCommandMethod,
  type TestContext,
} from '../../../../helpers/index.js'

describe('broker:acl-profile:client-connect-exceptions:create', () => {
  let context: TestContext

  beforeEach(() => {
    context = setupTestContext({}, ['post'])
    context.mockConnection.post!.resolves(
      buildSimpleResponse({
        data: {
          aclProfileName: 'testProfile',
          clientConnectExceptionAddress: '192.168.1.0/24',
          msgVpnName: 'default',
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
        BrokerAclProfileClientConnectExceptionsCreate,
        'getBrokerAuthManager',
        context.mockBrokerAuthManager,
      )
    })

    it('should call correct SEMP endpoint', async () => {
      await BrokerAclProfileClientConnectExceptionsCreate.run([
        '--broker-name=test-broker',
        '--acl-profile-name=testProfile',
        '--msg-vpn-name=default',
        '--client-connect-exception-address=192.168.1.0/24',
      ])

      expect(
        context.mockConnection.post!.calledWith(
          '/SEMP/v2/config/msgVpns/default/aclProfiles/testProfile/clientConnectExceptions',
        ),
      ).to.be.true
    })

    it('should map flags to SEMP request body', async () => {
      await BrokerAclProfileClientConnectExceptionsCreate.run([
        '--broker-name=test-broker',
        '--acl-profile-name=testProfile',
        '--msg-vpn-name=default',
        '--client-connect-exception-address=10.0.0.0/8',
      ])

      const postCall = context.mockConnection.post!.getCall(0)
      const requestBody = postCall.args[1]

      expect(requestBody).to.deep.equal({
        clientConnectExceptionAddress: '10.0.0.0/8',
      })
    })
  })
})
