import {confirm} from '@inquirer/prompts'
import {Flags} from '@oclif/core'

import {ScBrokerCommand} from '../../../../lib/sc-broker-command.js'
import {MsgVpnQueueSubscriptionDeleteResponse} from '../../../../types/msgvpn-queue.js'

export default class BrokerQueueSubscriptionsDelete extends ScBrokerCommand<typeof BrokerQueueSubscriptionsDelete> {
  static override args = {}
  static override description = `Delete a subscription from a Queue in a Solace Event Broker.

Removes a topic subscription from the specified queue. This is a destructive operation that removes the subscription.

The deletion is synchronized to HA mates and replication sites via config-sync.

By default, a confirmation prompt is shown before deletion. Use --no-prompt to skip confirmation.`
  static override examples = [
    '<%= config.bin %> <%= command.id %> --queue-name=myQueue --subscription-topic=orders/> --msg-vpn-name=default',
    '<%= config.bin %> <%= command.id %> --broker-name=dev-broker --queue-name=myQueue --subscription-topic=events/user/*',
    '<%= config.bin %> <%= command.id %> --queue-name=myQueue --subscription-topic=orders/> --no-prompt',
    '<%= config.bin %> <%= command.id %> --broker-id=prod --queue-name=notifications --subscription-topic=alerts/critical --msg-vpn-name=production --no-prompt',
  ]
  static override flags = {
    ...ScBrokerCommand.baseFlags,
    'no-prompt': Flags.boolean({
      default: false,
      description: 'Skip confirmation prompt and proceed with deletion.',
    }),
    'queue-name': Flags.string({
      char: 'q',
      description: 'The name of the queue to remove the subscription from.',
      required: true,
    }),
    'subscription-topic': Flags.string({
      char: 't',
      description: 'The subscription topic to remove from the queue.',
      required: true,
    }),
  }

  public async run(): Promise<MsgVpnQueueSubscriptionDeleteResponse> {
    const {flags} = await this.parse(BrokerQueueSubscriptionsDelete)
    const queueName = flags['queue-name']
    const subscriptionTopic = flags['subscription-topic']

    // Confirmation prompt (unless --no-prompt flag is set)
    if (!flags['no-prompt']) {
      try {
        const shouldProceed = await confirm({
          default: false,
          message: `Are you sure you want to delete subscription '${subscriptionTopic}' from queue '${queueName}' in Message VPN '${this.msgVpnName}'? This action cannot be undone.`,
        })

        if (!shouldProceed) {
          this.exit(0)
        }
      } catch {
        // User cancelled the confirmation (Ctrl+C)
        this.log('Subscription deletion cancelled.')
        this.exit(0)
      }
    }

    // Make SEMP Config API call to delete the subscription
    const endpoint = `/SEMP/v2/config/msgVpns/${this.msgVpnName}/queues/${queueName}/subscriptions/${encodeURIComponent(subscriptionTopic)}`
    const sempResp = await this.sempConn.delete<MsgVpnQueueSubscriptionDeleteResponse>(endpoint)

    // Check response code and display appropriate message
    if (sempResp.meta.responseCode === 200) {
      this.log(`\nSuccessfully deleted subscription '${subscriptionTopic}' from queue '${queueName}' in Message VPN '${this.msgVpnName}'`)
    } else {
      this.error(`Failed to delete subscription '${subscriptionTopic}': HTTP ${sempResp.meta.responseCode}`)
    }

    // Return SEMP response as-is for --json support
    return sempResp
  }
}
