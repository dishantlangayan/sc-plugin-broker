import {printObjectAsKeyValueTable} from '@dishantlangayan/sc-cli-core'
import {Flags} from '@oclif/core'

import {ScBrokerCommand} from '../../../lib/sc-broker-command.js'
import {MsgVpnAclProfileMonitorResponse} from '../../../types/msgvpn-acl-profile.js'

export default class BrokerAclProfileDisplay extends ScBrokerCommand<typeof BrokerAclProfileDisplay> {
  static override args = {}
  static override description = `Display ACL Profile information from a Solace Event Broker.

Retrieves and displays detailed information about an ACL Profile using the SEMP Monitor API, including configuration and default actions.`
  static override examples = [
    '<%= config.bin %> <%= command.id %> --name=myProfile',
  ]
  static override flags = {
    ...ScBrokerCommand.baseFlags,
    name: Flags.string({
      char: 'n',
      description: 'The name of the ACL Profile to display.',
      required: true,
    }),
  }

  public async run(): Promise<MsgVpnAclProfileMonitorResponse> {
    const {flags} = await this.parse(BrokerAclProfileDisplay)

    // Fetch ACL profile details from Monitor API
    const endpoint = `/SEMP/v2/monitor/msgVpns/${this.msgVpnName}/aclProfiles/${flags.name}`
    const aclProfileResp = await this.sempConn.get<MsgVpnAclProfileMonitorResponse>(endpoint)

    // Display ACL profile details
    this.log('\n=== ACL Profile Details ===\n')
    this.log(printObjectAsKeyValueTable(aclProfileResp.data as unknown as Record<string, unknown>))

    return aclProfileResp
  }
}
