import {AuthType, type BrokerAuth, OrgError, OrgErrorCode} from '@dishantlangayan/sc-cli-core'
import {Config} from '@oclif/core'
import {expect} from 'chai'
import * as sinon from 'sinon'

import type {
  EventBrokerService,
  GetServiceResponse,
  ListServicesResponse,
} from '../../../../src/types/cloud-api.js'

import BrokerLoginCloud from '../../../../src/commands/broker/login/cloud.js'

describe('broker:login:cloud', () => {
  let sandbox: sinon.SinonSandbox
  let mockBrokerAuthManager: {
    addBroker: sinon.SinonStub
    brokerExists: sinon.SinonStub
    setDefaultBroker: sinon.SinonStub
    updateBroker: sinon.SinonStub
  }
  let mockOrgManager: {
    createConnection: sinon.SinonStub
    getDefaultOrg: sinon.SinonStub
  }
  let mockCloudConnection: {
    get: sinon.SinonStub
  }
  let mockConfig: Config

  // Mock service list response
  const mockServiceListResponse: ListServicesResponse = {
    data: [
      {
        defaultManagementHostname: 'mr-abc123.messaging.solace.cloud',
        id: 'service-123',
        msgVpnName: 'test-vpn',
        name: 'test-broker',
      },
    ],
  }

  // Mock service details response with all required fields
  const mockServiceDetailsResponse: GetServiceResponse = {
    data: {
      broker: {
        msgVpns: [
          {
            missionControlManagerLoginCredential: {
              password: 'test-password',
              username: 'test-admin',
            },
            msgVpnName: 'test-vpn',
          },
        ],
      },
      defaultManagementHostname: 'mr-abc123.messaging.solace.cloud',
      id: 'service-123',
      msgVpnName: 'test-vpn',
      name: 'test-broker',
      serviceConnectionEndpoints: [
        {
          id: 'endpoint-1',
          name: 'Default Public',
          ports: [
            {port: 943, protocol: 'serviceManagementTlsListenPort'},
            {port: 55_443, protocol: 'serviceSmfTlsListenPort'},
          ],
        },
      ],
    },
  }

  beforeEach(() => {
    sandbox = sinon.createSandbox()

    // Mock BrokerAuthManager
    mockBrokerAuthManager = {
      addBroker: sandbox.stub().resolves(),
      brokerExists: sandbox.stub().resolves(false),
      setDefaultBroker: sandbox.stub().resolves(),
      updateBroker: sandbox.stub().resolves(),
    }

    // Mock OrgManager
    mockOrgManager = {
      createConnection: sandbox.stub(),
      getDefaultOrg: sandbox.stub().resolves({isDefault: true, orgId: 'test-org'}),
    }

    // Mock Cloud API connection
    mockCloudConnection = {
      get: sandbox.stub(),
    }

    // Default: Cloud API calls succeed
    mockOrgManager.createConnection.resolves(mockCloudConnection)
    mockCloudConnection.get
      .withArgs('/missionControl/eventBrokerServices?customAttributes=name==test-broker')
      .resolves(mockServiceListResponse)
    mockCloudConnection.get
      .withArgs('/missionControl/eventBrokerServices/service-123?expand=broker,serviceConnectionEndpoints')
      .resolves(mockServiceDetailsResponse)

    // Mock oclif config
    mockConfig = {
      bin: 'sc',
      commands: [],
      plugins: new Map(),
      runHook: sandbox.stub().resolves({failures: [], successes: []}),
      version: '0.0.0',
    } as unknown as Config
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('successful login scenarios', () => {
    it('should login with broker-name using default org', async () => {
      // Setup
      const command = new BrokerLoginCloud(['--broker-name=test-broker'], mockConfig)

      // Mock managers
      sandbox
        .stub(command as unknown as {getBrokerAuthManager: () => unknown}, 'getBrokerAuthManager')
        .resolves(mockBrokerAuthManager)
      sandbox.stub(command as unknown as {getOrgManager: () => unknown}, 'getOrgManager').resolves(mockOrgManager)

      // Execute
      const result = await command.run()

      // Verify Cloud API calls
      expect(mockOrgManager.getDefaultOrg.calledOnce).to.be.true
      expect(mockOrgManager.createConnection.calledOnceWith('test-org')).to.be.true
      expect(
        mockCloudConnection.get.calledWith('/missionControl/eventBrokerServices?customAttributes=name==test-broker'),
      ).to.be.true
      expect(
        mockCloudConnection.get.calledWith(
          '/missionControl/eventBrokerServices/service-123?expand=broker,serviceConnectionEndpoints',
        ),
      ).to.be.true

      // Verify broker auth created correctly
      expect(mockBrokerAuthManager.addBroker.calledOnce).to.be.true
      const brokerAuth = mockBrokerAuthManager.addBroker.firstCall.args[0] as BrokerAuth
      expect(brokerAuth.name).to.equal('test-broker')
      expect(brokerAuth.sempEndpoint).to.equal('https://mr-abc123.messaging.solace.cloud')
      expect(brokerAuth.sempPort).to.equal(943)
      expect(brokerAuth.authType).to.equal(AuthType.BASIC)
      expect(brokerAuth.msgVpnName).to.equal('test-vpn')
      expect(brokerAuth.isSolaceCloud).to.be.true
      expect(brokerAuth.accessToken).to.equal(Buffer.from('test-admin:test-password', 'utf8').toString('base64'))
      expect(result).to.deep.equal(brokerAuth)
    })

    it('should login with broker-name and org-name specified', async () => {
      const command = new BrokerLoginCloud(['--broker-name=test-broker', '--org-name=my-org'], mockConfig)

      sandbox
        .stub(command as unknown as {getBrokerAuthManager: () => unknown}, 'getBrokerAuthManager')
        .resolves(mockBrokerAuthManager)
      sandbox.stub(command as unknown as {getOrgManager: () => unknown}, 'getOrgManager').resolves(mockOrgManager)

      await command.run()

      // Should use specified org, not call getDefaultOrg
      expect(mockOrgManager.getDefaultOrg.called).to.be.false
      expect(mockOrgManager.createConnection.calledOnceWith('my-org')).to.be.true
    })

    it('should set broker as default when --set-default flag is used', async () => {
      const command = new BrokerLoginCloud(['--broker-name=test-broker', '--set-default'], mockConfig)

      sandbox
        .stub(command as unknown as {getBrokerAuthManager: () => unknown}, 'getBrokerAuthManager')
        .resolves(mockBrokerAuthManager)
      sandbox.stub(command as unknown as {getOrgManager: () => unknown}, 'getOrgManager').resolves(mockOrgManager)

      const logStub = sandbox.stub(command, 'log')

      await command.run()

      expect(mockBrokerAuthManager.setDefaultBroker.calledOnceWith('test-broker')).to.be.true
      expect(logStub.calledWith('Set as default broker.')).to.be.true
    })

    it('should not set default when flag is omitted', async () => {
      const command = new BrokerLoginCloud(['--broker-name=test-broker'], mockConfig)

      sandbox
        .stub(command as unknown as {getBrokerAuthManager: () => unknown}, 'getBrokerAuthManager')
        .resolves(mockBrokerAuthManager)
      sandbox.stub(command as unknown as {getOrgManager: () => unknown}, 'getOrgManager').resolves(mockOrgManager)

      await command.run()

      expect(mockBrokerAuthManager.setDefaultBroker.called).to.be.false
    })
  })

  describe('overwrite scenarios', () => {
    it('should update existing broker when user confirms overwrite', async () => {
      mockBrokerAuthManager.brokerExists.resolves(true)

      const command = new BrokerLoginCloud(['--broker-name=existing-broker'], mockConfig)

      sandbox
        .stub(command as unknown as {getBrokerAuthManager: () => unknown}, 'getBrokerAuthManager')
        .resolves(mockBrokerAuthManager)
      sandbox.stub(command as unknown as {getOrgManager: () => unknown}, 'getOrgManager').resolves(mockOrgManager)
      sandbox.stub(command as unknown as {promptForConfirmation: () => unknown}, 'promptForConfirmation').resolves(true)

      // Update mock responses for existing-broker
      mockCloudConnection.get
        .withArgs('/missionControl/eventBrokerServices?customAttributes=name==existing-broker')
        .resolves({
          data: [{...mockServiceListResponse.data[0], name: 'existing-broker'}],
        })

      await command.run()

      expect(mockBrokerAuthManager.brokerExists.calledOnceWith('existing-broker')).to.be.true
      expect(mockBrokerAuthManager.updateBroker.calledOnce).to.be.true
      expect(mockBrokerAuthManager.addBroker.called).to.be.false

      const updateArgs = mockBrokerAuthManager.updateBroker.firstCall.args
      expect(updateArgs[0]).to.equal('existing-broker')
    })

    it('should exit when user declines overwrite', async () => {
      mockBrokerAuthManager.brokerExists.resolves(true)

      const command = new BrokerLoginCloud(['--broker-name=existing-broker'], mockConfig)

      sandbox
        .stub(command as unknown as {getBrokerAuthManager: () => unknown}, 'getBrokerAuthManager')
        .resolves(mockBrokerAuthManager)
      sandbox.stub(command as unknown as {getOrgManager: () => unknown}, 'getOrgManager').resolves(mockOrgManager)
      sandbox
        .stub(command as unknown as {promptForConfirmation: () => unknown}, 'promptForConfirmation')
        .resolves(false)

      const exitStub = sandbox
        .stub(command as unknown as {exit: (code: number) => void}, 'exit')
        .throws(new Error('EXIT'))
      const logStub = sandbox.stub(command, 'log')

      try {
        await command.run()
        expect.fail('Should have exited')
      } catch (error) {
        expect((error as Error).message).to.equal('EXIT')
      }

      expect(logStub.calledWith('Login cancelled.')).to.be.true
      expect(exitStub.calledOnceWith(0)).to.be.true
      expect(mockBrokerAuthManager.addBroker.called).to.be.false
      expect(mockBrokerAuthManager.updateBroker.called).to.be.false
    })

    it('should auto-overwrite with --no-prompt flag', async () => {
      mockBrokerAuthManager.brokerExists.resolves(true)

      const command = new BrokerLoginCloud(['--broker-name=existing-broker', '--no-prompt'], mockConfig)

      sandbox
        .stub(command as unknown as {getBrokerAuthManager: () => unknown}, 'getBrokerAuthManager')
        .resolves(mockBrokerAuthManager)
      sandbox.stub(command as unknown as {getOrgManager: () => unknown}, 'getOrgManager').resolves(mockOrgManager)

      // Update mock responses for existing-broker
      mockCloudConnection.get
        .withArgs('/missionControl/eventBrokerServices?customAttributes=name==existing-broker')
        .resolves({
          data: [{...mockServiceListResponse.data[0], name: 'existing-broker'}],
        })

      await command.run()

      expect(mockBrokerAuthManager.updateBroker.calledOnce).to.be.true
      expect(mockBrokerAuthManager.addBroker.called).to.be.false
    })
  })

  describe('Cloud API errors', () => {
    it('should error when no org is configured', async () => {
      mockOrgManager.getDefaultOrg.resolves(null)

      const command = new BrokerLoginCloud(['--broker-name=test-broker'], mockConfig)

      sandbox
        .stub(command as unknown as {getBrokerAuthManager: () => unknown}, 'getBrokerAuthManager')
        .resolves(mockBrokerAuthManager)
      sandbox.stub(command as unknown as {getOrgManager: () => unknown}, 'getOrgManager').resolves(mockOrgManager)

      const errorStub = sandbox.stub(command, 'error').throws(new Error('No org configured'))

      try {
        await command.run()
        expect.fail('Should have thrown error')
      } catch (error) {
        expect((error as Error).message).to.include('No org configured')
      }

      expect(errorStub.calledOnce).to.be.true
      expect(errorStub.firstCall.args[0]).to.include('No Solace Cloud organization found')
    })

    it('should error when org is not found', async () => {
      mockOrgManager.createConnection.rejects(new OrgError('Org not found', OrgErrorCode.ORG_NOT_FOUND))

      const command = new BrokerLoginCloud(['--broker-name=test-broker', '--org-name=missing-org'], mockConfig)

      sandbox
        .stub(command as unknown as {getBrokerAuthManager: () => unknown}, 'getBrokerAuthManager')
        .resolves(mockBrokerAuthManager)
      sandbox.stub(command as unknown as {getOrgManager: () => unknown}, 'getOrgManager').resolves(mockOrgManager)

      const errorStub = sandbox.stub(command, 'error').throws(new Error('Org not found'))

      try {
        await command.run()
        expect.fail('Should have thrown error')
      } catch (error) {
        expect((error as Error).message).to.include('Org not found')
      }

      expect(errorStub.calledOnce).to.be.true
      expect(errorStub.firstCall.args[0]).to.include('missing-org')
    })

    it('should error when broker is not found in Cloud API', async () => {
      mockCloudConnection.get
        .withArgs('/missionControl/eventBrokerServices?customAttributes=name==missing-broker')
        .resolves({data: []})

      const command = new BrokerLoginCloud(['--broker-name=missing-broker'], mockConfig)

      sandbox
        .stub(command as unknown as {getBrokerAuthManager: () => unknown}, 'getBrokerAuthManager')
        .resolves(mockBrokerAuthManager)
      sandbox.stub(command as unknown as {getOrgManager: () => unknown}, 'getOrgManager').resolves(mockOrgManager)

      const errorStub = sandbox.stub(command, 'error').throws(new Error('Broker not found'))

      try {
        await command.run()
        expect.fail('Should have thrown error')
      } catch (error) {
        expect((error as Error).message).to.include('Broker not found')
      }

      expect(errorStub.firstCall.args[0]).to.include('missing-broker')
      expect(errorStub.firstCall.args[0]).to.include('not found in Solace Cloud')
    })

    it('should warn when multiple brokers with same name exist', async () => {
      const multipleServicesResponse: ListServicesResponse = {
        data: [
          {...mockServiceListResponse.data[0]},
          {...mockServiceListResponse.data[0], id: 'service-456'},
        ],
      }

      mockCloudConnection.get
        .withArgs('/missionControl/eventBrokerServices?customAttributes=name==test-broker')
        .resolves(multipleServicesResponse)

      const command = new BrokerLoginCloud(['--broker-name=test-broker'], mockConfig)

      sandbox
        .stub(command as unknown as {getBrokerAuthManager: () => unknown}, 'getBrokerAuthManager')
        .resolves(mockBrokerAuthManager)
      sandbox.stub(command as unknown as {getOrgManager: () => unknown}, 'getOrgManager').resolves(mockOrgManager)

      const warnStub = sandbox.stub(command, 'warn')

      await command.run()

      expect(warnStub.calledOnce).to.be.true
      expect(warnStub.firstCall.args[0]).to.include('Multiple brokers found')
    })
  })

  describe('data extraction errors', () => {
    it('should error when msgVpnName is missing', async () => {
      const invalidResponse: GetServiceResponse = {
        data: {...mockServiceDetailsResponse.data, msgVpnName: ''} as EventBrokerService,
      }

      mockCloudConnection.get
        .withArgs('/missionControl/eventBrokerServices/service-123?expand=broker,serviceConnectionEndpoints')
        .resolves(invalidResponse)

      const command = new BrokerLoginCloud(['--broker-name=test-broker'], mockConfig)

      sandbox
        .stub(command as unknown as {getBrokerAuthManager: () => unknown}, 'getBrokerAuthManager')
        .resolves(mockBrokerAuthManager)
      sandbox.stub(command as unknown as {getOrgManager: () => unknown}, 'getOrgManager').resolves(mockOrgManager)

      const errorStub = sandbox.stub(command, 'error').throws(new Error('Missing msgVpnName'))

      try {
        await command.run()
        expect.fail('Should have thrown error')
      } catch (error) {
        expect((error as Error).message).to.include('Missing msgVpnName')
      }

      expect(errorStub.firstCall.args[0]).to.include('Missing msgVpnName')
    })

    it('should error when defaultManagementHostname is missing', async () => {
      const invalidResponse: GetServiceResponse = {
        data: {...mockServiceDetailsResponse.data, defaultManagementHostname: ''} as EventBrokerService,
      }

      mockCloudConnection.get
        .withArgs('/missionControl/eventBrokerServices/service-123?expand=broker,serviceConnectionEndpoints')
        .resolves(invalidResponse)

      const command = new BrokerLoginCloud(['--broker-name=test-broker'], mockConfig)

      sandbox
        .stub(command as unknown as {getBrokerAuthManager: () => unknown}, 'getBrokerAuthManager')
        .resolves(mockBrokerAuthManager)
      sandbox.stub(command as unknown as {getOrgManager: () => unknown}, 'getOrgManager').resolves(mockOrgManager)

      const errorStub = sandbox.stub(command, 'error').throws(new Error('Missing hostname'))

      try {
        await command.run()
        expect.fail('Should have thrown error')
      } catch (error) {
        expect((error as Error).message).to.include('Missing hostname')
      }

      expect(errorStub.firstCall.args[0]).to.include('Missing defaultManagementHostname')
    })

    it('should error when serviceConnectionEndpoints is missing', async () => {
      const invalidResponse: GetServiceResponse = {
        data: {...mockServiceDetailsResponse.data, serviceConnectionEndpoints: undefined} as EventBrokerService,
      }

      mockCloudConnection.get
        .withArgs('/missionControl/eventBrokerServices/service-123?expand=broker,serviceConnectionEndpoints')
        .resolves(invalidResponse)

      const command = new BrokerLoginCloud(['--broker-name=test-broker'], mockConfig)

      sandbox
        .stub(command as unknown as {getBrokerAuthManager: () => unknown}, 'getBrokerAuthManager')
        .resolves(mockBrokerAuthManager)
      sandbox.stub(command as unknown as {getOrgManager: () => unknown}, 'getOrgManager').resolves(mockOrgManager)

      const errorStub = sandbox.stub(command, 'error').throws(new Error('No endpoints'))

      try {
        await command.run()
        expect.fail('Should have thrown error')
      } catch (error) {
        expect((error as Error).message).to.include('No endpoints')
      }

      expect(errorStub.firstCall.args[0]).to.include('No service connection endpoints found')
    })

    it('should error when SEMP TLS endpoint is not found', async () => {
      const invalidResponse: GetServiceResponse = {
        data: {
          ...mockServiceDetailsResponse.data,
          serviceConnectionEndpoints: [
            {
              id: 'endpoint-1',
              name: 'Default Public',
              ports: [{port: 55_443, protocol: 'serviceSmfTlsListenPort'}],
            },
          ],
        },
      }

      mockCloudConnection.get
        .withArgs('/missionControl/eventBrokerServices/service-123?expand=broker,serviceConnectionEndpoints')
        .resolves(invalidResponse)

      const command = new BrokerLoginCloud(['--broker-name=test-broker'], mockConfig)

      sandbox
        .stub(command as unknown as {getBrokerAuthManager: () => unknown}, 'getBrokerAuthManager')
        .resolves(mockBrokerAuthManager)
      sandbox.stub(command as unknown as {getOrgManager: () => unknown}, 'getOrgManager').resolves(mockOrgManager)

      const errorStub = sandbox.stub(command, 'error').throws(new Error('SEMP TLS endpoint not found'))

      try {
        await command.run()
        expect.fail('Should have thrown error')
      } catch (error) {
        expect((error as Error).message).to.include('SEMP TLS endpoint not found')
      }

      expect(errorStub.firstCall.args[0]).to.include('SEMP TLS endpoint not found')
    })

    it('should error when broker msgVpns configuration is missing', async () => {
      const invalidResponse: GetServiceResponse = {
        data: {
          ...mockServiceDetailsResponse.data,
          broker: {
            msgVpns: undefined,
          },
        },
      }

      mockCloudConnection.get
        .withArgs('/missionControl/eventBrokerServices/service-123?expand=broker,serviceConnectionEndpoints')
        .resolves(invalidResponse)

      const command = new BrokerLoginCloud(['--broker-name=test-broker'], mockConfig)

      sandbox
        .stub(command as unknown as {getBrokerAuthManager: () => unknown}, 'getBrokerAuthManager')
        .resolves(mockBrokerAuthManager)
      sandbox.stub(command as unknown as {getOrgManager: () => unknown}, 'getOrgManager').resolves(mockOrgManager)

      const errorStub = sandbox.stub(command, 'error').throws(new Error('Missing broker VPN configuration'))

      try {
        await command.run()
        expect.fail('Should have thrown error')
      } catch (error) {
        expect((error as Error).message).to.include('Missing broker VPN configuration')
      }

      expect(errorStub.firstCall.args[0]).to.include('Missing broker message VPN configuration')
    })
  })

  describe('credential encoding', () => {
    it('should correctly encode credentials to base64', async () => {
      const command = new BrokerLoginCloud(['--broker-name=test-broker'], mockConfig)

      sandbox
        .stub(command as unknown as {getBrokerAuthManager: () => unknown}, 'getBrokerAuthManager')
        .resolves(mockBrokerAuthManager)
      sandbox.stub(command as unknown as {getOrgManager: () => unknown}, 'getOrgManager').resolves(mockOrgManager)

      await command.run()

      const brokerAuth = mockBrokerAuthManager.addBroker.firstCall.args[0] as BrokerAuth
      const expectedToken = Buffer.from('test-admin:test-password', 'utf8').toString('base64')
      expect(brokerAuth.accessToken).to.equal(expectedToken)

      // Verify it decodes correctly
      const decoded = Buffer.from(brokerAuth.accessToken, 'base64').toString('utf8')
      expect(decoded).to.equal('test-admin:test-password')
    })
  })
})
