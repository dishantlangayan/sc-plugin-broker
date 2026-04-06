import {printObjectAsKeyValueTable} from '@dishantlangayan/sc-cli-core'
import {Flags} from '@oclif/core'

import {ScBrokerCommand} from '../../../../lib/sc-broker-command.js'
import {
  MsgVpnAclProfilePublishTopicExceptionCreateRequest,
  MsgVpnAclProfilePublishTopicExceptionCreateResponse,
} from '../../../../types/msgvpn-acl-profile-exceptions.js'

export default class BrokerAclProfilePublishTopicExceptionsCreate extends ScBrokerCommand<
  typeof BrokerAclProfilePublishTopicExceptionsCreate
> {
  static override args = {}
  static override description = `Create a publish topic exception for an ACL Profile on a Solace Event Broker.

Adds an exception to the ACL Profile for clients publishing to specific topics. The exception is expressed as a topic with optional wildcards and must specify the syntax type (smf or mqtt). The creation is synchronized to HA mates and replication sites via config-sync.`
  static override examples = [
    '<%= config.bin %> <%= command.id %> --acl-profile-name=myProfile --publish-topic-exception="orders/*/created" --syntax=smf',
    '<%= config.bin %> <%= command.id %> --broker-name=dev-broker --acl-profile-name=myProfile --msg-vpn-name=default --publish-topic-exception="devices/+/telemetry" --syntax=mqtt',
  ]
  static override flags = {
    ...ScBrokerCommand.baseFlags,
    'acl-profile-name': Flags.string({
      char: 'a',
      description: 'The name of the ACL Profile.',
      required: true,
    }),
    'publish-topic-exception': Flags.string({
      char: 'p',
      description: 'The topic for the exception. May include wildcards.',
      required: true,
    }),
    syntax: Flags.string({
      char: 's',
      description: 'The syntax of the topic.',
      options: ['smf', 'mqtt'],
      required: true,
    }),
  }

  public async run(): Promise<MsgVpnAclProfilePublishTopicExceptionCreateResponse> {
    const {flags} = await this.parse(BrokerAclProfilePublishTopicExceptionsCreate)

    // Build request body
    const requestBody: MsgVpnAclProfilePublishTopicExceptionCreateRequest = {
      publishTopicException: flags['publish-topic-exception'],
      publishTopicExceptionSyntax: flags.syntax as 'mqtt' | 'smf',
    }

    // Make SEMP Config API call to create the exception
    const endpoint = `/SEMP/v2/config/msgVpns/${this.msgVpnName}/aclProfiles/${flags['acl-profile-name']}/publishTopicExceptions`
    const sempResp = await this.sempConn.post<MsgVpnAclProfilePublishTopicExceptionCreateResponse>(
      endpoint,
      requestBody,
    )

    // Display results
    this.log(printObjectAsKeyValueTable(sempResp.data as unknown as Record<string, unknown>))

    return sempResp
  }
}
