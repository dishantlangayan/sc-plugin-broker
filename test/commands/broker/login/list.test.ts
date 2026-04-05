import type {Config} from '@oclif/core'

import {AuthType, type BrokerAuth} from '@dishantlangayan/sc-cli-core'

import BrokerLoginList from '../../../../src/commands/broker/login/list.js'
import {
  createMockConfig,
  createSandbox,
  expect,
  type SinonSandbox,
  type SinonStub,
} from '../../../helpers/index.js'

describe('broker:login:list', () => {
  let sandbox: SinonSandbox
  let mockBrokerAuthManager: {
    getAllBrokers: SinonStub
  }
  let mockConfig: Config

  beforeEach(() => {
    sandbox = createSandbox()

    // Mock BrokerAuthManager
    mockBrokerAuthManager = {
      getAllBrokers: sandbox.stub().resolves([]),
    }

    mockConfig = createMockConfig(sandbox)
  })

  afterEach(() => {
    sandbox.restore()
  })

  it('lists multiple brokers with table format', async () => {
    // Arrange
    const brokers: BrokerAuth[] = [
      {
        accessToken: 'dXNlcjE6cGFzczE=',
        authType: AuthType.BASIC,
        isDefault: true,
        isSolaceCloud: true,
        name: 'production',
        sempEndpoint: 'https://broker.solace.cloud',
        sempPort: 943,
      },
      {
        accessToken: 'dXNlcjI6cGFzczI=',
        authType: AuthType.BASIC,
        isDefault: false,
        isSolaceCloud: true,
        name: 'dev-broker',
        sempEndpoint: 'https://dev.solace.cloud',
        sempPort: 8080,
      },
      {
        accessToken: 'dXNlcjM6cGFzczM=',
        authType: AuthType.BASIC,
        isDefault: false,
        isSolaceCloud: false,
        name: 'test',
        sempEndpoint: 'http://localhost',
        sempPort: 8080,
      },
    ]
    mockBrokerAuthManager.getAllBrokers.resolves(brokers)

    const command = new BrokerLoginList([], mockConfig)

    sandbox.stub(command as unknown as {getBrokerAuthManager: () => unknown}, 'getBrokerAuthManager').resolves(mockBrokerAuthManager)

    const logStub = sandbox.stub(command, 'log')

    // Act
    await command.run()

    // Assert
    expect(mockBrokerAuthManager.getAllBrokers.calledOnce).to.be.true

    // Get all logged output
    const allOutput = logStub.getCalls().map(call => call.args[0]).join('\n')

    // Check table headers
    expect(allOutput).to.contain('Broker Name')
    expect(allOutput).to.contain('Auth Type')
    expect(allOutput).to.contain('SEMP Endpoint')
    expect(allOutput).to.contain('SEMP Port')
    expect(allOutput).to.contain('Is Default')
    expect(allOutput).to.contain('Solace Cloud')
    // Check broker data
    expect(allOutput).to.contain('production')
    expect(allOutput).to.contain('dev-broker')
    expect(allOutput).to.contain('test')
    expect(allOutput).to.contain('https://broker.solace.cloud')
    expect(allOutput).to.contain('https://dev.solace.cloud')
    expect(allOutput).to.contain('http://localhost')
    expect(allOutput).to.contain('943')
    expect(allOutput).to.contain('8080')
    expect(allOutput).to.contain('Yes')
  })

  it('marks the default broker correctly', async () => {
    // Arrange
    const brokers: BrokerAuth[] = [
      {
        accessToken: 'dXNlcjE6cGFzczE=',
        authType: AuthType.BASIC,
        isDefault: true,
        isSolaceCloud: true,
        name: 'default-broker',
        sempEndpoint: 'https://broker.solace.cloud',
        sempPort: 943,
      },
      {
        accessToken: 'dXNlcjI6cGFzczI=',
        authType: AuthType.BASIC,
        isDefault: false,
        isSolaceCloud: true,
        name: 'other-broker',
        sempEndpoint: 'https://other.solace.cloud',
        sempPort: 8080,
      },
    ]
    mockBrokerAuthManager.getAllBrokers.resolves(brokers)

    const command = new BrokerLoginList([], mockConfig)

    sandbox.stub(command as unknown as {getBrokerAuthManager: () => unknown}, 'getBrokerAuthManager').resolves(mockBrokerAuthManager)

    const logStub = sandbox.stub(command, 'log')

    // Act
    await command.run()

    // Assert
    const allOutput = logStub.getCalls().map(call => call.args[0]).join('\n')

    expect(allOutput).to.contain('default-broker')
    expect(allOutput).to.contain('other-broker')
    expect(allOutput).to.contain('https://broker.solace.cloud')
    expect(allOutput).to.contain('https://other.solace.cloud')
    expect(allOutput).to.contain('Yes')
  })

  it('displays message when no brokers exist', async () => {
    // Arrange
    mockBrokerAuthManager.getAllBrokers.resolves([])

    const command = new BrokerLoginList([], mockConfig)

    sandbox.stub(command as unknown as {getBrokerAuthManager: () => unknown}, 'getBrokerAuthManager').resolves(mockBrokerAuthManager)

    const logStub = sandbox.stub(command, 'log')

    // Act
    await command.run()

    // Assert
    expect(mockBrokerAuthManager.getAllBrokers.calledOnce).to.be.true
    expect(logStub.calledOnce).to.be.true
    expect(logStub.firstCall.args[0]).to.contain('No brokers found')
    expect(logStub.firstCall.args[0]).to.contain("Run 'sc broker:login:basic' to authenticate")
  })

  it('does not display access token in output', async () => {
    // Arrange
    const secretToken = 'super-secret-base64-token-12345'
    const brokers: BrokerAuth[] = [
      {
        accessToken: secretToken,
        authType: AuthType.BASIC,
        isDefault: false,
        isSolaceCloud: true,
        name: 'broker-1',
        sempEndpoint: 'https://broker.solace.cloud',
        sempPort: 943,
      },
    ]
    mockBrokerAuthManager.getAllBrokers.resolves(brokers)

    const command = new BrokerLoginList([], mockConfig)

    sandbox.stub(command as unknown as {getBrokerAuthManager: () => unknown}, 'getBrokerAuthManager').resolves(mockBrokerAuthManager)

    const logStub = sandbox.stub(command, 'log')

    // Act
    await command.run()

    // Assert
    const allOutput = logStub.getCalls().map(call => call.args[0]).join('\n')

    expect(allOutput).to.not.contain(secretToken)
    expect(allOutput).to.not.contain('accessToken')
  })

  it('returns broker data for --json flag', async () => {
    // Arrange
    const brokers: BrokerAuth[] = [
      {
        accessToken: 'dXNlcjE6cGFzczE=',
        authType: AuthType.BASIC,
        isDefault: true,
        isSolaceCloud: true,
        name: 'prod',
        sempEndpoint: 'https://broker.solace.cloud',
        sempPort: 943,
      },
    ]
    mockBrokerAuthManager.getAllBrokers.resolves(brokers)

    const command = new BrokerLoginList([], mockConfig)

    sandbox.stub(command as unknown as {getBrokerAuthManager: () => unknown}, 'getBrokerAuthManager').resolves(mockBrokerAuthManager)

    // Act
    const result = await command.run()

    // Assert
    expect(result).to.exist
    expect(result.data).to.be.an('array')
    expect(result.data).to.have.lengthOf(1)
    expect(result.data[0].name).to.equal('prod')
    expect(result.data[0].authType).to.equal(AuthType.BASIC)
    expect(result.data[0].accessToken).to.equal('dXNlcjE6cGFzczE=')
    expect(result.data[0].isDefault).to.be.true
  })
})
