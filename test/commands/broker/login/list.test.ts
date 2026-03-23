import {AuthType, BrokerAuth, BrokerAuthManager} from '@dishantlangayan/sc-cli-core'
import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import * as sinon from 'sinon'

import BrokerLoginList from '../../../../src/commands/broker/login/list.js'

describe('broker:login:list', () => {
  let brokerAuthManagerStub: sinon.SinonStubbedInstance<BrokerAuthManager>
  let getBrokerAuthManagerStub: sinon.SinonStub

  beforeEach(() => {
    // Stub BrokerAuthManager
    brokerAuthManagerStub = sinon.createStubInstance(BrokerAuthManager)
    getBrokerAuthManagerStub = sinon.stub(
      BrokerLoginList.prototype as unknown as Record<string, unknown>,
      'getBrokerAuthManager',
    ).resolves(brokerAuthManagerStub)
  })

  afterEach(() => {
    getBrokerAuthManagerStub.restore()
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
    brokerAuthManagerStub.getAllBrokers.resolves(brokers)

    // Act
    const {stdout} = await runCommand('broker:login:list')

    // Assert
    expect(brokerAuthManagerStub.getAllBrokers.calledOnce).to.be.true
    // Check table headers
    expect(stdout).to.contain('Broker Name')
    expect(stdout).to.contain('Auth Type')
    expect(stdout).to.contain('SEMP Endpoint')
    expect(stdout).to.contain('SEMP Port')
    expect(stdout).to.contain('Is Default')
    expect(stdout).to.contain('Solace Cloud')
    // Check broker data
    expect(stdout).to.contain('production')
    expect(stdout).to.contain('dev-broker')
    expect(stdout).to.contain('test')
    expect(stdout).to.contain('https://broker.solace.cloud')
    expect(stdout).to.contain('https://dev.solace.cloud')
    expect(stdout).to.contain('http://localhost')
    expect(stdout).to.contain('943')
    expect(stdout).to.contain('8080')
    expect(stdout).to.contain('Yes')
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
    brokerAuthManagerStub.getAllBrokers.resolves(brokers)

    // Act
    const {stdout} = await runCommand('broker:login:list')

    // Assert
    expect(stdout).to.contain('default-broker')
    expect(stdout).to.contain('other-broker')
    expect(stdout).to.contain('https://broker.solace.cloud')
    expect(stdout).to.contain('https://other.solace.cloud')
    expect(stdout).to.contain('Yes')
  })

  it('displays message when no brokers exist', async () => {
    // Arrange
    brokerAuthManagerStub.getAllBrokers.resolves([])

    // Act
    const {stdout} = await runCommand('broker:login:list')

    // Assert
    expect(brokerAuthManagerStub.getAllBrokers.calledOnce).to.be.true
    expect(stdout).to.contain('No brokers found')
    expect(stdout).to.contain("Run 'sc broker:login:basic' to authenticate")
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
    brokerAuthManagerStub.getAllBrokers.resolves(brokers)

    // Act
    const {stdout} = await runCommand('broker:login:list')

    // Assert
    expect(stdout).to.not.contain(secretToken)
    expect(stdout).to.not.contain('accessToken')
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
    brokerAuthManagerStub.getAllBrokers.resolves(brokers)

    // Act
    const result = await runCommand<{data: BrokerAuth[]}>('broker:login:list --json')

    // Assert
    expect(result.result).to.exist
    if (result.result) {
      expect(result.result.data).to.be.an('array')
      expect(result.result.data).to.have.lengthOf(1)
      expect(result.result.data[0].name).to.equal('prod')
      expect(result.result.data[0].authType).to.equal(AuthType.BASIC)
      expect(result.result.data[0].accessToken).to.equal('dXNlcjE6cGFzczE=')
      expect(result.result.data[0].isDefault).to.be.true
    }
  })
})
