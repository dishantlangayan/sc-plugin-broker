import {printObjectAsKeyValueTable} from '@dishantlangayan/sc-cli-core'
import {Flags} from '@oclif/core'

import {ScBrokerCommand} from '../../../../lib/sc-broker-command.js'
import {
  MsgVpnAclProfileSubscribeShareNameExceptionCreateRequest,
  MsgVpnAclProfileSubscribeShareNameExceptionCreateResponse,
} from '../../../../types/msgvpn-acl-profile-exceptions.js'

export default class BrokerAclProfileSubscribeShareNameExceptionsCreate extends ScBrokerCommand<
  typeof BrokerAclProfileSubscribeShareNameExceptionsCreate
> {
  static override args = {}
  static override description = `Create a subscribe share name exception for an ACL Profile on a Solace Event Broker.

Adds an exception to the ACL Profile for clients subscribing to specific shared subscriptions. The exception is expressed as a share name with optional wildcards and must specify the syntax type (smf or mqtt).`
  static override examples = [
    '<%= config.bin %> <%= command.id %> --name=myProfile --topic="orders/*" --syntax=smf',
    '<%= config.bin %> <%= command.id %> --name=myProfile --topic="devices/+" --syntax=mqtt',
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
      description: 'The syntax of the share name.',
      options: ['smf', 'mqtt'],
      required: true,
    }),
    topic: Flags.string({
      char: 't',
      description: 'The share name for the exception. May include wildcards.',
      required: true,
    }),
  }

  public async run(): Promise<MsgVpnAclProfileSubscribeShareNameExceptionCreateResponse> {
    const {flags} = await this.parse(BrokerAclProfileSubscribeShareNameExceptionsCreate)

    // Build request body
    const requestBody: MsgVpnAclProfileSubscribeShareNameExceptionCreateRequest = {
      subscribeShareNameException: flags.topic,
      subscribeShareNameExceptionSyntax: flags.syntax as 'mqtt' | 'smf',
    }

    // Make SEMP Config API call to create the exception
    const endpoint = `/SEMP/v2/config/msgVpns/${this.msgVpnName}/aclProfiles/${flags.name}/subscribeShareNameExceptions`
    const sempResp = await this.sempConn.post<MsgVpnAclProfileSubscribeShareNameExceptionCreateResponse>(
      endpoint,
      requestBody,
    )

    // Display results
    this.log(printObjectAsKeyValueTable(sempResp.data as unknown as Record<string, unknown>))

    return sempResp
  }
}
