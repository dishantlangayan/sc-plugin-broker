import {confirm} from '@inquirer/prompts'
import {Flags} from '@oclif/core'

import {ScBrokerCommand} from '../../../lib/sc-broker-command.js'
import {MsgVpnClientProfileDeleteResponse} from '../../../types/msgvpn-client-profile.js'

export default class BrokerClientProfileDelete extends ScBrokerCommand<typeof BrokerClientProfileDelete> {
  static override args = {}
  static override description = `Delete a Client Profile from a Solace Event Broker.

Deletes the specified Client Profile from the Message VPN. This action cannot be undone. A confirmation prompt will be displayed unless --no-prompt is specified.`
  static override examples = [
    '<%= config.bin %> <%= command.id %> --name=myProfile',
    '<%= config.bin %> <%= command.id %> --name=myProfile --no-prompt',
  ]
  static override flags = {
    ...ScBrokerCommand.baseFlags,
    name: Flags.string({
      char: 'n',
      description: 'The name of the client profile to delete.',
      required: true,
    }),
    'no-prompt': Flags.boolean({
      default: false,
      description: 'Skip confirmation prompt.',
    }),
  }

  public async run(): Promise<MsgVpnClientProfileDeleteResponse> {
    const {flags} = await this.parse(BrokerClientProfileDelete)
    const clientProfileName = flags.name

    // Confirmation prompt (unless --no-prompt)
    if (!flags['no-prompt']) {
      try {
        const shouldProceed = await confirm({
          default: false,
          message: `Are you sure you want to delete client profile '${clientProfileName}' from Message VPN '${this.msgVpnName}'? This action cannot be undone.`,
        })

        if (!shouldProceed) {
          this.exit(0)
        }
      } catch {
        this.log('Client profile deletion cancelled.')
        this.exit(0)
      }
    }

    // DELETE from config API
    const endpoint = `/SEMP/v2/config/msgVpns/${this.msgVpnName}/clientProfiles/${clientProfileName}`
    const sempResp = await this.sempConn.delete<MsgVpnClientProfileDeleteResponse>(endpoint)

    // Check response and display appropriate message
    if (sempResp.meta.responseCode === 200) {
      this.log(`\nSuccessfully deleted client profile '${clientProfileName}' from Message VPN '${this.msgVpnName}'`)
    } else {
      this.error(`Failed to delete client profile '${clientProfileName}': HTTP ${sempResp.meta.responseCode}`)
    }

    return sempResp
  }
}
