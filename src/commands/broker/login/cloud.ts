import {
  AuthType,
  type BrokerAuth,
  BrokerAuthError,
  BrokerAuthErrorCode,
  type BrokerAuthManager,
  OrgError,
  OrgErrorCode,
  type OrgManager,
  ScCommand,
  type ScConnection,
} from '@dishantlangayan/sc-cli-core'
import {Flags} from '@oclif/core'
import * as process from 'node:process'
import * as readline from 'node:readline'

import type {
  EventBrokerService,
  GetServiceResponse,
  ListServicesResponse,
} from '../../../types/cloud-api.js'

export default class BrokerLoginCloud extends ScCommand<typeof BrokerLoginCloud> {
  static override args = {}
  static override description = `Login to a Solace Cloud Event Broker using Cloud API credentials.

Retrieves SEMP credentials automatically from Solace Cloud REST API.
Requires prior authentication to Solace Cloud (org:login).

The command will:
1. Look up the broker by name in your Solace Cloud organization
2. Retrieve SEMP endpoint details and credentials from Cloud API
3. Store encrypted broker credentials locally for future use

Required Cloud API permissions: Read access to Event Broker Services`
  static override examples = [
    '<%= config.bin %> <%= command.id %> --broker-name=production-broker',
    '<%= config.bin %> <%= command.id %> --broker-name=dev-broker --set-default',
    '<%= config.bin %> <%= command.id %> --broker-name=staging-broker --org-name=my-org',
    '<%= config.bin %> <%= command.id %> --broker-name=prod --no-prompt',
  ]
  static override flags = {
    'broker-name': Flags.string({
      char: 'b',
      description: 'Name of the broker in Solace Cloud',
      required: true,
    }),
    'no-prompt': Flags.boolean({
      default: false,
      description: 'Skip confirmation prompts for overwriting existing broker',
    }),
    'org-name': Flags.string({
      char: 'o',
      description: 'Solace Cloud organization name (uses default org if not specified)',
    }),
    'set-default': Flags.boolean({
      char: 'd',
      default: false,
      description: 'Set this broker as the default',
    }),
  }

  public async run(): Promise<BrokerAuth> {
    const {flags} = await this.parse(BrokerLoginCloud)

    try {
      // Step 1: Get managers
      const brokerAuthManager: BrokerAuthManager = await this.getBrokerAuthManager()
      const orgManager: OrgManager = await this.getOrgManager()

      // Step 2: Validate Cloud API authentication
      const cloudConnection = await this.getCloudConnection(orgManager, flags['org-name'])

      // Step 3: Handle existing broker
      const brokerName = flags['broker-name']
      const isUpdate = await this.handleExistingBroker(brokerAuthManager, brokerName, flags['no-prompt'])

      // Step 4: Fetch broker details from Cloud API
      this.log(`Fetching broker details for '${brokerName}' from Solace Cloud...`)
      const serviceId = await this.findServiceIdByName(cloudConnection, brokerName)
      const serviceDetails = await this.getServiceDetails(cloudConnection, serviceId)

      // Step 5: Extract SEMP credentials
      const {msgVpnName, password, sempEndpoint, sempPort, username} = this.extractSempDetails(serviceDetails)

      // Step 6: Create broker auth configuration
      const accessToken = this.encodeBasicAuth(username, password)
      const brokerAuth = this.createBrokerAuth({
        accessToken,
        brokerName,
        msgVpnName,
        sempEndpoint,
        sempPort,
      })

      // Step 7: Store broker configuration
      await (isUpdate ? brokerAuthManager.updateBroker(brokerName, brokerAuth) : brokerAuthManager.addBroker(brokerAuth))

      // Step 8: Set as default if requested
      if (flags['set-default']) {
        await brokerAuthManager.setDefaultBroker(brokerName)
      }

      // Step 9: Display success message
      this.displaySuccessMessage(isUpdate, brokerName, flags['set-default'])

      return brokerAuth
    } catch (error) {
      this.handleLoginError(error, flags['broker-name'])
    }
  }

  /**
   * Creates broker authentication configuration object
   */
  private createBrokerAuth(params: {
    accessToken: string
    brokerName: string
    msgVpnName: string
    sempEndpoint: string
    sempPort: number
  }): BrokerAuth {
    return {
      accessToken: params.accessToken,
      authType: AuthType.BASIC,
      isSolaceCloud: true,
      msgVpnName: params.msgVpnName,
      name: params.brokerName,
      sempEndpoint: params.sempEndpoint,
      sempPort: params.sempPort,
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
   * Extract SEMP connection details from service response
   */
  private extractSempDetails(service: EventBrokerService): {
    msgVpnName: string
    password: string
    sempEndpoint: string
    sempPort: number
    username: string
  } {
    // Validate required fields
    if (!service.msgVpnName) {
      this.error('Missing msgVpnName in broker details.', {exit: 1})
    }

    if (!service.defaultManagementHostname) {
      this.error('Missing defaultManagementHostname in broker details.', {exit: 1})
    }

    if (!service.serviceConnectionEndpoints || service.serviceConnectionEndpoints.length === 0) {
      this.error('No service connection endpoints found for this broker.', {exit: 1})
    }

    if (!service.broker?.msgVpns || service.broker.msgVpns.length === 0) {
      this.error('Missing broker message VPN configuration.', {exit: 1})
    }

    const msgVpn = service.broker.msgVpns[0]

    if (!msgVpn.missionControlManagerLoginCredential) {
      this.error('Missing SEMP credentials in broker details.', {exit: 1})
    }

    // Find SEMP TLS port from all service connection endpoints
    let sempPort: number | undefined

    for (const endpoint of service.serviceConnectionEndpoints) {
      if (!endpoint.ports) continue

      const sempPortConfig = endpoint.ports.find((p) => p.protocol === 'serviceManagementTlsListenPort')

      if (sempPortConfig && sempPortConfig.port > 0) {
        sempPort = sempPortConfig.port
        break
      }
    }

    if (!sempPort) {
      this.error('SEMP TLS endpoint not found. Ensure the broker has SEMP over TLS enabled.', {exit: 1})
    }

    // Extract credentials
    const {password, username} = msgVpn.missionControlManagerLoginCredential

    if (!username || !password) {
      this.error('Incomplete SEMP credentials in broker details.', {exit: 1})
    }

    return {
      msgVpnName: service.msgVpnName,
      password,
      sempEndpoint: `https://${service.defaultManagementHostname}`,
      sempPort,
      username,
    }
  }

  /**
   * Find service ID by broker name using Cloud API
   * Uses RSQL filter: name==brokerName
   */
  private async findServiceIdByName(cloudConnection: ScConnection, brokerName: string): Promise<string> {
    try {
      // Use customAttributes with RSQL filter to search by name
      const endpoint = `/missionControl/eventBrokerServices?customAttributes=name==${brokerName}`
      const response = await cloudConnection.get<ListServicesResponse>(endpoint)

      if (!response.data || response.data.length === 0) {
        this.error(
          `Broker '${brokerName}' not found in Solace Cloud. Please check the broker name and try again.`,
          {exit: 1},
        )
      }

      if (response.data.length > 1) {
        this.warn(`Multiple brokers found with name '${brokerName}'. Using the first match.`)
      }

      return response.data[0].id
    } catch (error) {
      if (error instanceof Error && error.message.includes('401')) {
        this.error('Cloud API authentication failed. Please run \'org:login\' again.', {exit: 1})
      }

      if (error instanceof Error && error.message.includes('403')) {
        this.error('Insufficient permissions to access broker information in Solace Cloud.', {exit: 1})
      }

      throw error
    }
  }

  /**
   * Get authenticated Cloud API connection
   * Validates that user is logged in to Solace Cloud
   */
  private async getCloudConnection(orgManager: OrgManager, orgName?: string): Promise<ScConnection> {
    try {
      // If org-name provided, use that org; otherwise use default
      const orgIdentifier = orgName ?? (await orgManager.getDefaultOrg())?.orgId

      if (!orgIdentifier) {
        this.error(
          'No Solace Cloud organization found. Please run \'org:login\' first to authenticate to Solace Cloud.',
          {exit: 1},
        )
      }

      // Create connection using org credentials
      return await orgManager.createConnection(orgIdentifier)
    } catch (error) {
      if (error instanceof OrgError) {
        if (error.code === OrgErrorCode.NOT_INITIALIZED) {
          this.error('Solace Cloud authentication not initialized. Please run \'org:login\' first.', {exit: 1})
        }

        if (error.code === OrgErrorCode.ORG_NOT_FOUND) {
          this.error(`Organization '${orgName}' not found. Please run 'org:login' first.`, {exit: 1})
        }
      }

      throw error
    }
  }

  /**
   * Get detailed service information with expanded fields
   */
  private async getServiceDetails(cloudConnection: ScConnection, serviceId: string): Promise<EventBrokerService> {
    try {
      const endpoint = `/missionControl/eventBrokerServices/${serviceId}?expand=broker,serviceConnectionEndpoints`
      const response = await cloudConnection.get<GetServiceResponse>(endpoint)

      if (!response.data) {
        this.error('Failed to retrieve broker details from Solace Cloud.', {exit: 1})
      }

      return response.data
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        this.error('Broker not found in Solace Cloud.', {exit: 1})
      }

      throw error
    }
  }

  /**
   * Checks if broker exists and handles overwrite confirmation
   * Same pattern as broker:login:basic
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
  private handleLoginError(error: unknown, brokerName: string): never {
    if (error instanceof BrokerAuthError) {
      switch (error.code) {
        case BrokerAuthErrorCode.FILE_WRITE_ERROR: {
          this.error('Failed to save broker configuration. Please check file permissions.')
          break
        }

        case BrokerAuthErrorCode.INVALID_ACCESS_TOKEN: {
          this.error('Failed to encode credentials.')
          break
        }

        case BrokerAuthErrorCode.INVALID_ENDPOINT: {
          this.error('Invalid SEMP endpoint URL format.')
          break
        }

        default: {
          this.error(`Login failed: ${error.message}`)
          break
        }
      }
    }

    if (error instanceof OrgError) {
      switch (error.code) {
        case OrgErrorCode.INVALID_ACCESS_TOKEN: {
          this.error('Cloud API token expired or invalid. Please run \'org:login\' again.')
          break
        }

        case OrgErrorCode.NOT_INITIALIZED: {
          this.error('Solace Cloud authentication not initialized. Please run \'org:login\' first.')
          break
        }

        case OrgErrorCode.ORG_NOT_FOUND: {
          this.error('Solace Cloud organization not found. Please run \'org:login\' first.')
          break
        }

        default: {
          this.error(`Cloud API error: ${error.message}`)
          break
        }
      }
    }

    if (error instanceof Error) {
      // Check for network errors
      if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
        this.error('Failed to connect to Solace Cloud API. Please check your network connection.')
      }

      // Check for Cloud API errors
      if (error.message.includes('404')) {
        this.error(`Broker '${brokerName}' not found in Solace Cloud.`)
      }

      if (error.message.includes('401') || error.message.includes('403')) {
        this.error('Cloud API authentication failed. Please run \'org:login\' again.')
      }
    }

    // Re-throw unexpected errors
    throw error
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
}
