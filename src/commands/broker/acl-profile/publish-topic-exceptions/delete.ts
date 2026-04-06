import {confirm} from '@inquirer/prompts'
import {Flags} from '@oclif/core'

import {ScBrokerCommand} from '../../../../lib/sc-broker-command.js'
import {MsgVpnAclProfilePublishTopicExceptionDeleteResponse} from '../../../../types/msgvpn-acl-profile-exceptions.js'

export default class BrokerAclProfilePublishTopicExceptionsDelete extends ScBrokerCommand<
  typeof BrokerAclProfilePublishTopicExceptionsDelete
> {
  static override args = {}
  static override description = `Delete a publish topic exception from an ACL Profile on a Solace Event Broker.

Removes the specified publish topic exception from the ACL Profile. This is a destructive operation. The deletion is synchronized to HA mates and replication sites via config-sync.

By default, a confirmation prompt is shown before deletion. Use --no-prompt to skip confirmation.`
  static override examples = [
    '<%= config.bin %> <%= command.id %> --acl-profile-name=myProfile --publish-topic-exception="orders/*/created" --syntax=smf',
    '<%= config.bin %> <%= command.id %> --acl-profile-name=myProfile --publish-topic-exception="devices/+/telemetry" --syntax=mqtt --no-prompt',
    '<%= config.bin %> <%= command.id %> --broker-name=dev-broker --acl-profile-name=myProfile --msg-vpn-name=default --publish-topic-exception="test/topic" --syntax=smf --no-prompt',
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
    'publish-topic-exception': Flags.string({
      char: 'p',
      description: 'The topic of the exception to delete.',
      required: true,
    }),
    syntax: Flags.string({
      char: 's',
      description: 'The syntax of the topic.',
      options: ['smf', 'mqtt'],
      required: true,
    }),
  }

  public async run(): Promise<MsgVpnAclProfilePublishTopicExceptionDeleteResponse> {
    const {flags} = await this.parse(BrokerAclProfilePublishTopicExceptionsDelete)
    const aclProfileName = flags['acl-profile-name']
    const topic = flags['publish-topic-exception']
    const {syntax} = flags

    // Confirmation prompt (unless --no-prompt flag is set)
    if (!flags['no-prompt']) {
      try {
        const shouldProceed = await confirm({
          default: false,
          message: `Are you sure you want to delete publish topic exception '${topic}' (syntax: ${syntax}) from ACL Profile '${aclProfileName}' in Message VPN '${this.msgVpnName}'? This action cannot be undone.`,
        })

        if (!shouldProceed) {
          this.exit(0)
        }
      } catch {
        // User cancelled the confirmation (Ctrl+C)
        this.log('Publish topic exception deletion cancelled.')
        this.exit(0)
      }
    }

    // Make SEMP Config API call to delete the exception
    // URL-encode both parts of the composite key and join with comma
    const compositeKey = `${encodeURIComponent(syntax)},${encodeURIComponent(topic)}`
    const endpoint = `/SEMP/v2/config/msgVpns/${this.msgVpnName}/aclProfiles/${aclProfileName}/publishTopicExceptions/${compositeKey}`
    const sempResp = await this.sempConn.delete<MsgVpnAclProfilePublishTopicExceptionDeleteResponse>(endpoint)

    // Check response code and display appropriate message
    if (sempResp.meta.responseCode === 200) {
      this.log(
        `\nSuccessfully deleted publish topic exception '${topic}' (syntax: ${syntax}) from ACL Profile '${aclProfileName}' in Message VPN '${this.msgVpnName}'`,
      )
    } else {
      this.error(
        `Failed to delete publish topic exception '${topic}': HTTP ${sempResp.meta.responseCode}`,
      )
    }

    return sempResp
  }
}
