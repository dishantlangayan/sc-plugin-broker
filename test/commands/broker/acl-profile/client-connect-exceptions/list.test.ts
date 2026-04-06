import BrokerAclProfileClientConnectExceptionsList from '../../../../../src/commands/broker/acl-profile/client-connect-exceptions/list.js'
import {
  buildSimpleResponse,
  expect,
  setupTestContext,
  stubCommandMethod,
  type TestContext,
} from '../../../../helpers/index.js'

describe('broker:acl-profile:client-connect-exceptions:list', () => {
  let context: TestContext

  beforeEach(() => {
    context = setupTestContext({}, ['get'])
    context.mockConnection.get!.resolves(
      buildSimpleResponse({
        data: [
          {
            clientConnectExceptionAddress: '192.168.1.0/24',
          },
          {
            clientConnectExceptionAddress: '10.0.0.0/8',
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
        BrokerAclProfileClientConnectExceptionsList,
        'getBrokerAuthManager',
        context.mockBrokerAuthManager,
      )
      context.sandbox.stub(BrokerAclProfileClientConnectExceptionsList.prototype, 'log')
    })

    it('should call correct SEMP endpoint', async () => {
      await BrokerAclProfileClientConnectExceptionsList.run([
        '--broker-name=test-broker',
        '--acl-profile-name=testProfile',
        '--msg-vpn-name=default',
      ])

      expect(
        context.mockConnection.get!.calledWith(
          '/SEMP/v2/monitor/msgVpns/default/aclProfiles/testProfile/clientConnectExceptions',
        ),
      ).to.be.true
    })
  })
})
