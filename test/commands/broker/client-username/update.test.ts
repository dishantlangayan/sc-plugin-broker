import type {SinonStub} from 'sinon'

import BrokerClientUsernameUpdate from '../../../../src/commands/broker/client-username/update.js'
import {
  buildSimpleResponse,
  expect,
  setupTestContext,
  stubCommandMethod,
  type TestContext,
} from '../../../helpers/index.js'

describe('broker:client-username:update', () => {
  let context: TestContext

  beforeEach(() => {
    context = setupTestContext({}, ['patch'])
    context.mockConnection.patch!.resolves(
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
        BrokerClientUsernameUpdate,
        'getBrokerAuthManager',
        context.mockBrokerAuthManager,
      )
    })

    it('should call correct SEMP endpoint with Client Username in URL path', async () => {
      await BrokerClientUsernameUpdate.run([
        '--broker-name=test-broker',
        '--client-username=testUser',
        '--msg-vpn-name=default',
        '--enabled',
      ])

      expect(
        context.mockConnection.patch!.calledWith('/SEMP/v2/config/msgVpns/default/clientUsernames/testUser'),
      ).to.be.true
    })

    it('should only include provided flags in request body', async () => {
      await BrokerClientUsernameUpdate.run([
        '--broker-name=test-broker',
        '--client-username=testUser',
        '--msg-vpn-name=default',
        '--enabled',
      ])

      const patchCall = context.mockConnection.patch!.getCall(0)
      const requestBody = patchCall.args[1]

      expect(requestBody).to.deep.equal({
        enabled: true,
      })
    })

    it('should not include clientUsername in request body', async () => {
      await BrokerClientUsernameUpdate.run([
        '--broker-name=test-broker',
        '--client-username=testUser',
        '--msg-vpn-name=default',
        '--enabled',
      ])

      const patchCall = context.mockConnection.patch!.getCall(0)
      const requestBody = patchCall.args[1]

      expect(requestBody).to.not.have.property('clientUsername')
    })

    it('should map multiple flags correctly', async () => {
      await BrokerClientUsernameUpdate.run([
        '--broker-name=test-broker',
        '--client-username=testUser',
        '--msg-vpn-name=default',
        '--enabled',
        '--acl-profile-name=new-acl',
        '--client-profile-name=new-profile',
        '--subscription-manager-enabled',
      ])

      const patchCall = context.mockConnection.patch!.getCall(0)
      const requestBody = patchCall.args[1]

      expect(requestBody).to.deep.equal({
        aclProfileName: 'new-acl',
        clientProfileName: 'new-profile',
        enabled: true,
        subscriptionManagerEnabled: true,
      })
    })

    it('should handle password updates', async () => {
      await BrokerClientUsernameUpdate.run([
        '--broker-name=test-broker',
        '--client-username=testUser',
        '--msg-vpn-name=default',
        '--password=newPassword123',
      ])

      const patchCall = context.mockConnection.patch!.getCall(0)
      const requestBody = patchCall.args[1]

      expect(requestBody).to.deep.equal({
        password: 'newPassword123',
      })
    })
  })

  describe('Response Display', () => {
    beforeEach(() => {
      stubCommandMethod(
        context.sandbox,
        BrokerClientUsernameUpdate,
        'getBrokerAuthManager',
        context.mockBrokerAuthManager,
      )
      context.sandbox.stub(BrokerClientUsernameUpdate.prototype, 'log')
    })

    it('should display updated Client Username data', async () => {
      await BrokerClientUsernameUpdate.run([
        '--broker-name=test-broker',
        '--client-username=testUser',
        '--msg-vpn-name=default',
        '--enabled',
      ])

      const logStub = BrokerClientUsernameUpdate.prototype.log as SinonStub
      expect(logStub.called).to.be.true
    })
  })
})
