import BrokerAclProfileList from '../../../../src/commands/broker/acl-profile/list.js'
import {MsgVpnAclProfileMonitor} from '../../../../src/types/msgvpn-acl-profile.js'
import {
  buildSimpleResponse,
  expect,
  setupTestContext,
  stubCommandMethod,
  type TestContext,
} from '../../../helpers/index.js'

describe('broker:acl-profile:list', () => {
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
        BrokerAclProfileList,
        'getBrokerAuthManager',
        context.mockBrokerAuthManager,
      )
      context.sandbox.stub(BrokerAclProfileList.prototype, 'log')
    })

    it('should successfully list ACL profiles with default flags', async () => {
      const mockProfiles: MsgVpnAclProfileMonitor[] = [
        {
          aclProfileName: 'profile1',
          clientConnectDefaultAction: 'allow',
          msgVpnName: 'default',
          publishTopicDefaultAction: 'disallow',
          subscribeShareNameDefaultAction: 'allow',
          subscribeTopicDefaultAction: 'disallow',
        },
      ]

      context.mockConnection.get!.resolves(
        buildSimpleResponse({
          data: mockProfiles,
        }),
      )

      const result = await BrokerAclProfileList.run(['--broker-name=test-broker', '--msg-vpn-name=default'])

      expect(result.data).to.have.lengthOf(1)
      expect(result.data[0].aclProfileName).to.equal('profile1')
    })
  })

  describe('Count Flag', () => {
    beforeEach(() => {
      stubCommandMethod(
        context.sandbox,
        BrokerAclProfileList,
        'getBrokerAuthManager',
        context.mockBrokerAuthManager,
      )
      context.sandbox.stub(BrokerAclProfileList.prototype, 'log')
    })

    it('should use count parameter from flag', async () => {
      await BrokerAclProfileList.run(['--broker-name=test-broker', '--msg-vpn-name=default', '--count=20'])

      const getCall = context.mockConnection.get!.getCall(0)
      const url = getCall.args[0] as string
      expect(url).to.include('count=20')
    })
  })

  describe('ACL Profile Name Filtering', () => {
    beforeEach(() => {
      stubCommandMethod(
        context.sandbox,
        BrokerAclProfileList,
        'getBrokerAuthManager',
        context.mockBrokerAuthManager,
      )
      context.sandbox.stub(BrokerAclProfileList.prototype, 'log')
    })

    it('should add where parameter when acl-profile-name flag is provided', async () => {
      await BrokerAclProfileList.run([
        '--broker-name=test-broker',
        '--msg-vpn-name=default',
        '--acl-profile-name=client*',
      ])

      const getCall = context.mockConnection.get!.getCall(0)
      const url = getCall.args[0] as string
      expect(url).to.include('where=aclProfileName')
      expect(url).to.match(/where=aclProfileName.*client/)
    })

    it('should not add where parameter when acl-profile-name flag is not provided', async () => {
      await BrokerAclProfileList.run(['--broker-name=test-broker', '--msg-vpn-name=default'])

      const getCall = context.mockConnection.get!.getCall(0)
      const url = getCall.args[0] as string
      expect(url).to.not.include('where=')
    })
  })

  describe('Select Attributes', () => {
    beforeEach(() => {
      stubCommandMethod(
        context.sandbox,
        BrokerAclProfileList,
        'getBrokerAuthManager',
        context.mockBrokerAuthManager,
      )
      context.sandbox.stub(BrokerAclProfileList.prototype, 'log')
    })

    it('should include select parameter', async () => {
      await BrokerAclProfileList.run(['--broker-name=test-broker', '--msg-vpn-name=default'])

      const getCall = context.mockConnection.get!.getCall(0)
      const url = getCall.args[0] as string
      expect(url).to.include('select=')
    })
  })
})
