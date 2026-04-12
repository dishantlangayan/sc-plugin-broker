import {confirm} from '@inquirer/prompts'
import {Flags} from '@oclif/core'

import {ScBrokerCommand} from '../../../lib/sc-broker-command.js'
import {MsgVpnClientUsernameDeleteResponse} from '../../../types/msgvpn-client-username.js'

export default class BrokerClientUsernameDelete extends ScBrokerCommand<typeof BrokerClientUsernameDelete> {
  static override args = {}
  static override description = `Delete a Client Username from a Solace Event Broker.

Deletes the specified Client Username from the Message VPN. This is a destructive operation that removes the Client Username. Any clients currently connected with this username will be disconnected.

The deletion is synchronized to HA mates and replication sites via config-sync.

By default, a confirmation prompt is shown before deletion. Use --no-prompt to skip confirmation.`
  static override examples = [
    '<%= config.bin %> <%= command.id %> --client-username=user1 --msg-vpn-name=default',
    '<%= config.bin %> <%= command.id %> --broker-name=dev-broker --client-username=user1',
    '<%= config.bin %> <%= command.id %> --client-username=user1 --no-prompt',
    '<%= config.bin %> <%= command.id %> --broker-id=prod --client-username=tempUser --msg-vpn-name=production --no-prompt',
  ]
  static override flags = {
    ...ScBrokerCommand.baseFlags,
    'client-username': Flags.string({
      char: 'u',
      description: 'The name of the Client Username to delete.',
      required: true,
    }),
    'no-prompt': Flags.boolean({
      default: false,
      description: 'Skip confirmation prompt and proceed with deletion.',
    }),
  }

  public async run(): Promise<MsgVpnClientUsernameDeleteResponse> {
    const {flags} = await this.parse(BrokerClientUsernameDelete)
    const clientUsername = flags['client-username']

    // Confirmation prompt (unless --no-prompt flag is set)
    if (!flags['no-prompt']) {
      try {
        const shouldProceed = await confirm({
          default: false,
          message: `Are you sure you want to delete Client Username '${clientUsername}' from Message VPN '${this.msgVpnName}'? Any connected clients will be disconnected. This action cannot be undone.`,
        })

        if (!shouldProceed) {
          this.exit(0)
        }
      } catch {
        // User cancelled the confirmation (Ctrl+C)
        this.log('Client Username deletion cancelled.')
        this.exit(0)
      }
    }

    // Make SEMP Config API call to delete
    const endpoint = `/SEMP/v2/config/msgVpns/${this.msgVpnName}/clientUsernames/${clientUsername}`
    const sempResp = await this.sempConn.delete<MsgVpnClientUsernameDeleteResponse>(endpoint)

    // Check response code and display appropriate message
    if (sempResp.meta.responseCode === 200) {
      this.log(`\nSuccessfully deleted Client Username '${clientUsername}' from Message VPN '${this.msgVpnName}'`)
    } else {
      this.error(`Failed to delete Client Username '${clientUsername}': HTTP ${sempResp.meta.responseCode}`)
    }

    // Return SEMP response as-is for --json support
    return sempResp
  }
}
