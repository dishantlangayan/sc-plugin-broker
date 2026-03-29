import {AuthType, BrokerAuth, ScConnection} from '@dishantlangayan/sc-cli-core'
import {expect} from 'chai'
import {restore, type SinonStub, stub} from 'sinon'

import BrokerClientProfileDelete from '../../../../src/commands/broker/client-profile/delete.js'
import {MsgVpnClientProfileDeleteResponse} from '../../../../src/types/msgvpn-client-profile.js'

describe('broker:client-profile:delete', () => {
  let mockBrokerAuthManager: {
    brokerExists: SinonStub
    createConnection: SinonStub
    getBroker: SinonStub
    getDefaultBroker: SinonStub
  }
  let mockConnection: {
    delete: SinonStub
  }
  let mockBroker: BrokerAuth

  beforeEach(() => {
    // Setup mock broker
    mockBroker = {
      accessToken: 'dGVzdDp0ZXN0',
      authType: AuthType.BASIC,
      name: 'test-broker',
      sempEndpoint: 'https://localhost',
      sempPort: 8080,
    }

    // Setup mock connection
    mockConnection = {
      delete: stub().resolves({
        meta: {
          responseCode: 200,
        },
      }),
    }

    // Setup mock BrokerAuthManager
    mockBrokerAuthManager = {
      brokerExists: stub().resolves(true),
      createConnection: stub().resolves(mockConnection as unknown as ScConnection),
      getBroker: stub().resolves(mockBroker),
      getDefaultBroker: stub().resolves(null),
    }
  })

  describe('SEMP API Calls with --no-prompt', () => {
    beforeEach(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub(BrokerClientProfileDelete.prototype as any, 'getBrokerAuthManager').resolves(mockBrokerAuthManager)
      stub(BrokerClientProfileDelete.prototype, 'log')
    })

    afterEach(() => {
      restore()
    })

    it('should call correct SEMP Config API DELETE endpoint', async () => {
      await BrokerClientProfileDelete.run([
        '--broker-name=test-broker',
        '--client-profile-name=testProfile',
        '--msg-vpn-name=default',
        '--no-prompt',
      ])

      expect(mockConnection.delete.calledWith('/SEMP/v2/config/msgVpns/default/clientProfiles/testProfile')).to.be
        .true
    })

    it('should display success message on 200 response', async () => {
      const mockResponse: MsgVpnClientProfileDeleteResponse = {
        meta: {
          responseCode: 200,
        },
      }

      mockConnection.delete.resolves(mockResponse)

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

      expect(mockConnection.delete.called).to.be.true
    })

    it('should return MsgVpnClientProfileDeleteResponse', async () => {
      const mockResponse: MsgVpnClientProfileDeleteResponse = {
        meta: {
          responseCode: 200,
        },
      }

      mockConnection.delete.resolves(mockResponse)

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
