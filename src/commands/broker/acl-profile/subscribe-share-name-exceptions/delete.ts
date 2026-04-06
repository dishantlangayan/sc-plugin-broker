import {confirm} from '@inquirer/prompts'
import {Flags} from '@oclif/core'

import {ScBrokerCommand} from '../../../../lib/sc-broker-command.js'
import {MsgVpnAclProfileSubscribeShareNameExceptionDeleteResponse} from '../../../../types/msgvpn-acl-profile-exceptions.js'

export default class BrokerAclProfileSubscribeShareNameExceptionsDelete extends ScBrokerCommand<
  typeof BrokerAclProfileSubscribeShareNameExceptionsDelete
> {
  static override args = {}
  static override description = `Delete a subscribe share name exception from an ACL Profile on a Solace Event Broker.

Removes the specified subscribe share name exception from the ACL Profile. This is a destructive operation. The deletion is synchronized to HA mates and replication sites via config-sync.

By default, a confirmation prompt is shown before deletion. Use --no-prompt to skip confirmation.`
  static override examples = [
    '<%= config.bin %> <%= command.id %> --acl-profile-name=myProfile --subscribe-share-name-exception="orders/*" --syntax=smf',
    '<%= config.bin %> <%= command.id %> --acl-profile-name=myProfile --subscribe-share-name-exception="devices/+" --syntax=mqtt --no-prompt',
    '<%= config.bin %> <%= command.id %> --broker-name=dev-broker --acl-profile-name=myProfile --msg-vpn-name=default --subscribe-share-name-exception="test/share" --syntax=smf --no-prompt',
  ]
  static override flags = {
    ...ScBrokerCommand.baseFlags,
    'acl-profile-name': Flags.string({
      char: 'a',
      description: 'The name of the ACL Profile.',
      required: true,
    }),
    'no-prompt': Flags.boolean({
      default: false,
      description: 'Skip confirmation prompt and proceed with deletion.',
    }),
    'subscribe-share-name-exception': Flags.string({
      char: 's',
      description: 'The share name of the exception to delete.',
      required: true,
    }),
    syntax: Flags.string({
      char: 'x',
      description: 'The syntax of the share name.',
      options: ['smf', 'mqtt'],
      required: true,
    }),
  }

  public async run(): Promise<MsgVpnAclProfileSubscribeShareNameExceptionDeleteResponse> {
    const {flags} = await this.parse(BrokerAclProfileSubscribeShareNameExceptionsDelete)
    const aclProfileName = flags['acl-profile-name']
    const shareName = flags['subscribe-share-name-exception']
    const {syntax} = flags

    // Confirmation prompt (unless --no-prompt flag is set)
    if (!flags['no-prompt']) {
      try {
        const shouldProceed = await confirm({
          default: false,
          message: `Are you sure you want to delete subscribe share name exception '${shareName}' (syntax: ${syntax}) from ACL Profile '${aclProfileName}' in Message VPN '${this.msgVpnName}'? This action cannot be undone.`,
        })

        if (!shouldProceed) {
          this.exit(0)
        }
      } catch {
        // User cancelled the confirmation (Ctrl+C)
        this.log('Subscribe share name exception deletion cancelled.')
        this.exit(0)
      }
    }

    // Make SEMP Config API call to delete the exception
    // URL-encode both parts of the composite key and join with comma
    const compositeKey = `${encodeURIComponent(syntax)},${encodeURIComponent(shareName)}`
    const endpoint = `/SEMP/v2/config/msgVpns/${this.msgVpnName}/aclProfiles/${aclProfileName}/subscribeShareNameExceptions/${compositeKey}`
    const sempResp = await this.sempConn.delete<MsgVpnAclProfileSubscribeShareNameExceptionDeleteResponse>(endpoint)

    // Check response code and display appropriate message
    if (sempResp.meta.responseCode === 200) {
      this.log(
        `\nSuccessfully deleted subscribe share name exception '${shareName}' (syntax: ${syntax}) from ACL Profile '${aclProfileName}' in Message VPN '${this.msgVpnName}'`,
      )
    } else {
      this.error(
        `Failed to delete subscribe share name exception '${shareName}': HTTP ${sempResp.meta.responseCode}`,
      )
    }

    return sempResp
  }
}
