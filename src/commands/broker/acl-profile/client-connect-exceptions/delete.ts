import {confirm} from '@inquirer/prompts'
import {Flags} from '@oclif/core'

import {ScBrokerCommand} from '../../../../lib/sc-broker-command.js'
import {MsgVpnAclProfileClientConnectExceptionDeleteResponse} from '../../../../types/msgvpn-acl-profile-exceptions.js'

export default class BrokerAclProfileClientConnectExceptionsDelete extends ScBrokerCommand<
  typeof BrokerAclProfileClientConnectExceptionsDelete
> {
  static override args = {}
  static override description = `Delete a client connect exception from an ACL Profile on a Solace Event Broker.

Removes the specified client connect exception from the ACL Profile. This is a destructive operation. The deletion is synchronized to HA mates and replication sites via config-sync.

By default, a confirmation prompt is shown before deletion. Use --no-prompt to skip confirmation.`
  static override examples = [
    '<%= config.bin %> <%= command.id %> --acl-profile-name=myProfile --client-connect-exception-address=192.168.1.0/24',
    '<%= config.bin %> <%= command.id %> --acl-profile-name=myProfile --client-connect-exception-address=10.0.0.0/8 --no-prompt',
    '<%= config.bin %> <%= command.id %> --broker-name=dev-broker --acl-profile-name=myProfile --msg-vpn-name=default --client-connect-exception-address=172.16.0.0/12 --no-prompt',
  ]
  static override flags = {
    ...ScBrokerCommand.baseFlags,
    'acl-profile-name': Flags.string({
      char: 'a',
      description: 'The name of the ACL Profile.',
      required: true,
    }),
    'client-connect-exception-address': Flags.string({
      char: 'c',
      description: 'The IP address/netmask of the client connect exception to delete in CIDR form.',
      required: true,
    }),
    'no-prompt': Flags.boolean({
      default: false,
      description: 'Skip confirmation prompt and proceed with deletion.',
    }),
  }

  public async run(): Promise<MsgVpnAclProfileClientConnectExceptionDeleteResponse> {
    const {flags} = await this.parse(BrokerAclProfileClientConnectExceptionsDelete)
    const aclProfileName = flags['acl-profile-name']
    const address = flags['client-connect-exception-address']

    // Confirmation prompt (unless --no-prompt flag is set)
    if (!flags['no-prompt']) {
      try {
        const shouldProceed = await confirm({
          default: false,
          message: `Are you sure you want to delete client connect exception '${address}' from ACL Profile '${aclProfileName}' in Message VPN '${this.msgVpnName}'? This action cannot be undone.`,
        })

        if (!shouldProceed) {
          this.exit(0)
        }
      } catch {
        // User cancelled the confirmation (Ctrl+C)
        this.log('Client connect exception deletion cancelled.')
        this.exit(0)
      }
    }

    // Make SEMP Config API call to delete the exception
    // URL-encode the address for the path parameter
    const encodedAddress = encodeURIComponent(address)
    const endpoint = `/SEMP/v2/config/msgVpns/${this.msgVpnName}/aclProfiles/${aclProfileName}/clientConnectExceptions/${encodedAddress}`
    const sempResp = await this.sempConn.delete<MsgVpnAclProfileClientConnectExceptionDeleteResponse>(endpoint)

    // Check response code and display appropriate message
    if (sempResp.meta.responseCode === 200) {
      this.log(
        `\nSuccessfully deleted client connect exception '${address}' from ACL Profile '${aclProfileName}' in Message VPN '${this.msgVpnName}'`,
      )
    } else {
      this.error(
        `Failed to delete client connect exception '${address}': HTTP ${sempResp.meta.responseCode}`,
      )
    }

    return sempResp
  }
}
