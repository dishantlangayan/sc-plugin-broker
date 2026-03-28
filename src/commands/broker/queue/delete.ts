import {confirm} from '@inquirer/prompts'
import {Flags} from '@oclif/core'

import {ScBrokerCommand} from '../../../lib/sc-broker-command.js'
import {MsgVpnQueueDeleteResponse} from '../../../types/msgvpn-queue.js'

export default class BrokerQueueDelete extends ScBrokerCommand<typeof BrokerQueueDelete> {
  static override args = {}
static override description = `Delete a Queue from a Solace Event Broker.

Deletes the specified queue from the Message VPN. This is a destructive operation that removes the queue and all its messages. Any messages persisted on the queue will also be deleted.

The deletion is synchronized to HA mates and replication sites via config-sync.

By default, a confirmation prompt is shown before deletion. Use --no-prompt to skip confirmation.`
static override examples = [
    '<%= config.bin %> <%= command.id %> --queue-name=myQueue --msg-vpn-name=default',
    '<%= config.bin %> <%= command.id %> --broker-name=dev-broker --queue-name=myQueue',
    '<%= config.bin %> <%= command.id %> --queue-name=myQueue --no-prompt',
    '<%= config.bin %> <%= command.id %> --broker-id=prod --queue-name=tempQueue --msg-vpn-name=production --no-prompt',
  ]
static override flags = {
    ...ScBrokerCommand.baseFlags,
    'no-prompt': Flags.boolean({
      default: false,
      description: 'Skip confirmation prompt and proceed with deletion.',
    }),
    'queue-name': Flags.string({
      char: 'q',
      description: 'The name of the queue to delete.',
      required: true,
    }),
  }

  public async run(): Promise<MsgVpnQueueDeleteResponse> {
    const {flags} = await this.parse(BrokerQueueDelete)
    const queueName = flags['queue-name']

    // Confirmation prompt (unless --no-prompt flag is set)
    if (!flags['no-prompt']) {
      try {
        const shouldProceed = await confirm({
          default: false,
          message: `Are you sure you want to delete queue '${queueName}' from Message VPN '${this.msgVpnName}'? This action cannot be undone.`,
        })

        if (!shouldProceed) {
          this.log('Queue deletion cancelled.')
          this.exit(0)
        }
      } catch {
        // User cancelled the confirmation (Ctrl+C)
        this.log('Queue deletion cancelled.')
        this.exit(0)
      }
    }

    // Make SEMP Config API call to delete the queue
    const endpoint = `/SEMP/v2/config/msgVpns/${this.msgVpnName}/queues/${queueName}`
    const sempResp = await this.sempConn.delete<MsgVpnQueueDeleteResponse>(endpoint)

    // Check response code and display appropriate message
    if (sempResp.meta.responseCode === 200) {
      this.log(`\nSuccessfully deleted queue '${queueName}' from Message VPN '${this.msgVpnName}'`)
    } else {
      this.error(`Failed to delete queue '${queueName}': HTTP ${sempResp.meta.responseCode}`)
    }

    // Return SEMP response as-is for --json support
    return sempResp
  }
}
