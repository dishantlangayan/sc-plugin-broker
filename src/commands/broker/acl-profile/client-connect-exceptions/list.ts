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

  public async run(): Promise<MsgVpnAclProfileClientConnectExceptionsListResponse> {
    const {flags} = await this.parse(BrokerAclProfileClientConnectExceptionsList)
    const aclProfileName = flags['acl-profile-name']

    // Make SEMP Monitor API call to list exceptions
    const endpoint = `/SEMP/v2/monitor/msgVpns/${this.msgVpnName}/aclProfiles/${aclProfileName}/clientConnectExceptions`
    const sempResp = await this.sempConn.get<MsgVpnAclProfileClientConnectExceptionsListResponse>(endpoint)

    // Display results as a simple table
    if (sempResp.data.length === 0) {
      this.log('No exceptions found.')
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
