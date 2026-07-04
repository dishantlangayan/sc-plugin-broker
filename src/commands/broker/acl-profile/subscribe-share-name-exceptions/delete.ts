import {confirm} from '@inquirer/prompts'
import {Flags} from '@oclif/core'

import {ScBrokerCommand} from '../../../../lib/sc-broker-command.js'
import {MsgVpnAclProfileSubscribeShareNameExceptionDeleteResponse} from '../../../../types/msgvpn-acl-profile-exceptions.js'

export default class BrokerAclProfileSubscribeShareNameExceptionsDelete extends ScBrokerCommand<
  typeof BrokerAclProfileSubscribeShareNameExceptionsDelete
> {
  static override args = {}
  static override description = `Delete a subscribe share name exception from an ACL Profile on a Solace Event Broker.

Removes the specified subscribe share name exception from the ACL Profile. This is a destructive operation.

By default, a confirmation prompt is shown before deletion. Use --no-prompt to skip confirmation.`
  static override examples = [
    '<%= config.bin %> <%= command.id %> --name=myProfile --topic="orders/*" --syntax=smf',
    '<%= config.bin %> <%= command.id %> --name=myProfile --topic="devices/+" --syntax=mqtt --no-prompt',
  ]
  static override flags = {
    ...ScBrokerCommand.baseFlags,
    name: Flags.string({
      char: 'n',
      description: 'The name of the ACL Profile.',
      required: true,
    }),
    'no-prompt': Flags.boolean({
      default: false,
      description: 'Skip confirmation prompt and proceed with deletion.',
    }),
    syntax: Flags.string({
      char: 'x',
      description: 'The syntax of the share name.',
      options: ['smf', 'mqtt'],
      required: true,
    }),
    topic: Flags.string({
      char: 't',
      description: 'The share name of the exception to delete.',
      required: true,
    }),
  }

  public async run(): Promise<MsgVpnAclProfileSubscribeShareNameExceptionDeleteResponse> {
    const {flags} = await this.parse(BrokerAclProfileSubscribeShareNameExceptionsDelete)
    const aclProfileName = flags.name
    const shareName = flags.topic
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
