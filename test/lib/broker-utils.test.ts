import {AuthType, BrokerAuth, BrokerAuthError, BrokerAuthErrorCode, ScCommand, ScConnection} from '@dishantlangayan/sc-cli-core'
import {Command} from '@oclif/core'
import {expect} from 'chai'
import {restore, type SinonStub, stub} from 'sinon'

import {resolveBrokerConnection} from '../../src/lib/broker-utils.js'

describe('broker-utils', () => {
  let mockCommand: ScCommand<typeof Command>
  let mockBrokerAuthManager: {
    brokerExists: SinonStub
    createConnection: SinonStub
    getBroker: SinonStub
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
  })
})
