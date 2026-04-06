import type {SinonStub} from 'sinon'

import BrokerAclProfileUpdate from '../../../../src/commands/broker/acl-profile/update.js'
import {
  buildSimpleResponse,
  expect,
  setupTestContext,
  stubCommandMethod,
  type TestContext,
} from '../../../helpers/index.js'

describe('broker:acl-profile:update', () => {
  let context: TestContext

  beforeEach(() => {
    context = setupTestContext({}, ['patch'])
    context.mockConnection.patch!.resolves(
      buildSimpleResponse({
        data: {
          aclProfileName: 'testProfile',
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
        BrokerAclProfileUpdate,
        'getBrokerAuthManager',
        context.mockBrokerAuthManager,
      )
    })

    it('should call correct SEMP endpoint with ACL profile name in URL path', async () => {
      await BrokerAclProfileUpdate.run([
        '--broker-name=test-broker',
        '--acl-profile-name=testProfile',
        '--msg-vpn-name=default',
        '--client-connect-default-action=allow',
      ])

      expect(
        context.mockConnection.patch!.calledWith('/SEMP/v2/config/msgVpns/default/aclProfiles/testProfile'),
      ).to.be.true
    })

    it('should only include provided flags in request body', async () => {
      await BrokerAclProfileUpdate.run([
        '--broker-name=test-broker',
        '--acl-profile-name=testProfile',
        '--msg-vpn-name=default',
        '--client-connect-default-action=allow',
      ])

      const patchCall = context.mockConnection.patch!.getCall(0)
      const requestBody = patchCall.args[1]

      expect(requestBody).to.deep.equal({
        clientConnectDefaultAction: 'allow',
      })
    })

    it('should map multiple flags correctly', async () => {
      await BrokerAclProfileUpdate.run([
        '--broker-name=test-broker',
        '--acl-profile-name=testProfile',
        '--msg-vpn-name=default',
        '--client-connect-default-action=allow',
        '--publish-topic-default-action=allow',
        '--subscribe-topic-default-action=disallow',
      ])

      const patchCall = context.mockConnection.patch!.getCall(0)
      const requestBody = patchCall.args[1]

      expect(requestBody).to.deep.equal({
        clientConnectDefaultAction: 'allow',
        publishTopicDefaultAction: 'allow',
        subscribeTopicDefaultAction: 'disallow',
      })
    })
  })

  describe('Response Display', () => {
    beforeEach(() => {
      stubCommandMethod(
        context.sandbox,
        BrokerAclProfileUpdate,
        'getBrokerAuthManager',
        context.mockBrokerAuthManager,
      )
      context.sandbox.stub(BrokerAclProfileUpdate.prototype, 'log')
    })

    it('should display updated ACL profile data', async () => {
      await BrokerAclProfileUpdate.run([
        '--broker-name=test-broker',
        '--acl-profile-name=testProfile',
        '--msg-vpn-name=default',
        '--client-connect-default-action=allow',
      ])

      const logStub = BrokerAclProfileUpdate.prototype.log as SinonStub
      expect(logStub.called).to.be.true
    })
  })
})
