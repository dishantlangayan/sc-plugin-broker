import {BrokerAuth, BrokerAuthManager, renderTable, ScCommand} from '@dishantlangayan/sc-cli-core'

export default class BrokerLoginList extends ScCommand<typeof BrokerLoginList> {
  static override args = {}
  static override description = `List all authenticated brokers.

Displays brokers you have logged into, including their authentication type, SEMP endpoints, and which one is set as default.`
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
  ]
  static override flags = {}

  public async run(): Promise<{data: BrokerAuth[]}> {
    const brokerAuthManager: BrokerAuthManager = await this.getBrokerAuthManager()

    // Get all authenticated brokers
    const allBrokers = await brokerAuthManager.getAllBrokers()

    // Handle case when no brokers exist
    if (allBrokers.length === 0) {
      this.log("No brokers found. Run 'sc broker:login:basic' to authenticate.")
      return {data: []}
    }

    // Create table array (first row is headers, rest are data rows)
    const brokerArray = [
      ['Broker Name', 'Auth Type', 'SEMP Endpoint', 'SEMP Port', 'Is Default', 'Solace Cloud'],
      ...allBrokers.map((broker: BrokerAuth) => [
        broker.name,
        String(broker.authType),
        broker.sempEndpoint,
        broker.sempPort.toString(),
        broker.isDefault ? 'Yes' : '',
        broker.isSolaceCloud ? 'Yes' : '',
      ]),
    ]

    // Display results as a table
    this.log(renderTable(brokerArray))

    // Return raw data for --json flag support
    return {data: allBrokers}
  }
}
