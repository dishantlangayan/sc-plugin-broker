import {BrokerAuth, BrokerAuthManager, ScCommand} from '@dishantlangayan/sc-cli-core'
import {checkbox, confirm} from '@inquirer/prompts'
import {Flags} from '@oclif/core'

export default class BrokerLogout extends ScCommand<typeof BrokerLogout> {
  static override args = {}
  static override description = `Logout from authenticated brokers.

Removes locally stored broker credentials.
Interactive mode allows selection with arrow keys and spacebar.`
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --broker-name=dev-broker',
    '<%= config.bin %> <%= command.id %> --all',
    '<%= config.bin %> <%= command.id %> --broker-name=prod --no-prompt',
  ]
  static override flags = {
    all: Flags.boolean({
      char: 'a',
      default: false,
      description: 'Logout from all brokers',
      exclusive: ['broker-name'],
    }),
    'broker-name': Flags.string({
      char: 'b',
      description: 'Broker name to logout from',
      exclusive: ['all'],
    }),
    'no-prompt': Flags.boolean({
      default: false,
      description: 'Skip confirmation prompt and assume Yes',
    }),
  }

  public async run(): Promise<{count: number; loggedOut: string[]}> {
    const {flags} = await this.parse(BrokerLogout)

    const brokerName = flags['broker-name']

    // Get BrokerAuthManager instance
    const brokerAuthManager: BrokerAuthManager = await this.getBrokerAuthManager()

    // Get all authenticated brokers
    const allBrokers = await brokerAuthManager.getAllBrokers()

    // Handle case when no brokers exist
    if (allBrokers.length === 0) {
      this.log("No brokers found. Run 'sc broker:login:basic' to authenticate.")
      return {count: 0, loggedOut: []}
    }

    // Determine which brokers to logout
    let brokerNamesToLogout: string[] = []

    if (flags.all) {
      // Logout from all brokers
      brokerNamesToLogout = allBrokers.map((broker: BrokerAuth) => broker.name)
    } else if (brokerName) {
      // Logout from specific broker
      const broker = allBrokers.find((b: BrokerAuth) => b.name === brokerName)

      if (!broker) {
        this.error(`Broker '${brokerName}' not found. Run 'sc broker:login:list' to see available brokers.`, {exit: 2})
      }

      brokerNamesToLogout = [broker.name]
    } else {
      // Interactive mode: let user select brokers
      try {
        brokerNamesToLogout = await checkbox({
          choices: allBrokers.map((broker: BrokerAuth) => ({
            name: broker.isDefault ? `${broker.name} (default)` : broker.name,
            value: broker.name,
          })),
          message: 'Select brokers to logout from:',
          required: true,
        })
      } catch {
        // User cancelled the selection (Ctrl+C)
        this.log('Logout cancelled.')
        return {count: 0, loggedOut: []}
      }
    }

    // Confirm logout unless --no-prompt flag is set
    if (!flags['no-prompt']) {
      const count = brokerNamesToLogout.length
      const brokerWord = count === 1 ? 'broker' : 'brokers'

      try {
        const shouldProceed = await confirm({
          default: true,
          message: `Are you sure you want to logout from ${count} ${brokerWord}?`,
        })

        if (!shouldProceed) {
          this.log('Logout cancelled.')
          return {count: 0, loggedOut: []}
        }
      } catch {
        // User cancelled the confirmation (Ctrl+C)
        this.log('Logout cancelled.')
        return {count: 0, loggedOut: []}
      }
    }

    // Logout from selected brokers (remove all in parallel)
    await Promise.all(brokerNamesToLogout.map((name) => brokerAuthManager.removeBroker(name)))

    // Display success messages
    for (const name of brokerNamesToLogout) {
      const broker = allBrokers.find((b: BrokerAuth) => b.name === name)
      const displayName = broker?.isDefault ? `${name} (default)` : name
      this.log(`Successfully logged out from: ${displayName}`)
    }

    // Return result for --json support
    return {
      count: brokerNamesToLogout.length,
      loggedOut: brokerNamesToLogout,
    }
  }
}
