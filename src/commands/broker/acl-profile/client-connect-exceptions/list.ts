import {renderTable} from '@dishantlangayan/sc-cli-core'
import {Flags} from '@oclif/core'

import {ScBrokerCommand} from '../../../../lib/sc-broker-command.js'
import {MsgVpnAclProfileClientConnectExceptionsListResponse} from '../../../../types/msgvpn-acl-profile-exceptions.js'

export default class BrokerAclProfileClientConnectExceptionsList extends ScBrokerCommand<
  typeof BrokerAclProfileClientConnectExceptionsList
> {
  static override args = {}
  static override description = `List client connect exceptions for an ACL Profile from a Solace Event Broker.

Retrieves and displays all client connect exceptions configured for the specified ACL Profile using the SEMP Monitor API.`
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

  public async run(): Promise<MsgVpnAclProfileClientConnectExceptionsListResponse> {
    const {flags} = await this.parse(BrokerAclProfileClientConnectExceptionsList)

    // Make SEMP Monitor API call to list exceptions
    const endpoint = `/SEMP/v2/monitor/msgVpns/${this.msgVpnName}/aclProfiles/${flags.name}/clientConnectExceptions`
    const sempResp = await this.sempConn.get<MsgVpnAclProfileClientConnectExceptionsListResponse>(endpoint)

    // Display results as a simple table
    if (sempResp.data.length === 0) {
      this.log('\nNo exceptions found.')
    } else {
      const table = [
        ['Client Connect Exception Address'],
        ...sempResp.data.map(exc => [exc.clientConnectExceptionAddress || '']),
      ]
      this.log(renderTable(table))
    }

    return sempResp
  }
}
