import {printObjectAsKeyValueTable} from '@dishantlangayan/sc-cli-core'
import {Flags} from '@oclif/core'

import {ScBrokerCommand} from '../../../../lib/sc-broker-command.js'
import {
  MsgVpnQueueSubscriptionCreateRequest,
  MsgVpnQueueSubscriptionCreateResponse,
} from '../../../../types/msgvpn-queue.js'

export default class BrokerQueueSubscriptionsCreate extends ScBrokerCommand<typeof BrokerQueueSubscriptionsCreate> {
  static override args = {}
  static override description = `Create a subscription on a Queue in a Solace Event Broker.

Adds a topic subscription to the specified queue. Guaranteed messages published to topics matching the subscription will be delivered to the queue.

The creation of subscriptions is synchronized to HA mates and replication sites via config-sync.

Subscriptions use topic pattern matching which can include wildcards:
- '*' matches exactly one level in the topic hierarchy
- '>' matches one or more levels at the end of the topic

Multiple subscriptions can be added to a single queue.`
  static override examples = [
    '<%= config.bin %> <%= command.id %> --queue-name=myQueue --subscription-topic=orders/> --msg-vpn-name=default',
    '<%= config.bin %> <%= command.id %> --broker-name=dev-broker --queue-name=myQueue --subscription-topic=events/user/*',
    '<%= config.bin %> <%= command.id %> --broker-id=prod --queue-name=notifications --subscription-topic=alerts/critical --msg-vpn-name=production',
    '<%= config.bin %> <%= command.id %> --queue-name=myQueue --subscription-topic=data/sensor/temperature',
  ]
  static override flags = {
    ...ScBrokerCommand.baseFlags,
    'queue-name': Flags.string({
      char: 'q',
      description: 'The name of the queue to add the subscription to.',
      required: true,
    }),
    'subscription-topic': Flags.string({
      char: 't',
      description: 'The subscription topic to add to the queue.',
      required: true,
    }),
  }

  public async run(): Promise<MsgVpnQueueSubscriptionCreateResponse> {
    const {flags} = await this.parse(BrokerQueueSubscriptionsCreate)

    // Build subscription creation request body
    const subscriptionBody: MsgVpnQueueSubscriptionCreateRequest = {
      subscriptionTopic: flags['subscription-topic'],
    }

    // Make SEMP Config API call to create the subscription
    const queueName = flags['queue-name']
    const endpoint = `/SEMP/v2/config/msgVpns/${this.msgVpnName}/queues/${queueName}/subscriptions`
    const sempResp = await this.sempConn.post<MsgVpnQueueSubscriptionCreateResponse>(endpoint, subscriptionBody)

    // Display results
    this.log(printObjectAsKeyValueTable(sempResp.data as unknown as Record<string, unknown>))

    return sempResp
  }
}
