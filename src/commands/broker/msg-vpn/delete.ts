import {confirm} from '@inquirer/prompts'
import {Flags} from '@oclif/core'

import {ScBrokerCommand} from '../../../lib/sc-broker-command.js'
import {MsgVpnDeleteResponse} from '../../../types/msgvpn.js'

export default class BrokerMsgVpnDelete extends ScBrokerCommand<typeof BrokerMsgVpnDelete> {
  static override args = {}
  static override baseFlags = ScBrokerCommand.brokerFlags
  static override description = `Delete a Message VPN from a Solace Event Broker.

This is a destructive operation that removes the Message VPN and all of its configuration.

By default, a confirmation prompt is shown before deletion. Use --no-prompt to skip confirmation.`
  static override examples = [
    '<%= config.bin %> <%= command.id %> --name=myVpn',
    '<%= config.bin %> <%= command.id %> --name=myVpn --no-prompt',
  ]
  static override flags = {    ...ScBrokerCommand.brokerFlags,
    name: Flags.string({
      char: 'n',
      description: 'The name of the Message VPN to delete.',
      required: true,
    }),
    'no-prompt': Flags.boolean({
      default: false,
      description: 'Skip confirmation prompt and proceed with deletion.',
    }),
  }
  // This command manages Message VPNs directly; the target VPN is identified
  // by the --name flag rather than the VPN-scoped -v/--msg-vpn-name flag.
  protected override resolveMsgVpn = false

  public async run(): Promise<MsgVpnDeleteResponse> {
    const {flags} = await this.parse(BrokerMsgVpnDelete)
    const msgVpnName = flags.name

    // Message VPNs cannot be deleted on Solace Cloud brokers (they are
    // provisioned with a single, fixed Message VPN).
    const brokerAuth = await this.getBrokerAuth()
    if (brokerAuth.isSolaceCloud) {
      this.error(
        'Message VPNs cannot be deleted on a Solace Cloud broker. Cloud brokers are provisioned with a single Message VPN.',
        {exit: 2},
      )
    }

    // Confirmation prompt (unless --no-prompt flag is set)
    if (!flags['no-prompt']) {
      try {
        const shouldProceed = await confirm({
          default: false,
          message: `Are you sure you want to delete Message VPN '${msgVpnName}'? This action cannot be undone.`,
        })

        if (!shouldProceed) {
          this.exit(0)
        }
      } catch {
        // User cancelled the confirmation (Ctrl+C)
        this.log('Message VPN deletion cancelled.')
        this.exit(0)
      }
    }

    // Make SEMP Config API call to delete the Message VPN
    const endpoint = `/SEMP/v2/config/msgVpns/${msgVpnName}`
    const sempResp = await this.sempConn.delete<MsgVpnDeleteResponse>(endpoint)

    // Check response code and display appropriate message
    if (sempResp.meta.responseCode === 200) {
      this.log(`\nSuccessfully deleted Message VPN '${msgVpnName}'`)
    } else {
      this.error(`Failed to delete Message VPN '${msgVpnName}': HTTP ${sempResp.meta.responseCode}`)
    }

    // Return SEMP response as-is for --json support
    return sempResp
  }
}
