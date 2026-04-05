import BrokerClientProfileDelete from '../../../../src/commands/broker/client-profile/delete.js'
import {MsgVpnClientProfileDeleteResponse} from '../../../../src/types/msgvpn-client-profile.js'
import {
  buildDeleteResponse,
  expect,
  setupTestContext,
  type SinonStub,
  stubCommandMethod,
  type TestContext,
} from '../../../helpers/index.js'

describe('broker:client-profile:delete', () => {
  let context: TestContext

  beforeEach(() => {
    context = setupTestContext({}, ['delete'])
    context.mockConnection.delete!.resolves(buildDeleteResponse())
  })

  afterEach(() => {
    context.cleanup()
  })

  describe('SEMP API Calls with --no-prompt', () => {
    beforeEach(() => {
      stubCommandMethod(
        context.sandbox,
        BrokerClientProfileDelete,
        'getBrokerAuthManager',
        context.mockBrokerAuthManager,
      )
    })

    it('should call correct SEMP Config API DELETE endpoint', async () => {
      await BrokerClientProfileDelete.run([
        '--broker-name=test-broker',
        '--client-profile-name=testProfile',
        '--msg-vpn-name=default',
        '--no-prompt',
      ])

      expect(context.mockConnection.delete!.calledWith('/SEMP/v2/config/msgVpns/default/clientProfiles/testProfile'))
        .to.be.true
    })

    it('should display success message on 200 response', async () => {
      const mockResponse: MsgVpnClientProfileDeleteResponse = buildDeleteResponse()

      context.mockConnection.delete!.resolves(mockResponse)
      context.sandbox.stub(BrokerClientProfileDelete.prototype, 'log')

      await BrokerClientProfileDelete.run([
        '--broker-name=test-broker',
        '--client-profile-name=testProfile',
        '--msg-vpn-name=default',
        '--no-prompt',
      ])

      const logStub = BrokerClientProfileDelete.prototype.log as SinonStub
      expect(logStub.called).to.be.true
      expect(logStub.args.some((args) => args[0].includes('Successfully deleted'))).to.be.true
    })

    it('should skip prompt when --no-prompt provided', async () => {
      await BrokerClientProfileDelete.run([
        '--broker-name=test-broker',
        '--client-profile-name=testProfile',
        '--msg-vpn-name=default',
        '--no-prompt',
      ])

      expect(context.mockConnection.delete!.called).to.be.true
    })

    it('should return MsgVpnClientProfileDeleteResponse', async () => {
      const mockResponse: MsgVpnClientProfileDeleteResponse = buildDeleteResponse()

      context.mockConnection.delete!.resolves(mockResponse)

      const result = await BrokerClientProfileDelete.run([
        '--broker-name=test-broker',
        '--client-profile-name=testProfile',
        '--msg-vpn-name=default',
        '--no-prompt',
      ])

      expect(result).to.deep.equal(mockResponse)
    })
  })
})
