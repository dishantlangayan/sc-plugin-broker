import type {SinonStub} from 'sinon'

import BrokerAclProfileDisplay from '../../../../src/commands/broker/acl-profile/display.js'
import {
  buildSimpleResponse,
  expect,
  setupTestContext,
  stubCommandMethod,
  type TestContext,
} from '../../../helpers/index.js'

describe('broker:acl-profile:display', () => {
  let context: TestContext

  beforeEach(() => {
    context = setupTestContext({}, ['get'])
    context.mockConnection.get!.resolves(
      buildSimpleResponse({
        data: {
          aclProfileName: 'testProfile',
          clientConnectDefaultAction: 'allow',
          msgVpnName: 'default',
          publishTopicDefaultAction: 'disallow',
          subscribeShareNameDefaultAction: 'allow',
          subscribeTopicDefaultAction: 'disallow',
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
        BrokerAclProfileDisplay,
        'getBrokerAuthManager',
        context.mockBrokerAuthManager,
      )
    })

    it('should call correct SEMP endpoint with ACL profile name in URL', async () => {
      await BrokerAclProfileDisplay.run([
        '--broker-name=test-broker',
        '--acl-profile-name=testProfile',
        '--msg-vpn-name=default',
      ])

      expect(
        context.mockConnection.get!.calledWith('/SEMP/v2/monitor/msgVpns/default/aclProfiles/testProfile'),
      ).to.be.true
    })
  })

  describe('Response Display', () => {
    beforeEach(() => {
      stubCommandMethod(
        context.sandbox,
        BrokerAclProfileDisplay,
        'getBrokerAuthManager',
        context.mockBrokerAuthManager,
      )
      context.sandbox.stub(BrokerAclProfileDisplay.prototype, 'log')
    })

    it('should display ACL profile details', async () => {
      await BrokerAclProfileDisplay.run([
        '--broker-name=test-broker',
        '--acl-profile-name=testProfile',
        '--msg-vpn-name=default',
      ])

      const logStub = BrokerAclProfileDisplay.prototype.log as SinonStub
      expect(logStub.called).to.be.true
    })
  })
})
