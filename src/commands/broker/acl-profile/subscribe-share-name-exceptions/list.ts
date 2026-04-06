import {renderTable} from '@dishantlangayan/sc-cli-core'
import {Flags} from '@oclif/core'

import {ScBrokerCommand} from '../../../../lib/sc-broker-command.js'
import {MsgVpnAclProfileSubscribeShareNameExceptionsListResponse} from '../../../../types/msgvpn-acl-profile-exceptions.js'

export default class BrokerAclProfileSubscribeShareNameExceptionsList extends ScBrokerCommand<
  typeof BrokerAclProfileSubscribeShareNameExceptionsList
> {
  static override args = {}
  static override description = `List subscribe share name exceptions for an ACL Profile from a Solace Event Broker.

Retrieves and displays all subscribe share name exceptions configured for the specified ACL Profile using the SEMP Monitor API.`
  static override examples = [
    '<%= config.bin %> <%= command.id %> --acl-profile-name=myProfile',
    '<%= config.bin %> <%= command.id %> --broker-name=dev-broker --acl-profile-name=myProfile --msg-vpn-name=default',
  ]
  static override flags = {
    ...ScBrokerCommand.baseFlags,
    'acl-profile-name': Flags.string({
      char: 'a',
      description: 'The name of the ACL Profile.',
      required: true,
    }),
  }

  public async run(): Promise<MsgVpnAclProfileSubscribeShareNameExceptionsListResponse> {
    const {flags} = await this.parse(BrokerAclProfileSubscribeShareNameExceptionsList)
    const aclProfileName = flags['acl-profile-name']

    // Make SEMP Monitor API call to list exceptions
    const endpoint = `/SEMP/v2/monitor/msgVpns/${this.msgVpnName}/aclProfiles/${aclProfileName}/subscribeShareNameExceptions`
    const sempResp = await this.sempConn.get<MsgVpnAclProfileSubscribeShareNameExceptionsListResponse>(endpoint)

    // Display results as a two-column table
    if (sempResp.data.length === 0) {
      this.log('No exceptions found.')
    } else {
      const table = [
        ['Subscribe Share Name Exception', 'Syntax'],
        ...sempResp.data.map(exc => [exc.subscribeShareNameException || '', exc.subscribeShareNameExceptionSyntax || '']),
      ]
      this.log(renderTable(table))
    }

    return sempResp
  }
}
