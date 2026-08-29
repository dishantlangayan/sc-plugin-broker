import {renderTable} from '@dishantlangayan/sc-cli-core'
import {Flags} from '@oclif/core'

import {ScBrokerCommand} from '../../../../lib/sc-broker-command.js'
import {MsgVpnAclProfileSubscribeTopicExceptionsListResponse} from '../../../../types/msgvpn-acl-profile-exceptions.js'

export default class BrokerAclProfileSubscribeTopicExceptionsList extends ScBrokerCommand<
  typeof BrokerAclProfileSubscribeTopicExceptionsList
> {
  static override args = {}
  static override description = `List subscribe topic exceptions for an ACL Profile from a Solace Event Broker.

Retrieves and displays all subscribe topic exceptions configured for the specified ACL Profile using the SEMP Monitor API.`
  static override examples = [
    '<%= config.bin %> <%= command.id %> --name=myProfile',
  ]
  static override flags = {
    ...ScBrokerCommand.baseFlags,
    name: Flags.string({
      char: 'n',
      description: 'The name of the ACL Profile.',
      required: true,
    }),
  }

  public async run(): Promise<MsgVpnAclProfileSubscribeTopicExceptionsListResponse> {
    const {flags} = await this.parse(BrokerAclProfileSubscribeTopicExceptionsList)
    const aclProfileName = flags.name

    // Make SEMP Monitor API call to list exceptions
    const endpoint = `/SEMP/v2/monitor/msgVpns/${this.msgVpnName}/aclProfiles/${aclProfileName}/subscribeTopicExceptions`
    const sempResp = await this.sempConn.get<MsgVpnAclProfileSubscribeTopicExceptionsListResponse>(endpoint)

    // Display results as a two-column table
    if (sempResp.data.length === 0) {
      this.log('\nNo exceptions found.')
    } else {
      const table = [
        ['Subscribe Topic Exception', 'Syntax'],
        ...sempResp.data.map(exc => [exc.subscribeTopicException || '', exc.subscribeTopicExceptionSyntax || '']),
      ]
      this.log(renderTable(table))
    }

    return sempResp
  }
}
