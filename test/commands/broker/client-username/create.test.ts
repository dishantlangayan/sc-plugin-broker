import type {SinonStub} from 'sinon'

import BrokerClientUsernameCreate from '../../../../src/commands/broker/client-username/create.js'
import {
  buildSimpleResponse,
  expect,
  setupTestContext,
  stubCommandMethod,
  type TestContext,
} from '../../../helpers/index.js'

describe('broker:client-username:create', () => {
  let context: TestContext

  beforeEach(() => {
    context = setupTestContext({}, ['post'])
    context.mockConnection.post!.resolves(
      buildSimpleResponse({
        data: {
          clientUsername: 'testUser',
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
        BrokerClientUsernameCreate,
        'getBrokerAuthManager',
        context.mockBrokerAuthManager,
      )
    })

    it('should call correct SEMP endpoint', async () => {
      await BrokerClientUsernameCreate.run([
        '--broker-name=test-broker',
        '--client-username=testUser',
        '--msg-vpn-name=default',
      ])

      expect(context.mockConnection.post!.calledWith('/SEMP/v2/config/msgVpns/default/clientUsernames')).to.be.true
    })

    it('should map all flags correctly to SEMP request body', async () => {
      await BrokerClientUsernameCreate.run([
        '--broker-name=test-broker',
        '--client-username=advancedUser',
        '--msg-vpn-name=default',
        '--enabled',
        '--acl-profile-name=custom-acl',
        '--client-profile-name=custom-profile',
        '--password=secret123',
        '--subscription-manager-enabled',
        '--guaranteed-endpoint-permission-override-enabled',
      ])

      const postCall = context.mockConnection.post!.getCall(0)
      const requestBody = postCall.args[1]

      expect(requestBody).to.deep.equal({
        aclProfileName: 'custom-acl',
        clientProfileName: 'custom-profile',
        clientUsername: 'advancedUser',
        enabled: true,
        guaranteedEndpointPermissionOverrideEnabled: true,
        password: 'secret123',
        subscriptionManagerEnabled: true,
      })
    })

    it('should create minimal Client Username with only required flag', async () => {
      await BrokerClientUsernameCreate.run([
        '--broker-name=test-broker',
        '--client-username=minimalUser',
        '--msg-vpn-name=default',
      ])

      const postCall = context.mockConnection.post!.getCall(0)
      const requestBody = postCall.args[1]

      expect(requestBody).to.deep.equal({
        clientUsername: 'minimalUser',
      })
    })

    it('should handle boolean flags correctly', async () => {
      await BrokerClientUsernameCreate.run([
        '--broker-name=test-broker',
        '--client-username=testUser',
        '--msg-vpn-name=default',
        '--enabled',
      ])

      const postCall = context.mockConnection.post!.getCall(0)
      const requestBody = postCall.args[1]

      expect(requestBody).to.include({
        enabled: true,
      })
    })
  })

  describe('Response Display', () => {
    beforeEach(() => {
      stubCommandMethod(
        context.sandbox,
        BrokerClientUsernameCreate,
        'getBrokerAuthManager',
        context.mockBrokerAuthManager,
      )
      context.sandbox.stub(BrokerClientUsernameCreate.prototype, 'log')
    })

    it('should display Client Username data', async () => {
      await BrokerClientUsernameCreate.run([
        '--broker-name=test-broker',
        '--client-username=testUser',
        '--msg-vpn-name=default',
      ])

      const logStub = BrokerClientUsernameCreate.prototype.log as SinonStub
      expect(logStub.called).to.be.true
    })
  })
})
