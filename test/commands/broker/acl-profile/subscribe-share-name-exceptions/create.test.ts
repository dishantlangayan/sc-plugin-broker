import BrokerAclProfileSubscribeShareNameExceptionsCreate from '../../../../../src/commands/broker/acl-profile/subscribe-share-name-exceptions/create.js'
import {
  buildSimpleResponse,
  expect,
  setupTestContext,
  stubCommandMethod,
  type TestContext,
} from '../../../../helpers/index.js'

describe('broker:acl-profile:subscribe-share-name-exceptions:create', () => {
  let context: TestContext

  beforeEach(() => {
    context = setupTestContext({}, ['post'])
    context.mockConnection.post!.resolves(
      buildSimpleResponse({
        data: {
          aclProfileName: 'testProfile',
          msgVpnName: 'default',
          subscribeShareNameException: 'orders/*',
          subscribeShareNameExceptionSyntax: 'smf',
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
        BrokerAclProfileSubscribeShareNameExceptionsCreate,
        'getBrokerAuthManager',
        context.mockBrokerAuthManager,
      )
    })

    it('should call correct SEMP endpoint', async () => {
      await BrokerAclProfileSubscribeShareNameExceptionsCreate.run([
        '--broker-name=test-broker',
        '--acl-profile-name=testProfile',
        '--msg-vpn-name=default',
        '--subscribe-share-name-exception=orders/*',
        '--syntax=smf',
      ])

      expect(
        context.mockConnection.post!.calledWith(
          '/SEMP/v2/config/msgVpns/default/aclProfiles/testProfile/subscribeShareNameExceptions',
        ),
      ).to.be.true
    })

    it('should map flags to SEMP request body', async () => {
      await BrokerAclProfileSubscribeShareNameExceptionsCreate.run([
        '--broker-name=test-broker',
        '--acl-profile-name=testProfile',
        '--msg-vpn-name=default',
        '--subscribe-share-name-exception=devices/+',
        '--syntax=mqtt',
      ])

      const postCall = context.mockConnection.post!.getCall(0)
      const requestBody = postCall.args[1]

      expect(requestBody).to.deep.equal({
        subscribeShareNameException: 'devices/+',
        subscribeShareNameExceptionSyntax: 'mqtt',
      })
    })
  })
})
