import type {SinonStub} from 'sinon'

import {AuthType, BrokerAuth, BrokerAuthError, BrokerAuthErrorCode, ScCommand} from '@dishantlangayan/sc-cli-core'
import {Command} from '@oclif/core'

import {resolveBrokerConnection, resolveMsgVpnName} from '../../src/lib/broker-utils.js'
import {
  createMockBroker,
  createMockCloudBroker,
  createMockDefaultBroker,
  expect,
  setupTestContext,
  type TestContext,
} from '../helpers/index.js'

describe('broker-utils', () => {
  let context: TestContext
  let mockCommand: ScCommand<typeof Command>

  beforeEach(() => {
    context = setupTestContext()

    // Setup mock command
    mockCommand = {
      error: context.sandbox.stub().throws(new Error('Command error')),
      getBrokerAuthManager: context.sandbox.stub().resolves(context.mockBrokerAuthManager),
    } as unknown as ScCommand<typeof Command>
  })

  afterEach(() => {
    context.cleanup()
  })

  describe('resolveBrokerConnection', () => {
    it('should retrieve broker by name', async () => {
      await resolveBrokerConnection(mockCommand, 'test-broker')

      expect(context.mockBrokerAuthManager.getBroker.calledWith('test-broker')).to.be.true
    })

    it('should retrieve broker by id', async () => {
      await resolveBrokerConnection(mockCommand, 'test-id')

      expect(context.mockBrokerAuthManager.getBroker.calledWith('test-id')).to.be.true
    })

    it('should create SEMP connection from stored credentials', async () => {
      await resolveBrokerConnection(mockCommand, 'test-broker')

      expect(context.mockBrokerAuthManager.createConnection.calledWith('test-broker')).to.be.true
    })

    it('should pass timeout parameter to createConnection', async () => {
      const timeout = 5000
      await resolveBrokerConnection(mockCommand, 'test-broker', timeout)

      expect(context.mockBrokerAuthManager.createConnection.calledWith('test-broker', timeout)).to.be.true
    })

    it('should return the connection instance', async () => {
      const connection = await resolveBrokerConnection(mockCommand, 'test-broker')

      expect(connection).to.equal(context.mockConnection)
    })

    it('should call command.error when broker not found', async () => {
      const errorStub = mockCommand.error as unknown as SinonStub
      context.mockBrokerAuthManager.getBroker.rejects(
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
      context.mockBrokerAuthManager.createConnection.rejects(
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
      context.mockBrokerAuthManager.createConnection.rejects(
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
      const defaultBroker: BrokerAuth = createMockDefaultBroker({
        accessToken: 'ZGVmYXVsdDpkZWZhdWx0',
        name: 'default-broker',
        sempEndpoint: 'https://default',
      })

      context.mockBrokerAuthManager.getDefaultBroker.resolves(defaultBroker)
      context.mockBrokerAuthManager.getBroker.resolves(defaultBroker)

      await resolveBrokerConnection(mockCommand, '')

      expect(context.mockBrokerAuthManager.getDefaultBroker.called).to.be.true
      expect(context.mockBrokerAuthManager.getBroker.calledWith('default-broker')).to.be.true
      expect(context.mockBrokerAuthManager.createConnection.calledWith('default-broker')).to.be.true
    })

    it('should call command.error when brokerIdentifier is empty and no default broker exists', async () => {
      const errorStub = mockCommand.error as unknown as SinonStub
      context.mockBrokerAuthManager.getDefaultBroker.resolves(null)

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
      expect(context.mockBrokerAuthManager.getBroker.called).to.be.false
    })

    it('should retrieve msgVpnName from Solace Cloud broker when flag not provided', async () => {
      const cloudBroker: BrokerAuth = createMockCloudBroker({
        msgVpnName: 'cloud-vpn',
        name: 'cloud-broker',
        sempEndpoint: 'https://cloud.solace.com',
        sempPort: 943,
      })

      context.mockBrokerAuthManager.getBroker.resolves(cloudBroker)

      const result = await resolveMsgVpnName(mockCommand, 'cloud-broker')

      expect(result).to.equal('cloud-vpn')
      expect(context.mockBrokerAuthManager.getBroker.calledWith('cloud-broker')).to.be.true
    })

    it('should call command.error when flag not provided for non-cloud broker', async () => {
      const errorStub = mockCommand.error as unknown as SinonStub
      const basicBroker: BrokerAuth = createMockBroker({
        name: 'basic-broker',
        sempEndpoint: 'https://localhost',
      })

      context.mockBrokerAuthManager.getBroker.resolves(basicBroker)

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
        ...createMockCloudBroker({
          msgVpnName: 'default-vpn',
          name: 'default-broker',
          sempEndpoint: 'https://default.solace.com',
          sempPort: 943,
        }),
        accessToken: 'ZGVmYXVsdDpkZWZhdWx0',
        authType: AuthType.BASIC,
        isDefault: true,
      }

      context.mockBrokerAuthManager.getDefaultBroker.resolves(defaultCloudBroker)
      context.mockBrokerAuthManager.getBroker.resolves(defaultCloudBroker)

      const result = await resolveMsgVpnName(mockCommand, '')

      expect(result).to.equal('default-vpn')
      expect(context.mockBrokerAuthManager.getDefaultBroker.called).to.be.true
      expect(context.mockBrokerAuthManager.getBroker.calledWith('default-broker')).to.be.true
    })

    it('should call command.error when broker not found', async () => {
      const errorStub = mockCommand.error as unknown as SinonStub
      context.mockBrokerAuthManager.getBroker.resolves(null)

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
      const cloudBroker: BrokerAuth = createMockCloudBroker({
        msgVpnName: 'cloud-vpn',
        name: 'cloud-broker',
        sempEndpoint: 'https://cloud.solace.com',
        sempPort: 943,
      })

      context.mockBrokerAuthManager.getBroker.resolves(cloudBroker)

      const result = await resolveMsgVpnName(mockCommand, 'cloud-broker', 'override-vpn')

      expect(result).to.equal('override-vpn')
      // Should not call getBroker when flag is provided
      expect(context.mockBrokerAuthManager.getBroker.called).to.be.false
    })
  })
})
