import {AuthType, BrokerAuth, BrokerAuthError, BrokerAuthErrorCode, ScCommand, ScConnection} from '@dishantlangayan/sc-cli-core'
import {Command} from '@oclif/core'
import {expect} from 'chai'
import {restore, type SinonStub, stub} from 'sinon'

import {resolveBrokerConnection, resolveMsgVpnName} from '../../src/lib/broker-utils.js'

describe('broker-utils', () => {
  let mockCommand: ScCommand<typeof Command>
  let mockBrokerAuthManager: {
    brokerExists: SinonStub
    createConnection: SinonStub
    getBroker: SinonStub
    getDefaultBroker: SinonStub
  }
  let mockConnection: ScConnection
  let mockBroker: BrokerAuth

  beforeEach(() => {
    // Setup mock broker
    mockBroker = {
      accessToken: 'dGVzdDp0ZXN0', // base64 encoded "test:test"
      authType: AuthType.BASIC,
      name: 'test-broker',
      sempEndpoint: 'https://localhost',
      sempPort: 8080,
    }

    // Setup mock connection
    mockConnection = {
      post: stub().resolves({}),
    } as unknown as ScConnection

    // Setup mock BrokerAuthManager
    mockBrokerAuthManager = {
      brokerExists: stub().resolves(true),
      createConnection: stub().resolves(mockConnection),
      getBroker: stub().resolves(mockBroker),
      getDefaultBroker: stub().resolves(null),
    }

    // Setup mock command
    mockCommand = {
      error: stub().throws(new Error('Command error')),
      getBrokerAuthManager: stub().resolves(mockBrokerAuthManager),
    } as unknown as ScCommand<typeof Command>
  })

  afterEach(() => {
    restore()
  })

  describe('resolveBrokerConnection', () => {
    it('should retrieve broker by name', async () => {
      await resolveBrokerConnection(mockCommand, 'test-broker')

      expect(mockBrokerAuthManager.getBroker.calledWith('test-broker')).to.be.true
    })

    it('should retrieve broker by id', async () => {
      await resolveBrokerConnection(mockCommand, 'test-id')

      expect(mockBrokerAuthManager.getBroker.calledWith('test-id')).to.be.true
    })

    it('should create SEMP connection from stored credentials', async () => {
      await resolveBrokerConnection(mockCommand, 'test-broker')

      expect(mockBrokerAuthManager.createConnection.calledWith('test-broker')).to.be.true
    })

    it('should pass timeout parameter to createConnection', async () => {
      const timeout = 5000
      await resolveBrokerConnection(mockCommand, 'test-broker', timeout)

      expect(mockBrokerAuthManager.createConnection.calledWith('test-broker', timeout)).to.be.true
    })

    it('should return the connection instance', async () => {
      const connection = await resolveBrokerConnection(mockCommand, 'test-broker')

      expect(connection).to.equal(mockConnection)
    })

    it('should call command.error when broker not found', async () => {
      const errorStub = mockCommand.error as unknown as SinonStub
      mockBrokerAuthManager.getBroker.rejects(
        new BrokerAuthError('Broker not found', BrokerAuthErrorCode.BROKER_NOT_FOUND),
      )

      try {
        await resolveBrokerConnection(mockCommand, 'nonexistent')
        expect.fail('Should have thrown an error')
      } catch {
        expect(errorStub.called).to.be.true
        const errorCall = errorStub.getCall(0)
        expect(errorCall.args[0]).to.match(/broker.*not found.*broker:login:basic/i)
      }
    })

    it('should call command.error when access token is invalid', async () => {
      const errorStub = mockCommand.error as unknown as SinonStub
      mockBrokerAuthManager.createConnection.rejects(
        new BrokerAuthError('Invalid access token', BrokerAuthErrorCode.INVALID_ACCESS_TOKEN),
      )

      try {
        await resolveBrokerConnection(mockCommand, 'test-broker')
        expect.fail('Should have thrown an error')
      } catch {
        expect(errorStub.called).to.be.true
        const errorCall = errorStub.getCall(0)
        expect(errorCall.args[0]).to.match(/invalid.*expired.*credentials.*broker:login:basic/i)
      }
    })

    it('should handle unknown BrokerAuthError codes', async () => {
      const errorStub = mockCommand.error as unknown as SinonStub
      mockBrokerAuthManager.createConnection.rejects(
        new BrokerAuthError('Unknown error', 999 as unknown as BrokerAuthErrorCode),
      )

      try {
        await resolveBrokerConnection(mockCommand, 'test-broker')
        expect.fail('Should have thrown an error')
      } catch {
        expect(errorStub.called).to.be.true
        const errorCall = errorStub.getCall(0)
        expect(errorCall.args[0]).to.match(/broker authentication failed/i)
      }
    })

    it('should use default broker when brokerIdentifier is empty', async () => {
      const defaultBroker: BrokerAuth = {
        accessToken: 'ZGVmYXVsdDpkZWZhdWx0',
        authType: AuthType.BASIC,
        isDefault: true,
        name: 'default-broker',
        sempEndpoint: 'https://default',
        sempPort: 8080,
      }
      mockBrokerAuthManager.getDefaultBroker.resolves(defaultBroker)
      mockBrokerAuthManager.getBroker.resolves(defaultBroker)

      await resolveBrokerConnection(mockCommand, '')

      expect(mockBrokerAuthManager.getDefaultBroker.called).to.be.true
      expect(mockBrokerAuthManager.getBroker.calledWith('default-broker')).to.be.true
      expect(mockBrokerAuthManager.createConnection.calledWith('default-broker')).to.be.true
    })

    it('should call command.error when brokerIdentifier is empty and no default broker exists', async () => {
      const errorStub = mockCommand.error as unknown as SinonStub
      mockBrokerAuthManager.getDefaultBroker.resolves(null)

      try {
        await resolveBrokerConnection(mockCommand, '')
        expect.fail('Should have thrown an error')
      } catch {
        expect(errorStub.called).to.be.true
        const errorCall = errorStub.getCall(0)
        expect(errorCall.args[0]).to.match(/no broker specified.*no default broker set/i)
      }
    })
  })

  describe('resolveMsgVpnName', () => {
    it('should return flag value when provided', async () => {
      const result = await resolveMsgVpnName(mockCommand, 'test-broker', 'custom-vpn')

      expect(result).to.equal('custom-vpn')
      // Should not call BrokerAuthManager when flag is provided
      expect(mockBrokerAuthManager.getBroker.called).to.be.false
    })

    it('should retrieve msgVpnName from Solace Cloud broker when flag not provided', async () => {
      const cloudBroker: BrokerAuth = {
        accessToken: 'dGVzdDp0ZXN0',
        authType: AuthType.BASIC,
        isSolaceCloud: true,
        msgVpnName: 'cloud-vpn',
        name: 'cloud-broker',
        sempEndpoint: 'https://cloud.solace.com',
        sempPort: 943,
      }
      mockBrokerAuthManager.getBroker.resolves(cloudBroker)

      const result = await resolveMsgVpnName(mockCommand, 'cloud-broker')

      expect(result).to.equal('cloud-vpn')
      expect(mockBrokerAuthManager.getBroker.calledWith('cloud-broker')).to.be.true
    })

    it('should call command.error when flag not provided for non-cloud broker', async () => {
      const errorStub = mockCommand.error as unknown as SinonStub
      const basicBroker: BrokerAuth = {
        accessToken: 'dGVzdDp0ZXN0',
        authType: AuthType.BASIC,
        name: 'basic-broker',
        sempEndpoint: 'https://localhost',
        sempPort: 8080,
      }
      mockBrokerAuthManager.getBroker.resolves(basicBroker)

      try {
        await resolveMsgVpnName(mockCommand, 'basic-broker')
        expect.fail('Should have thrown an error')
      } catch {
        expect(errorStub.called).to.be.true
        const errorCall = errorStub.getCall(0)
        expect(errorCall.args[0]).to.match(/msg-vpn-name.*required.*not using.*solace cloud/i)
      }
    })

    it('should use default broker when brokerIdentifier is empty', async () => {
      const defaultCloudBroker: BrokerAuth = {
        accessToken: 'ZGVmYXVsdDpkZWZhdWx0',
        authType: AuthType.BASIC,
        isDefault: true,
        isSolaceCloud: true,
        msgVpnName: 'default-vpn',
        name: 'default-broker',
        sempEndpoint: 'https://default.solace.com',
        sempPort: 943,
      }
      mockBrokerAuthManager.getDefaultBroker.resolves(defaultCloudBroker)
      mockBrokerAuthManager.getBroker.resolves(defaultCloudBroker)

      const result = await resolveMsgVpnName(mockCommand, '')

      expect(result).to.equal('default-vpn')
      expect(mockBrokerAuthManager.getDefaultBroker.called).to.be.true
      expect(mockBrokerAuthManager.getBroker.calledWith('default-broker')).to.be.true
    })

    it('should call command.error when broker not found', async () => {
      const errorStub = mockCommand.error as unknown as SinonStub
      mockBrokerAuthManager.getBroker.resolves(null)

      try {
        await resolveMsgVpnName(mockCommand, 'nonexistent')
        expect.fail('Should have thrown an error')
      } catch {
        expect(errorStub.called).to.be.true
        const errorCall = errorStub.getCall(0)
        expect(errorCall.args[0]).to.match(/broker.*not found.*broker:login/i)
      }
    })

    it('should prefer flag value over cloud broker msgVpnName', async () => {
      const cloudBroker: BrokerAuth = {
        accessToken: 'dGVzdDp0ZXN0',
        authType: AuthType.BASIC,
        isSolaceCloud: true,
        msgVpnName: 'cloud-vpn',
        name: 'cloud-broker',
        sempEndpoint: 'https://cloud.solace.com',
        sempPort: 943,
      }
      mockBrokerAuthManager.getBroker.resolves(cloudBroker)

      const result = await resolveMsgVpnName(mockCommand, 'cloud-broker', 'override-vpn')

      expect(result).to.equal('override-vpn')
      // Should not call getBroker when flag is provided
      expect(mockBrokerAuthManager.getBroker.called).to.be.false
    })
  })
})
