import {AuthType, BrokerAuth} from '@dishantlangayan/sc-cli-core'
import {runCommand} from '@oclif/test'

import BrokerLogout from '../../../src/commands/broker/logout.js'
import {createSandbox, expect, type SinonSandbox, type SinonStub} from '../../helpers/index.js'

describe('broker:logout', () => {
  let sandbox: SinonSandbox
  let mockBrokerAuthManager: {
    getAllBrokers: SinonStub
    removeBroker: SinonStub
  }

  beforeEach(() => {
    sandbox = createSandbox()

    // Mock BrokerAuthManager
    mockBrokerAuthManager = {
      getAllBrokers: sandbox.stub(),
      removeBroker: sandbox.stub().resolves(),
    }

    sandbox.stub(
      BrokerLogout.prototype as unknown as Record<string, unknown>,
      'getBrokerAuthManager',
    ).resolves(mockBrokerAuthManager)
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('logs out from specific broker with --broker-name and --no-prompt', async () => {
    // Arrange
    const brokers: BrokerAuth[] = [
      {
        accessToken: Buffer.from('admin:password123', 'utf8').toString('base64'),
        authType: AuthType.BASIC,
        isDefault: false,
        name: 'test-broker',
        sempEndpoint: 'https://localhost',
        sempPort: 8080,
      },
      {
        accessToken: Buffer.from('admin:password456', 'utf8').toString('base64'),
        authType: AuthType.BASIC,
        isDefault: false,
        name: 'dev-broker',
        sempEndpoint: 'https://dev.example.com',
        sempPort: 8080,
      },
    ]
    mockBrokerAuthManager.getAllBrokers.resolves(brokers)

    // Act
    const {stdout} = await runCommand('broker:logout --broker-name=test-broker --no-prompt')

    // Assert
    expect(mockBrokerAuthManager.getAllBrokers.calledOnce).to.be.true
    expect(mockBrokerAuthManager.removeBroker.calledOnceWith('test-broker')).to.be.true
    expect(stdout).to.contain('Successfully logged out from: test-broker')
  })

  it('logs out from all brokers with --all and --no-prompt', async () => {
    // Arrange
    const brokers: BrokerAuth[] = [
      {
        accessToken: Buffer.from('admin:password1', 'utf8').toString('base64'),
        authType: AuthType.BASIC,
        isDefault: false,
        name: 'broker-1',
        sempEndpoint: 'https://broker1.example.com',
        sempPort: 8080,
      },
      {
        accessToken: Buffer.from('admin:password2', 'utf8').toString('base64'),
        authType: AuthType.BASIC,
        isDefault: false,
        name: 'broker-2',
        sempEndpoint: 'https://broker2.example.com',
        sempPort: 8080,
      },
      {
        accessToken: Buffer.from('admin:password3', 'utf8').toString('base64'),
        authType: AuthType.BASIC,
        isDefault: false,
        name: 'broker-3',
        sempEndpoint: 'https://broker3.example.com',
        sempPort: 8080,
      },
    ]
    mockBrokerAuthManager.getAllBrokers.resolves(brokers)

    // Act
    const {stdout} = await runCommand('broker:logout --all --no-prompt')

    // Assert
    expect(mockBrokerAuthManager.removeBroker.callCount).to.equal(3)
    expect(mockBrokerAuthManager.removeBroker.calledWith('broker-1')).to.be.true
    expect(mockBrokerAuthManager.removeBroker.calledWith('broker-2')).to.be.true
    expect(mockBrokerAuthManager.removeBroker.calledWith('broker-3')).to.be.true
    expect(stdout).to.contain('Successfully logged out from: broker-1')
    expect(stdout).to.contain('Successfully logged out from: broker-2')
    expect(stdout).to.contain('Successfully logged out from: broker-3')
  })

  it('displays message when no brokers exist', async () => {
    // Arrange
    mockBrokerAuthManager.getAllBrokers.resolves([])

    // Act
    const {stdout} = await runCommand('broker:logout --no-prompt')

    // Assert
    expect(mockBrokerAuthManager.getAllBrokers.calledOnce).to.be.true
    expect(stdout).to.contain('No brokers found')
    expect(stdout).to.contain("Run 'sc broker:login:basic' to authenticate")
    expect(mockBrokerAuthManager.removeBroker.called).to.be.false
  })

  it('throws error when --broker-name specifies non-existent broker', async () => {
    // Arrange
    const brokers: BrokerAuth[] = [
      {
        accessToken: Buffer.from('admin:password123', 'utf8').toString('base64'),
        authType: AuthType.BASIC,
        isDefault: false,
        name: 'existing-broker',
        sempEndpoint: 'https://localhost',
        sempPort: 8080,
      },
    ]
    mockBrokerAuthManager.getAllBrokers.resolves(brokers)

    // Act
    const result = await runCommand('broker:logout --broker-name=nonexistent --no-prompt')

    // Assert
    expect(result.error).to.exist
    if (result.error) {
      expect(result.error.message).to.contain("Broker 'nonexistent' not found")
      expect(result.error.message).to.contain("Run 'sc broker:login:list' to see available brokers")
    }

    expect(mockBrokerAuthManager.removeBroker.called).to.be.false
  })

  it('returns correct JSON structure with --json flag', async () => {
    // Arrange
    const brokers: BrokerAuth[] = [
      {
        accessToken: Buffer.from('admin:password1', 'utf8').toString('base64'),
        authType: AuthType.BASIC,
        isDefault: false,
        name: 'broker-1',
        sempEndpoint: 'https://broker1.example.com',
        sempPort: 8080,
      },
      {
        accessToken: Buffer.from('admin:password2', 'utf8').toString('base64'),
        authType: AuthType.BASIC,
        isDefault: false,
        name: 'broker-2',
        sempEndpoint: 'https://broker2.example.com',
        sempPort: 8080,
      },
    ]
    mockBrokerAuthManager.getAllBrokers.resolves(brokers)

    // Act
    const result = await runCommand<{count: number; loggedOut: string[]}>(
      'broker:logout --all --no-prompt --json',
    )

    // Assert
    expect(result.result).to.exist
    if (result.result) {
      expect(result.result.count).to.equal(2)
      expect(result.result.loggedOut).to.be.an('array')
      expect(result.result.loggedOut).to.have.lengthOf(2)
      expect(result.result.loggedOut).to.include('broker-1')
      expect(result.result.loggedOut).to.include('broker-2')
    }
  })
})
