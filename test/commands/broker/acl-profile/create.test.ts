import type {SinonStub} from 'sinon'

import BrokerAclProfileCreate from '../../../../src/commands/broker/acl-profile/create.js'
import {
  buildSimpleResponse,
  expect,
  setupTestContext,
  stubCommandMethod,
  type TestContext,
} from '../../../helpers/index.js'

describe('broker:acl-profile:create', () => {
  let context: TestContext

  beforeEach(() => {
    context = setupTestContext({}, ['post'])
    context.mockConnection.post!.resolves(
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
        BrokerAclProfileCreate,
        'getBrokerAuthManager',
        context.mockBrokerAuthManager,
      )
    })

    it('should call correct SEMP endpoint', async () => {
      await BrokerAclProfileCreate.run([
        '--broker-name=test-broker',
        '--acl-profile-name=testProfile',
        '--msg-vpn-name=default',
      ])

      expect(context.mockConnection.post!.calledWith('/SEMP/v2/config/msgVpns/default/aclProfiles')).to.be.true
    })

    it('should map all flags correctly to SEMP request body', async () => {
      await BrokerAclProfileCreate.run([
        '--broker-name=test-broker',
        '--acl-profile-name=advancedProfile',
        '--msg-vpn-name=default',
        '--client-connect-default-action=allow',
        '--publish-topic-default-action=allow',
        '--subscribe-topic-default-action=allow',
        '--subscribe-share-name-default-action=disallow',
      ])

      const postCall = context.mockConnection.post!.getCall(0)
      const requestBody = postCall.args[1]

      expect(requestBody).to.deep.equal({
        aclProfileName: 'advancedProfile',
        clientConnectDefaultAction: 'allow',
        publishTopicDefaultAction: 'allow',
        subscribeShareNameDefaultAction: 'disallow',
        subscribeTopicDefaultAction: 'allow',
      })
    })

    it('should create minimal ACL profile with only required flag', async () => {
      await BrokerAclProfileCreate.run([
        '--broker-name=test-broker',
        '--acl-profile-name=minimalProfile',
        '--msg-vpn-name=default',
      ])

      const postCall = context.mockConnection.post!.getCall(0)
      const requestBody = postCall.args[1]

      expect(requestBody).to.deep.equal({
        aclProfileName: 'minimalProfile',
      })
    })
  })

  describe('Response Display', () => {
    beforeEach(() => {
      stubCommandMethod(
        context.sandbox,
        BrokerAclProfileCreate,
        'getBrokerAuthManager',
        context.mockBrokerAuthManager,
      )
      context.sandbox.stub(BrokerAclProfileCreate.prototype, 'log')
    })

    it('should display ACL profile data', async () => {
      await BrokerAclProfileCreate.run([
        '--broker-name=test-broker',
        '--acl-profile-name=testProfile',
        '--msg-vpn-name=default',
      ])

      const logStub = BrokerAclProfileCreate.prototype.log as SinonStub
      expect(logStub.called).to.be.true
    })
  })
})
