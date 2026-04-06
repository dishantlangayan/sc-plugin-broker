import {confirm} from '@inquirer/prompts'
import {Flags} from '@oclif/core'

import {ScBrokerCommand} from '../../../lib/sc-broker-command.js'
import {MsgVpnAclProfileDeleteResponse} from '../../../types/msgvpn-acl-profile.js'

export default class BrokerAclProfileDelete extends ScBrokerCommand<typeof BrokerAclProfileDelete> {
  static override args = {}
  static override description = `Delete an ACL Profile from a Solace Event Broker.

Deletes the specified ACL Profile from the Message VPN. This is a destructive operation that removes the ACL Profile. Any clients or client usernames using this profile should be updated to use a different profile before deletion.

The deletion is synchronized to HA mates and replication sites via config-sync.

By default, a confirmation prompt is shown before deletion. Use --no-prompt to skip confirmation.`
  static override examples = [
    '<%= config.bin %> <%= command.id %> --acl-profile-name=myProfile --msg-vpn-name=default',
    '<%= config.bin %> <%= command.id %> --broker-name=dev-broker --acl-profile-name=myProfile',
    '<%= config.bin %> <%= command.id %> --acl-profile-name=myProfile --no-prompt',
    '<%= config.bin %> <%= command.id %> --broker-id=prod --acl-profile-name=tempProfile --msg-vpn-name=production --no-prompt',
  ]
  static override flags = {
    ...ScBrokerCommand.baseFlags,
    'acl-profile-name': Flags.string({
      char: 'a',
      description: 'The name of the ACL Profile to delete.',
      required: true,
    }),
    'no-prompt': Flags.boolean({
      default: false,
      description: 'Skip confirmation prompt and proceed with deletion.',
    }),
  }

  public async run(): Promise<MsgVpnAclProfileDeleteResponse> {
    const {flags} = await this.parse(BrokerAclProfileDelete)
    const aclProfileName = flags['acl-profile-name']

    // Confirmation prompt (unless --no-prompt flag is set)
    if (!flags['no-prompt']) {
      try {
        const shouldProceed = await confirm({
          default: false,
          message: `Are you sure you want to delete ACL Profile '${aclProfileName}' from Message VPN '${this.msgVpnName}'? This action cannot be undone.`,
        })

        if (!shouldProceed) {
          this.exit(0)
        }
      } catch {
        // User cancelled the confirmation (Ctrl+C)
        this.log('ACL Profile deletion cancelled.')
        this.exit(0)
      }
    }

    // Make SEMP Config API call to delete the ACL profile
    const endpoint = `/SEMP/v2/config/msgVpns/${this.msgVpnName}/aclProfiles/${aclProfileName}`
    const sempResp = await this.sempConn.delete<MsgVpnAclProfileDeleteResponse>(endpoint)

    // Check response code and display appropriate message
    if (sempResp.meta.responseCode === 200) {
      this.log(`\nSuccessfully deleted ACL Profile '${aclProfileName}' from Message VPN '${this.msgVpnName}'`)
    } else {
      this.error(`Failed to delete ACL Profile '${aclProfileName}': HTTP ${sempResp.meta.responseCode}`)
    }

    // Return SEMP response as-is for --json support
    return sempResp
  }
}
