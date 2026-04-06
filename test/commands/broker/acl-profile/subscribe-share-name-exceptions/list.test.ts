import BrokerAclProfileSubscribeShareNameExceptionsList from '../../../../../src/commands/broker/acl-profile/subscribe-share-name-exceptions/list.js'
import {
  buildSimpleResponse,
  expect,
  setupTestContext,
  stubCommandMethod,
  type TestContext,
} from '../../../../helpers/index.js'

describe('broker:acl-profile:subscribe-share-name-exceptions:list', () => {
  let context: TestContext

  beforeEach(() => {
    context = setupTestContext({}, ['get'])
    context.mockConnection.get!.resolves(
      buildSimpleResponse({
        data: [
          {
            subscribeShareNameException: 'orders/*',
            subscribeShareNameExceptionSyntax: 'smf',
          },
          {
            subscribeShareNameException: 'devices/+',
            subscribeShareNameExceptionSyntax: 'mqtt',
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
        BrokerAclProfileSubscribeShareNameExceptionsList,
        'getBrokerAuthManager',
        context.mockBrokerAuthManager,
      )
      context.sandbox.stub(BrokerAclProfileSubscribeShareNameExceptionsList.prototype, 'log')
    })

    it('should call correct SEMP endpoint', async () => {
      await BrokerAclProfileSubscribeShareNameExceptionsList.run([
        '--broker-name=test-broker',
        '--acl-profile-name=testProfile',
        '--msg-vpn-name=default',
      ])

      expect(
        context.mockConnection.get!.calledWith(
          '/SEMP/v2/monitor/msgVpns/default/aclProfiles/testProfile/subscribeShareNameExceptions',
        ),
      ).to.be.true
    })
  })
})
