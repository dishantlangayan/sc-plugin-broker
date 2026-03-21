import {
  AuthType,
  BrokerAuth,
  BrokerAuthError,
  BrokerAuthErrorCode,
  BrokerAuthManager,
  ScCommand,
} from '@dishantlangayan/sc-cli-core'
import {Flags} from '@oclif/core'
import * as process from 'node:process'
import * as readline from 'node:readline'

export default class BrokerLoginBasic extends ScCommand<typeof BrokerLoginBasic> {
  static override args = {}
  static override description = `Login to a Solace Event Broker using Basic authentication.

Stores broker credentials securely using encrypted local storage.
Credentials are base64-encoded and encrypted before storage.

You can provide either --broker-name or --broker-id as the identifier.
If a broker with the same name already exists, you'll be prompted to overwrite.

Required SEMP permissions: Varies by operations you intend to perform`
  static override examples = [
    '<%= config.bin %> <%= command.id %> --broker-name=dev-broker --semp-url=https://localhost --semp-port=8080',
    '<%= config.bin %> <%= command.id %> --broker-id=prod --semp-url=https://broker.example.com --semp-port=943',
    '<%= config.bin %> <%= command.id %> --broker-name=ci-broker --semp-url=http://192.168.1.100 --semp-port=8080 --no-prompt',
    '<%= config.bin %> <%= command.id %> --broker-name=default-broker --semp-url=https://broker.example.com --semp-port=943 --set-default',
  ]
  static override flags = {
    'broker-id': Flags.string({
      char: 'i',
      description: 'Alternative identifier for the broker (alias for broker-name)',
      exclusive: ['broker-name'],
    }),
    'broker-name': Flags.string({
      char: 'b',
      description: 'Name/identifier for the broker',
      exclusive: ['broker-id'],
    }),
    'no-prompt': Flags.boolean({
      default: false,
      description: 'Read credentials from SC_SEMP_USERNAME and SC_SEMP_PASSWORD environment variables',
    }),
    'semp-port': Flags.integer({
      char: 'p',
      description: 'SEMP port number (1-65535)',
      required: true,
    }),
    'semp-url': Flags.string({
      char: 'u',
      description: 'SEMP endpoint URL (must start with http:// or https://)',
      required: true,
    }),
    'set-default': Flags.boolean({
      char: 'd',
      default: false,
      description: 'Set this broker as the default',
    }),
  }

  public async run(): Promise<BrokerAuth> {
    const {flags} = await this.parse(BrokerLoginBasic)

    try {
      // Get broker auth manager
      const brokerAuthManager: BrokerAuthManager = await this.getBrokerAuthManager()

      // Validate inputs and get broker name
      this.validateInputs(flags)
      const brokerName = flags['broker-name'] ?? flags['broker-id']!

      // Handle existing broker
      const isUpdate = await this.handleExistingBroker(brokerAuthManager, brokerName, flags['no-prompt'])

      // Obtain credentials
      const {password, username} = await this.obtainCredentials(flags['no-prompt'])

      // Encode credentials and create broker config
      const accessToken = this.encodeBasicAuth(username, password)
      const brokerAuth = this.createBrokerAuth(flags, brokerName, accessToken)

      // Store broker configuration
      await (isUpdate ? brokerAuthManager.updateBroker(brokerName, brokerAuth) : brokerAuthManager.addBroker(brokerAuth))

      // Set as default if requested
      if (flags['set-default']) {
        await brokerAuthManager.setDefaultBroker(brokerName)
      }

      // Display success message
      this.displaySuccessMessage(isUpdate, brokerName, flags['set-default'])

      return brokerAuth
    } catch (error) {
      this.handleLoginError(error)
    }
  }

  /**
   * Creates broker authentication configuration object
   */
  private createBrokerAuth(
    flags: {
      'semp-port': number
      'semp-url': string
    },
    brokerName: string,
    accessToken: string,
  ): BrokerAuth {
    return {
      accessToken,
      authType: AuthType.BASIC,
      name: brokerName,
      sempEndpoint: flags['semp-url'],
      sempPort: flags['semp-port'],
    }
  }

  /**
   * Displays success message after login
   */
  private displaySuccessMessage(isUpdate: boolean, brokerName: string, setDefault?: boolean): void {
    const action = isUpdate ? 'updated' : 'logged in to'
    this.log(`Successfully ${action} broker '${brokerName}'`)

    if (setDefault) {
      this.log('Set as default broker.')
    }
  }

  /**
   * Encodes username and password to base64 for basic authentication
   */
  private encodeBasicAuth(username: string, password: string): string {
    const credentials = `${username}:${password}`
    return Buffer.from(credentials, 'utf8').toString('base64')
  }

  /**
   * Checks if broker exists and handles overwrite confirmation
   */
  private async handleExistingBroker(
    brokerAuthManager: BrokerAuthManager,
    brokerName: string,
    noPrompt: boolean,
  ): Promise<boolean> {
    const exists = await brokerAuthManager.brokerExists(brokerName)
    if (!exists) {
      return false
    }

    // If no-prompt, assume yes to overwrite
    if (noPrompt) {
      return true
    }

    const shouldOverwrite = await this.promptForConfirmation(
      `Broker '${brokerName}' already exists. Do you want to overwrite the credentials?`,
    )

    if (!shouldOverwrite) {
      this.log('Login cancelled.')
      this.exit(0)
    }

    return true
  }

  /**
   * Handles errors during login process
   */
  private handleLoginError(error: unknown): never {
    if (error instanceof BrokerAuthError) {
      switch (error.code) {
        case BrokerAuthErrorCode.FILE_WRITE_ERROR: {
          this.error('Failed to save broker configuration. Please check file permissions.')
          break
        }

        case BrokerAuthErrorCode.INVALID_ACCESS_TOKEN: {
          this.error('Failed to encode credentials. Please check your username and password.')
          break
        }

        case BrokerAuthErrorCode.INVALID_ENDPOINT: {
          this.error('Invalid SEMP endpoint URL format. URL must start with http:// or https://')
          break
        }

        case BrokerAuthErrorCode.INVALID_NAME: {
          this.error('Invalid broker name. Please provide a valid broker name.')
          break
        }

        case BrokerAuthErrorCode.INVALID_PORT: {
          this.error('Invalid port number. Port must be between 1 and 65535.')
          break
        }

        case BrokerAuthErrorCode.NOT_INITIALIZED: {
          this.error('Failed to initialize broker authentication manager.')
          break
        }

        default: {
          this.error(`Login failed: ${error.message}`)
          break
        }
      }
    }

    if (error instanceof Error && error.message === 'Cancelled by user') {
      this.error('Login cancelled.')
    }

    // Re-throw unexpected errors
    throw error
  }

  /**
   * Obtains credentials from environment variables or user prompts
   */
  private async obtainCredentials(noPrompt: boolean): Promise<{password: string; username: string}> {
    if (noPrompt) {
      const username = process.env.SC_SEMP_USERNAME || ''
      const password = process.env.SC_SEMP_PASSWORD || ''

      if (!username || !password) {
        this.error(
          'SC_SEMP_USERNAME and SC_SEMP_PASSWORD environment variables must be set when using --no-prompt flag.',
        )
      }

      return {password, username}
    }

    const username = await this.promptForUsername()
    const password = await this.promptForPassword()

    return {password, username}
  }

  /**
   * Prompts user for confirmation with Y/n (default Yes)
   */
  private async promptForConfirmation(message: string): Promise<boolean> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    return new Promise((resolve) => {
      rl.question(`${message} (Y/n): `, (answer) => {
        rl.close()
        const normalized = answer.trim().toLowerCase()
        // Default to yes if empty, accept y/yes as confirmation
        const confirmed = normalized === '' || normalized === 'y' || normalized === 'yes'
        resolve(confirmed)
      })
    })
  }

  /**
   * Prompts user for password with hidden input
   */
  private async promptForPassword(): Promise<string> {
    return new Promise((resolve, reject) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      })

      process.stdout.write('SEMP Password: ')

      let password = ''
      const {stdin} = process

      // Hide input by setting raw mode
      if (stdin.isTTY) {
        stdin.setRawMode(true)
      }

      const onData = (char: Buffer) => {
        const charStr = char.toString()

        // Enter key
        if (charStr === '\n' || charStr === '\r' || charStr === '\r\n') {
          process.stdout.write('\n')
          if (stdin.isTTY) {
            stdin.setRawMode(false)
          }

          stdin.removeListener('data', onData)
          rl.close()

          if (!password) {
            reject(new Error('Password cannot be empty'))
            return
          }

          resolve(password)
          return
        }

        // Ctrl+C
        if (charStr === '\u0003') {
          process.stdout.write('\n')
          if (stdin.isTTY) {
            stdin.setRawMode(false)
          }

          stdin.removeListener('data', onData)
          rl.close()
          reject(new Error('Cancelled by user'))
          return
        }

        // Backspace/Delete
        if (charStr === '\u007F' || charStr === '\b') {
          if (password.length > 0) {
            password = password.slice(0, -1)
          }

          return
        }

        // Printable characters only
        if (charStr >= ' ') {
          password += charStr
        }
      }

      stdin.on('data', onData)
    })
  }

  /**
   * Prompts user for username
   */
  private async promptForUsername(): Promise<string> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    return new Promise((resolve, reject) => {
      rl.question('SEMP Username: ', (answer) => {
        rl.close()
        const username = answer.trim()

        if (!username) {
          reject(new Error('Username cannot be empty'))
          return
        }

        resolve(username)
      })
    })
  }

  /**
   * Validates command inputs
   */
  private validateInputs(flags: {
    'broker-id'?: string
    'broker-name'?: string
    'semp-port': number
    'semp-url': string
  }): void {
    // Ensure at least one of broker-name or broker-id is provided
    if (!flags['broker-name'] && !flags['broker-id']) {
      this.error('Either --broker-name or --broker-id must be provided.')
    }

    // Validate SEMP URL format
    const sempUrl = flags['semp-url']
    if (!sempUrl.startsWith('http://') && !sempUrl.startsWith('https://')) {
      this.error('SEMP URL must start with http:// or https://')
    }

    // Validate port range
    const port = flags['semp-port']
    if (port < 1 || port > 65_535) {
      this.error('SEMP port must be between 1 and 65535.')
    }
  }
}
