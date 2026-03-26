import {printObjectAsKeyValueTable, renderTable} from '@dishantlangayan/sc-cli-core'
import {Flags} from '@oclif/core'

import {ScBrokerCommand} from '../../../lib/sc-broker-command.js'
import {MsgVpnQueueMonitorResponse, MsgVpnQueueSubscriptionsResponse} from '../../../types/msgvpn-queue.js'

export default class BrokerQueueDisplay extends ScBrokerCommand<typeof BrokerQueueDisplay> {
  static override args = {}
  static override description = `Display queue information from a Solace Event Broker.

Retrieves and displays detailed information about a queue using the SEMP Monitor API, including operational state, statistics, and configuration.`
  static override examples = [
    '<%= config.bin %> <%= command.id %> --queue-name=myQueue --msg-vpn-name=default',
    '<%= config.bin %> <%= command.id %> --broker-name=dev-broker --queue-name=myQueue --msg-vpn-name=default',
    '<%= config.bin %> <%= command.id %> --queue-name=myQueue --show-subscriptions',
    '<%= config.bin %> <%= command.id %> --queue-name=myQueue',
  ]
  static override flags = {
    ...ScBrokerCommand.baseFlags,
    'queue-name': Flags.string({
      char: 'q',
      description: 'The name of the queue to display.',
      required: true,
    }),
    'show-subscriptions': Flags.boolean({
      char: 's',
      default: false,
      description: 'Display queue subscriptions in addition to queue details.',
    }),
  }

  public async run(): Promise<{queue: MsgVpnQueueMonitorResponse; subscriptions?: MsgVpnQueueSubscriptionsResponse}> {
    const {flags} = await this.parse(BrokerQueueDisplay)

    // Fetch queue details from Monitor API
    const queueEndpoint = `/SEMP/v2/monitor/msgVpns/${this.msgVpnName}/queues/${flags['queue-name']}`
    const queueResp = await this.sempConn.get<MsgVpnQueueMonitorResponse>(queueEndpoint)

    // Display queue information
    this.log('\n=== Queue Details ===\n')
    this.log(printObjectAsKeyValueTable(queueResp.data as unknown as Record<string, unknown>))

    // Prepare return value
    const result: {queue: MsgVpnQueueMonitorResponse; subscriptions?: MsgVpnQueueSubscriptionsResponse} = {
      queue: queueResp,
    }

    // Optionally fetch and display subscriptions
    if (flags['show-subscriptions']) {
      const subsEndpoint = `/SEMP/v2/monitor/msgVpns/${this.msgVpnName}/queues/${flags['queue-name']}/subscriptions`
      const subsResp = await this.sempConn.get<MsgVpnQueueSubscriptionsResponse>(subsEndpoint)

      result.subscriptions = subsResp

      this.log('\n=== Queue Subscriptions ===\n')

      if (subsResp.data.length === 0) {
        this.log('No subscriptions found.')
      } else {
        const subsTable = [
          ['Subscription Topic'],
          ...subsResp.data.map(sub => [sub.subscriptionTopic]),
        ]
        this.log(renderTable(subsTable))
      }
    }

    return result
  }
}
