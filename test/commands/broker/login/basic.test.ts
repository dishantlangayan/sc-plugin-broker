import type {Config} from '@oclif/core'

import {AuthType, type BrokerAuth} from '@dishantlangayan/sc-cli-core'

import BrokerLoginBasic from '../../../../src/commands/broker/login/basic.js'
import {
  createMockConfig,
  createSandbox,
  expect,
  type SinonSandbox,
  type SinonStub,
} from '../../../helpers/index.js'

describe('broker:login:basic', () => {
  let sandbox: SinonSandbox
  let mockBrokerAuthManager: {
    addBroker: SinonStub
    brokerExists: SinonStub
    setDefaultBroker: SinonStub
    updateBroker: SinonStub
  }
  let mockConfig: Config

  beforeEach(() => {
    sandbox = createSandbox()

    // Mock BrokerAuthManager
    mockBrokerAuthManager = {
      addBroker: sandbox.stub().resolves(),
      brokerExists: sandbox.stub().resolves(false),
      setDefaultBroker: sandbox.stub().resolves(),
      updateBroker: sandbox.stub().resolves(),
    }

    mockConfig = createMockConfig(sandbox)
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('successful login scenarios', () => {
    it('should login with broker-name using interactive prompts', async () => {
      // Setup
      const command = new BrokerLoginBasic(
        ['--broker-name=test-broker', '--semp-url=https://localhost', '--semp-port=8080'],
        mockConfig,
      )

      // Mock getBrokerAuthManager to return our mock
      sandbox.stub(command as unknown as {getBrokerAuthManager: () => unknown}, 'getBrokerAuthManager').resolves(mockBrokerAuthManager)

      // Mock prompts
      const promptForUsernameStub = sandbox.stub(command as unknown as {promptForUsername: () => unknown}, 'promptForUsername').resolves('admin')
      const promptForPasswordStub = sandbox.stub(command as unknown as {promptForPassword: () => unknown}, 'promptForPassword').resolves('secret')

      // Execute
      const result = await command.run()

      // Verify
      expect(mockBrokerAuthManager.brokerExists.calledOnceWith('test-broker')).to.be.true
      expect(promptForUsernameStub.calledOnce).to.be.true
      expect(promptForPasswordStub.calledOnce).to.be.true
      expect(mockBrokerAuthManager.addBroker.calledOnce).to.be.true

      const brokerAuth = mockBrokerAuthManager.addBroker.firstCall.args[0] as BrokerAuth
      expect(brokerAuth.name).to.equal('test-broker')
      expect(brokerAuth.sempEndpoint).to.equal('https://localhost')
      expect(brokerAuth.sempPort).to.equal(8080)
      expect(brokerAuth.authType).to.equal(AuthType.BASIC)
      expect(brokerAuth.accessToken).to.equal(Buffer.from('admin:secret', 'utf8').toString('base64'))
      expect(result).to.deep.equal(brokerAuth)
    })

    it('should login with --no-prompt using environment variables', async () => {
      // Set environment variables
      process.env.SC_SEMP_USERNAME = 'env-user'
      process.env.SC_SEMP_PASSWORD = 'env-pass'

      const command = new BrokerLoginBasic(
        ['--broker-name=ci-broker', '--semp-url=http://192.168.1.100', '--semp-port=8080', '--no-prompt'],
        mockConfig,
      )

      sandbox.stub(command as unknown as {getBrokerAuthManager: () => unknown}, 'getBrokerAuthManager').resolves(mockBrokerAuthManager)

      await command.run()

      expect(mockBrokerAuthManager.addBroker.calledOnce).to.be.true

      const brokerAuth = mockBrokerAuthManager.addBroker.firstCall.args[0] as BrokerAuth
      expect(brokerAuth.name).to.equal('ci-broker')
      expect(brokerAuth.accessToken).to.equal(Buffer.from('env-user:env-pass', 'utf8').toString('base64'))

      // Cleanup
      delete process.env.SC_SEMP_USERNAME
      delete process.env.SC_SEMP_PASSWORD
    })

    it('should set broker as default when --set-default flag is used', async () => {
      const command = new BrokerLoginBasic(
        ['--broker-name=default-broker', '--semp-url=https://localhost', '--semp-port=8080', '--set-default'],
        mockConfig,
      )

      sandbox.stub(command as unknown as {getBrokerAuthManager: () => unknown}, 'getBrokerAuthManager').resolves(mockBrokerAuthManager)
      sandbox.stub(command as unknown as {promptForUsername: () => unknown}, 'promptForUsername').resolves('admin')
      sandbox.stub(command as unknown as {promptForPassword: () => unknown}, 'promptForPassword').resolves('secret')

      const logStub = sandbox.stub(command, 'log')

      await command.run()

      expect(mockBrokerAuthManager.setDefaultBroker.calledOnceWith('default-broker')).to.be.true
      expect(logStub.calledWith('Set as default broker.')).to.be.true
    })

    it('should not set default when flag is omitted', async () => {
      const command = new BrokerLoginBasic(
        ['--broker-name=test-broker', '--semp-url=https://localhost', '--semp-port=8080'],
        mockConfig,
      )

      sandbox.stub(command as unknown as {getBrokerAuthManager: () => unknown}, 'getBrokerAuthManager').resolves(mockBrokerAuthManager)
      sandbox.stub(command as unknown as {promptForUsername: () => unknown}, 'promptForUsername').resolves('admin')
      sandbox.stub(command as unknown as {promptForPassword: () => unknown}, 'promptForPassword').resolves('secret')

      await command.run()

      expect(mockBrokerAuthManager.setDefaultBroker.called).to.be.false
    })
  })

  describe('overwrite scenarios', () => {
    it('should update existing broker when user confirms overwrite', async () => {
      mockBrokerAuthManager.brokerExists.resolves(true)

      const command = new BrokerLoginBasic(
        ['--broker-name=existing-broker', '--semp-url=https://localhost', '--semp-port=8080'],
        mockConfig,
      )

      sandbox.stub(command as unknown as {getBrokerAuthManager: () => unknown}, 'getBrokerAuthManager').resolves(mockBrokerAuthManager)
      sandbox.stub(command as unknown as {promptForUsername: () => unknown}, 'promptForUsername').resolves('admin')
      sandbox.stub(command as unknown as {promptForPassword: () => unknown}, 'promptForPassword').resolves('newpass')
      sandbox.stub(command as unknown as {promptForConfirmation: () => unknown}, 'promptForConfirmation').resolves(true)

      await command.run()

      expect(mockBrokerAuthManager.brokerExists.calledOnceWith('existing-broker')).to.be.true
      expect(mockBrokerAuthManager.updateBroker.calledOnce).to.be.true
      expect(mockBrokerAuthManager.addBroker.called).to.be.false

      const updateArgs = mockBrokerAuthManager.updateBroker.firstCall.args
      expect(updateArgs[0]).to.equal('existing-broker')
      expect(updateArgs[1].accessToken).to.equal(Buffer.from('admin:newpass', 'utf8').toString('base64'))
    })

    it('should exit when user declines overwrite', async () => {
      mockBrokerAuthManager.brokerExists.resolves(true)

      const command = new BrokerLoginBasic(
        ['--broker-name=existing-broker', '--semp-url=https://localhost', '--semp-port=8080'],
        mockConfig,
      )

      sandbox.stub(command as unknown as {getBrokerAuthManager: () => unknown}, 'getBrokerAuthManager').resolves(mockBrokerAuthManager)
      sandbox.stub(command as unknown as {promptForConfirmation: () => unknown}, 'promptForConfirmation').resolves(false)

      const exitStub = sandbox.stub(command as unknown as {exit: (code: number) => void}, 'exit').throws(new Error('EXIT'))
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
      process.env.SC_SEMP_USERNAME = 'user'
      process.env.SC_SEMP_PASSWORD = 'pass'

      const command = new BrokerLoginBasic(
        ['--broker-name=existing-broker', '--semp-url=https://localhost', '--semp-port=8080', '--no-prompt'],
        mockConfig,
      )

      sandbox.stub(command as unknown as {getBrokerAuthManager: () => unknown}, 'getBrokerAuthManager').resolves(mockBrokerAuthManager)

      await command.run()

      expect(mockBrokerAuthManager.updateBroker.calledOnce).to.be.true
      expect(mockBrokerAuthManager.addBroker.called).to.be.false

      delete process.env.SC_SEMP_USERNAME
      delete process.env.SC_SEMP_PASSWORD
    })
  })

  describe('validation errors', () => {
    it('should error when --no-prompt is used without SC_SEMP_USERNAME', async () => {
      delete process.env.SC_SEMP_USERNAME
      delete process.env.SC_SEMP_PASSWORD

      const command = new BrokerLoginBasic(
        ['--broker-name=test', '--semp-url=https://localhost', '--semp-port=8080', '--no-prompt'],
        mockConfig,
      )

      sandbox.stub(command as unknown as {getBrokerAuthManager: () => unknown}, 'getBrokerAuthManager').resolves(mockBrokerAuthManager)
      sandbox.stub(command, 'error').throws(
        new Error('SC_SEMP_USERNAME and SC_SEMP_PASSWORD environment variables must be set'),
      )

      try {
        await command.run()
        expect.fail('Should have thrown error')
      } catch (error) {
        expect((error as Error).message).to.include('SC_SEMP_USERNAME and SC_SEMP_PASSWORD')
      }
    })

    it('should error when --no-prompt is used without SC_SEMP_PASSWORD', async () => {
      process.env.SC_SEMP_USERNAME = 'user'
      delete process.env.SC_SEMP_PASSWORD

      const command = new BrokerLoginBasic(
        ['--broker-name=test', '--semp-url=https://localhost', '--semp-port=8080', '--no-prompt'],
        mockConfig,
      )

      sandbox.stub(command as unknown as {getBrokerAuthManager: () => unknown}, 'getBrokerAuthManager').resolves(mockBrokerAuthManager)
      sandbox.stub(command, 'error').throws(
        new Error('SC_SEMP_USERNAME and SC_SEMP_PASSWORD environment variables must be set'),
      )

      try {
        await command.run()
        expect.fail('Should have thrown error')
      } catch (error) {
        expect((error as Error).message).to.include('SC_SEMP_USERNAME and SC_SEMP_PASSWORD')
      }

      delete process.env.SC_SEMP_USERNAME
    })
  })

  describe('credential encoding', () => {
    it('should correctly encode credentials to base64', async () => {
      const command = new BrokerLoginBasic(
        ['--broker-name=test', '--semp-url=https://localhost', '--semp-port=8080'],
        mockConfig,
      )

      sandbox.stub(command as unknown as {getBrokerAuthManager: () => unknown}, 'getBrokerAuthManager').resolves(mockBrokerAuthManager)
      sandbox.stub(command as unknown as {promptForUsername: () => unknown}, 'promptForUsername').resolves('testuser')
      sandbox.stub(command as unknown as {promptForPassword: () => unknown}, 'promptForPassword').resolves('testpass123')

      await command.run()

      const brokerAuth = mockBrokerAuthManager.addBroker.firstCall.args[0] as BrokerAuth
      const expectedToken = Buffer.from('testuser:testpass123', 'utf8').toString('base64')
      expect(brokerAuth.accessToken).to.equal(expectedToken)

      // Verify it decodes correctly
      const decoded = Buffer.from(brokerAuth.accessToken, 'base64').toString('utf8')
      expect(decoded).to.equal('testuser:testpass123')
    })
  })
})
