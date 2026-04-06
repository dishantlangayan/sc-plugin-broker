import type {SinonStub} from 'sinon'

import BrokerAclProfileDelete from '../../../../src/commands/broker/acl-profile/delete.js'
import {MsgVpnAclProfileDeleteResponse} from '../../../../src/types/msgvpn-acl-profile.js'
import {
  buildDeleteResponse,
  expect,
  setupTestContext,
  stubCommandMethod,
  type TestContext,
} from '../../../helpers/index.js'

describe('broker:acl-profile:delete', () => {
  let context: TestContext

  beforeEach(() => {
    context = setupTestContext({}, ['delete'])
    context.mockConnection.delete!.resolves(buildDeleteResponse())
  })

  afterEach(() => {
    context.cleanup()
  })

  describe('SEMP API Calls', () => {
    beforeEach(() => {
      stubCommandMethod(
        context.sandbox,
        BrokerAclProfileDelete,
        'getBrokerAuthManager',
        context.mockBrokerAuthManager,
      )
    })

    it('should call correct SEMP endpoint with --no-prompt', async () => {
      await BrokerAclProfileDelete.run([
        '--broker-name=test-broker',
        '--acl-profile-name=testProfile',
        '--msg-vpn-name=default',
        '--no-prompt',
      ])

      expect(
        context.mockConnection.delete!.calledWith('/SEMP/v2/config/msgVpns/default/aclProfiles/testProfile'),
      ).to.be.true
    })
  })

  describe('Response Display', () => {
    beforeEach(() => {
      stubCommandMethod(
        context.sandbox,
        BrokerAclProfileDelete,
        'getBrokerAuthManager',
        context.mockBrokerAuthManager,
      )
      context.sandbox.stub(BrokerAclProfileDelete.prototype, 'log')
    })

    it('should display success message when responseCode is 200', async () => {
      const mockResponse: MsgVpnAclProfileDeleteResponse = {
        meta: {
          request: {method: 'DELETE', uri: '/config/msgVpns/default/aclProfiles/testProfile'},
          responseCode: 200,
        },
      }

      context.mockConnection.delete!.resolves(mockResponse)

      await BrokerAclProfileDelete.run([
        '--broker-name=test-broker',
        '--acl-profile-name=testProfile',
        '--msg-vpn-name=default',
        '--no-prompt',
      ])

      const logStub = BrokerAclProfileDelete.prototype.log as SinonStub
      expect(logStub.called).to.be.true
    })
  })
})
