import {confirm} from '@inquirer/prompts'
import {Flags} from '@oclif/core'

import {ScBrokerCommand} from '../../../lib/sc-broker-command.js'
import {MsgVpnQueueTemplateDeleteResponse} from '../../../types/msgvpn-queue-template.js'

export default class BrokerQueueTemplateDelete extends ScBrokerCommand<typeof BrokerQueueTemplateDelete> {
  static override args = {}
  static override description = `Delete a Queue Template from a Solace Event Broker.

Deletes the specified queue template from the Message VPN. This is a destructive operation that removes the template configuration.

The deletion is synchronized to HA mates and replication sites via config-sync.

By default, a confirmation prompt is shown before deletion. Use --no-prompt to skip confirmation.`
  static override examples = [
    '<%= config.bin %> <%= command.id %> --queue-template-name=myTemplate --msg-vpn-name=default',
    '<%= config.bin %> <%= command.id %> --broker-name=dev-broker --queue-template-name=myTemplate',
    '<%= config.bin %> <%= command.id %> --queue-template-name=myTemplate --no-prompt',
    '<%= config.bin %> <%= command.id %> --broker-id=prod --queue-template-name=tempTemplate --msg-vpn-name=production --no-prompt',
  ]
  static override flags = {
    ...ScBrokerCommand.baseFlags,
    'no-prompt': Flags.boolean({
      default: false,
      description: 'Skip confirmation prompt and proceed with deletion.',
    }),
    'queue-template-name': Flags.string({
      char: 't',
      description: 'The name of the queue template to delete.',
      required: true,
    }),
  }

  public async run(): Promise<MsgVpnQueueTemplateDeleteResponse> {
    const {flags} = await this.parse(BrokerQueueTemplateDelete)
    const queueTemplateName = flags['queue-template-name']

    // Confirmation prompt (unless --no-prompt flag is set)
    if (!flags['no-prompt']) {
      try {
        const shouldProceed = await confirm({
          default: false,
          message: `Are you sure you want to delete queue template '${queueTemplateName}' from Message VPN '${this.msgVpnName}'? This action cannot be undone.`,
        })

        if (!shouldProceed) {
          this.exit(0)
        }
      } catch {
        // User cancelled the confirmation (Ctrl+C)
        this.log('Queue template deletion cancelled.')
        this.exit(0)
      }
    }

    // Make SEMP Config API call to delete the queue template
    const endpoint = `/SEMP/v2/config/msgVpns/${this.msgVpnName}/queueTemplates/${queueTemplateName}`
    const sempResp = await this.sempConn.delete<MsgVpnQueueTemplateDeleteResponse>(endpoint)

    // Check response code and display appropriate message
    if (sempResp.meta.responseCode === 200) {
      this.log(`\nSuccessfully deleted queue template '${queueTemplateName}' from Message VPN '${this.msgVpnName}'`)
    } else {
      this.error(`Failed to delete queue template '${queueTemplateName}': HTTP ${sempResp.meta.responseCode}`)
    }

    // Return SEMP response as-is for --json support
    return sempResp
  }
}
