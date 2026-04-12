import type {SinonStub} from 'sinon'

import BrokerClientUsernameDelete from '../../../../src/commands/broker/client-username/delete.js'
import {MsgVpnClientUsernameDeleteResponse} from '../../../../src/types/msgvpn-client-username.js'
import {
  buildDeleteResponse,
  expect,
  setupTestContext,
  stubCommandMethod,
  type TestContext,
} from '../../../helpers/index.js'

describe('broker:client-username:delete', () => {
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
        BrokerClientUsernameDelete,
        'getBrokerAuthManager',
        context.mockBrokerAuthManager,
      )
    })

    it('should call correct SEMP endpoint with --no-prompt', async () => {
      await BrokerClientUsernameDelete.run([
        '--broker-name=test-broker',
        '--client-username=testUser',
        '--msg-vpn-name=default',
        '--no-prompt',
      ])

      expect(
        context.mockConnection.delete!.calledWith('/SEMP/v2/config/msgVpns/default/clientUsernames/testUser'),
      ).to.be.true
    })
  })

  describe('Response Display', () => {
    beforeEach(() => {
      stubCommandMethod(
        context.sandbox,
        BrokerClientUsernameDelete,
        'getBrokerAuthManager',
        context.mockBrokerAuthManager,
      )
      context.sandbox.stub(BrokerClientUsernameDelete.prototype, 'log')
    })

    it('should display success message when responseCode is 200', async () => {
      const mockResponse: MsgVpnClientUsernameDeleteResponse = {
        meta: {
          request: {method: 'DELETE', uri: '/config/msgVpns/default/clientUsernames/testUser'},
          responseCode: 200,
        },
      }

      context.mockConnection.delete!.resolves(mockResponse)

      await BrokerClientUsernameDelete.run([
        '--broker-name=test-broker',
        '--client-username=testUser',
        '--msg-vpn-name=default',
        '--no-prompt',
      ])

      const logStub = BrokerClientUsernameDelete.prototype.log as SinonStub
      expect(logStub.called).to.be.true
    })
  })
})
