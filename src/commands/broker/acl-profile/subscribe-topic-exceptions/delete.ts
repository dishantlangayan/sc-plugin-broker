import {confirm} from '@inquirer/prompts'
import {Flags} from '@oclif/core'

import {ScBrokerCommand} from '../../../../lib/sc-broker-command.js'
import {MsgVpnAclProfileSubscribeTopicExceptionDeleteResponse} from '../../../../types/msgvpn-acl-profile-exceptions.js'

export default class BrokerAclProfileSubscribeTopicExceptionsDelete extends ScBrokerCommand<
  typeof BrokerAclProfileSubscribeTopicExceptionsDelete
> {
  static override args = {}
  static override description = `Delete a subscribe topic exception from an ACL Profile on a Solace Event Broker.

Removes the specified subscribe topic exception from the ACL Profile. This is a destructive operation. The deletion is synchronized to HA mates and replication sites via config-sync.

By default, a confirmation prompt is shown before deletion. Use --no-prompt to skip confirmation.`
  static override examples = [
    '<%= config.bin %> <%= command.id %> --name=myProfile --topic="orders/*/created" --syntax=smf',
    '<%= config.bin %> <%= command.id %> --name=myProfile --topic="devices/+/telemetry" --syntax=mqtt --no-prompt',
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
      description: 'The syntax of the topic.',
      options: ['smf', 'mqtt'],
      required: true,
    }),
    topic: Flags.string({
      char: 't',
      description: 'The topic of the exception to delete.',
      required: true,
    }),
  }

  public async run(): Promise<MsgVpnAclProfileSubscribeTopicExceptionDeleteResponse> {
    const {flags} = await this.parse(BrokerAclProfileSubscribeTopicExceptionsDelete)
    const aclProfileName = flags.name
    const {topic} = flags
    const {syntax} = flags

    // Confirmation prompt (unless --no-prompt flag is set)
    if (!flags['no-prompt']) {
      try {
        const shouldProceed = await confirm({
          default: false,
          message: `Are you sure you want to delete subscribe topic exception '${topic}' (syntax: ${syntax}) from ACL Profile '${aclProfileName}' in Message VPN '${this.msgVpnName}'? This action cannot be undone.`,
        })

        if (!shouldProceed) {
          this.exit(0)
        }
      } catch {
        // User cancelled the confirmation (Ctrl+C)
        this.log('Subscribe topic exception deletion cancelled.')
        this.exit(0)
      }
    }

    // Make SEMP Config API call to delete the exception
    // URL-encode both parts of the composite key and join with comma
    const compositeKey = `${encodeURIComponent(syntax)},${encodeURIComponent(topic)}`
    const endpoint = `/SEMP/v2/config/msgVpns/${this.msgVpnName}/aclProfiles/${aclProfileName}/subscribeTopicExceptions/${compositeKey}`
    const sempResp = await this.sempConn.delete<MsgVpnAclProfileSubscribeTopicExceptionDeleteResponse>(endpoint)

    // Check response code and display appropriate message
    if (sempResp.meta.responseCode === 200) {
      this.log(
        `\nSuccessfully deleted subscribe topic exception '${topic}' (syntax: ${syntax}) from ACL Profile '${aclProfileName}' in Message VPN '${this.msgVpnName}'`,
      )
    } else {
      this.error(
        `Failed to delete subscribe topic exception '${topic}': HTTP ${sempResp.meta.responseCode}`,
      )
    }

    return sempResp
  }
}
