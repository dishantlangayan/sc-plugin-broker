import {printObjectAsKeyValueTable} from '@dishantlangayan/sc-cli-core'
import {Flags} from '@oclif/core'

import {ScBrokerCommand} from '../../../../lib/sc-broker-command.js'
import {
  MsgVpnAclProfileSubscribeTopicExceptionCreateRequest,
  MsgVpnAclProfileSubscribeTopicExceptionCreateResponse,
} from '../../../../types/msgvpn-acl-profile-exceptions.js'

export default class BrokerAclProfileSubscribeTopicExceptionsCreate extends ScBrokerCommand<
  typeof BrokerAclProfileSubscribeTopicExceptionsCreate
> {
  static override args = {}
  static override description = `Create a subscribe topic exception for an ACL Profile on a Solace Event Broker.

Adds an exception to the ACL Profile for clients subscribing to specific topics. The exception is expressed as a topic with optional wildcards and must specify the syntax type (smf or mqtt). The creation is synchronized to HA mates and replication sites via config-sync.`
  static override examples = [
    '<%= config.bin %> <%= command.id %> --acl-profile-name=myProfile --subscribe-topic-exception="orders/*/created" --syntax=smf',
    '<%= config.bin %> <%= command.id %> --broker-name=dev-broker --acl-profile-name=myProfile --msg-vpn-name=default --subscribe-topic-exception="devices/+/telemetry" --syntax=mqtt',
  ]
  static override flags = {
    ...ScBrokerCommand.baseFlags,
    'acl-profile-name': Flags.string({
      char: 'a',
      description: 'The name of the ACL Profile.',
      required: true,
    }),
    'subscribe-topic-exception': Flags.string({
      char: 's',
      description: 'The topic for the exception. May include wildcards.',
      required: true,
    }),
    syntax: Flags.string({
      char: 'x',
      description: 'The syntax of the topic.',
      options: ['smf', 'mqtt'],
      required: true,
    }),
  }

  public async run(): Promise<MsgVpnAclProfileSubscribeTopicExceptionCreateResponse> {
    const {flags} = await this.parse(BrokerAclProfileSubscribeTopicExceptionsCreate)

    // Build request body
    const requestBody: MsgVpnAclProfileSubscribeTopicExceptionCreateRequest = {
      subscribeTopicException: flags['subscribe-topic-exception'],
      subscribeTopicExceptionSyntax: flags.syntax as 'mqtt' | 'smf',
    }

    // Make SEMP Config API call to create the exception
    const endpoint = `/SEMP/v2/config/msgVpns/${this.msgVpnName}/aclProfiles/${flags['acl-profile-name']}/subscribeTopicExceptions`
    const sempResp = await this.sempConn.post<MsgVpnAclProfileSubscribeTopicExceptionCreateResponse>(
      endpoint,
      requestBody,
    )

    // Display results
    this.log(printObjectAsKeyValueTable(sempResp.data as unknown as Record<string, unknown>))

    return sempResp
  }
}
