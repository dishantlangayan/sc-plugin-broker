import BrokerClientUsernameList from '../../../../src/commands/broker/client-username/list.js'
import {MsgVpnClientUsernameMonitor} from '../../../../src/types/msgvpn-client-username.js'
import {
  buildSimpleResponse,
  expect,
  setupTestContext,
  stubCommandMethod,
  type TestContext,
} from '../../../helpers/index.js'

describe('broker:client-username:list', () => {
  let context: TestContext

  beforeEach(() => {
    context = setupTestContext({}, ['get'])
    context.mockConnection.get!.resolves(buildSimpleResponse({data: []}))
  })

  afterEach(() => {
    context.cleanup()
  })

  describe('Basic Functionality', () => {
    beforeEach(() => {
      stubCommandMethod(
        context.sandbox,
        BrokerClientUsernameList,
        'getBrokerAuthManager',
        context.mockBrokerAuthManager,
      )
      context.sandbox.stub(BrokerClientUsernameList.prototype, 'log')
    })

    it('should successfully list Client Usernames with default flags', async () => {
      const mockClientUsernames: MsgVpnClientUsernameMonitor[] = [
        {
          aclProfileName: 'default',
          clientProfileName: 'default',
          clientUsername: 'user1',
          enabled: true,
          msgVpnName: 'default',
          subscriptionManagerEnabled: false,
        },
      ]

      context.mockConnection.get!.resolves(
        buildSimpleResponse({
          data: mockClientUsernames,
        }),
      )

      const result = await BrokerClientUsernameList.run(['--broker-name=test-broker', '--msg-vpn-name=default'])

      expect(result.data).to.have.lengthOf(1)
      expect(result.data[0].clientUsername).to.equal('user1')
    })
  })

  describe('Count Flag', () => {
    beforeEach(() => {
      stubCommandMethod(
        context.sandbox,
        BrokerClientUsernameList,
        'getBrokerAuthManager',
        context.mockBrokerAuthManager,
      )
      context.sandbox.stub(BrokerClientUsernameList.prototype, 'log')
    })

    it('should use count parameter from flag', async () => {
      await BrokerClientUsernameList.run(['--broker-name=test-broker', '--msg-vpn-name=default', '--count=20'])

      const getCall = context.mockConnection.get!.getCall(0)
      const url = getCall.args[0] as string
      expect(url).to.include('count=20')
    })
  })

  describe('Client Username Filtering', () => {
    beforeEach(() => {
      stubCommandMethod(
        context.sandbox,
        BrokerClientUsernameList,
        'getBrokerAuthManager',
        context.mockBrokerAuthManager,
      )
      context.sandbox.stub(BrokerClientUsernameList.prototype, 'log')
    })

    it('should add where parameter when client-username flag is provided', async () => {
      await BrokerClientUsernameList.run([
        '--broker-name=test-broker',
        '--msg-vpn-name=default',
        '--client-username=user*',
      ])

      const getCall = context.mockConnection.get!.getCall(0)
      const url = getCall.args[0] as string
      expect(url).to.include('where=clientUsername')
      expect(url).to.match(/where=clientUsername.*user/)
    })

    it('should not add where parameter when client-username flag is not provided', async () => {
      await BrokerClientUsernameList.run(['--broker-name=test-broker', '--msg-vpn-name=default'])

      const getCall = context.mockConnection.get!.getCall(0)
      const url = getCall.args[0] as string
      expect(url).to.not.include('where=')
    })
  })

  describe('Select Attributes', () => {
    beforeEach(() => {
      stubCommandMethod(
        context.sandbox,
        BrokerClientUsernameList,
        'getBrokerAuthManager',
        context.mockBrokerAuthManager,
      )
      context.sandbox.stub(BrokerClientUsernameList.prototype, 'log')
    })

    it('should include select parameter', async () => {
      await BrokerClientUsernameList.run(['--broker-name=test-broker', '--msg-vpn-name=default'])

      const getCall = context.mockConnection.get!.getCall(0)
      const url = getCall.args[0] as string
      expect(url).to.include('select=')
    })
  })
})
