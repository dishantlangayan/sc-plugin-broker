import {renderTable} from '@dishantlangayan/sc-cli-core'
import {Flags} from '@oclif/core'

import {ScBrokerCommand} from '../../../../lib/sc-broker-command.js'
import {MsgVpnAclProfilePublishTopicExceptionsListResponse} from '../../../../types/msgvpn-acl-profile-exceptions.js'

export default class BrokerAclProfilePublishTopicExceptionsList extends ScBrokerCommand<
  typeof BrokerAclProfilePublishTopicExceptionsList
> {
  static override args = {}
  static override description = `List publish topic exceptions for an ACL Profile from a Solace Event Broker.

Retrieves and displays all publish topic exceptions configured for the specified ACL Profile using the SEMP Monitor API.`
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

  public async run(): Promise<MsgVpnAclProfilePublishTopicExceptionsListResponse> {
    const {flags} = await this.parse(BrokerAclProfilePublishTopicExceptionsList)
    const aclProfileName = flags.name

    // Make SEMP Monitor API call to list exceptions
    const endpoint = `/SEMP/v2/monitor/msgVpns/${this.msgVpnName}/aclProfiles/${aclProfileName}/publishTopicExceptions`
    const sempResp = await this.sempConn.get<MsgVpnAclProfilePublishTopicExceptionsListResponse>(endpoint)

    // Display results as a two-column table
    if (sempResp.data.length === 0) {
      this.log('No exceptions found.')
    } else {
      const table = [
        ['Publish Topic Exception', 'Syntax'],
        ...sempResp.data.map(exc => [exc.publishTopicException || '', exc.publishTopicExceptionSyntax || '']),
      ]
      this.log(renderTable(table))
    }

    return sempResp
  }
}
