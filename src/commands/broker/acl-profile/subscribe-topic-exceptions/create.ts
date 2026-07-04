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
    '<%= config.bin %> <%= command.id %> --name=myProfile --topic="orders/*/created" --syntax=smf',
    '<%= config.bin %> <%= command.id %> --name=myProfile --topic="devices/+/telemetry" --syntax=mqtt',
  ]
  static override flags = {
    ...ScBrokerCommand.baseFlags,
    name: Flags.string({
      char: 'n',
      description: 'The name of the ACL Profile.',
      required: true,
    }),
    syntax: Flags.string({
      char: 'x',
      description: 'The syntax of the topic.',
      options: ['smf', 'mqtt'],
      required: true,
    }),
    topic: Flags.string({
      char: 't',
      description: 'The topic for the exception. May include wildcards.',
      required: true,
    }),
  }

  public async run(): Promise<MsgVpnAclProfileSubscribeTopicExceptionCreateResponse> {
    const {flags} = await this.parse(BrokerAclProfileSubscribeTopicExceptionsCreate)

    // Build request body
    const requestBody: MsgVpnAclProfileSubscribeTopicExceptionCreateRequest = {
      subscribeTopicException: flags.topic,
      subscribeTopicExceptionSyntax: flags.syntax as 'mqtt' | 'smf',
    }

    // Make SEMP Config API call to create the exception
    const endpoint = `/SEMP/v2/config/msgVpns/${this.msgVpnName}/aclProfiles/${flags.name}/subscribeTopicExceptions`
    const sempResp = await this.sempConn.post<MsgVpnAclProfileSubscribeTopicExceptionCreateResponse>(
      endpoint,
      requestBody,
    )

    // Display results
    this.log(printObjectAsKeyValueTable(sempResp.data as unknown as Record<string, unknown>))

    return sempResp
  }
}
