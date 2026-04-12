import type {SinonStub} from 'sinon'

import BrokerClientUsernameDisplay from '../../../../src/commands/broker/client-username/display.js'
import {
  buildSimpleResponse,
  expect,
  setupTestContext,
  stubCommandMethod,
  type TestContext,
} from '../../../helpers/index.js'

describe('broker:client-username:display', () => {
  let context: TestContext

  beforeEach(() => {
    context = setupTestContext({}, ['get'])
    context.mockConnection.get!.resolves(
      buildSimpleResponse({
        data: {
          aclProfileName: 'custom-acl',
          clientProfileName: 'custom-profile',
          clientUsername: 'testUser',
          enabled: true,
          guaranteedEndpointPermissionOverrideEnabled: false,
          msgVpnName: 'default',
          subscriptionManagerEnabled: true,
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
        BrokerClientUsernameDisplay,
        'getBrokerAuthManager',
        context.mockBrokerAuthManager,
      )
    })

    it('should call correct SEMP endpoint with Client Username in URL', async () => {
      await BrokerClientUsernameDisplay.run([
        '--broker-name=test-broker',
        '--client-username=testUser',
        '--msg-vpn-name=default',
      ])

      expect(
        context.mockConnection.get!.calledWith('/SEMP/v2/monitor/msgVpns/default/clientUsernames/testUser'),
      ).to.be.true
    })
  })

  describe('Response Display', () => {
    beforeEach(() => {
      stubCommandMethod(
        context.sandbox,
        BrokerClientUsernameDisplay,
        'getBrokerAuthManager',
        context.mockBrokerAuthManager,
      )
      context.sandbox.stub(BrokerClientUsernameDisplay.prototype, 'log')
    })

    it('should display Client Username details', async () => {
      await BrokerClientUsernameDisplay.run([
        '--broker-name=test-broker',
        '--client-username=testUser',
        '--msg-vpn-name=default',
      ])

      const logStub = BrokerClientUsernameDisplay.prototype.log as SinonStub
      expect(logStub.called).to.be.true
    })
  })
})
