import {printObjectAsKeyValueTable} from '@dishantlangayan/sc-cli-core'
import {Flags} from '@oclif/core'

import {ScBrokerCommand} from '../../../lib/sc-broker-command.js'
import {MsgVpnClientProfileMonitorResponse} from '../../../types/msgvpn-client-profile.js'

export default class BrokerClientProfileDisplay extends ScBrokerCommand<typeof BrokerClientProfileDisplay> {
  static override args = {}
  static override description = `Display a Client Profile from a Solace Event Broker.

Retrieves and displays detailed information about a specific Client Profile using the SEMP Monitor API.`
  static override examples = [
    '<%= config.bin %> <%= command.id %> --name=myProfile',
  ]
  static override flags = {
    ...ScBrokerCommand.baseFlags,
    name: Flags.string({
      char: 'n',
      description: 'The name of the client profile to display.',
      required: true,
    }),
  }

  public async run(): Promise<MsgVpnClientProfileMonitorResponse> {
    const {flags} = await this.parse(BrokerClientProfileDisplay)
    const clientProfileName = flags.name

    // Fetch client profile from SEMP Monitor API
    const endpoint = `/SEMP/v2/monitor/msgVpns/${this.msgVpnName}/clientProfiles/${clientProfileName}`
    const profileResp = await this.sempConn.get<MsgVpnClientProfileMonitorResponse>(endpoint)

    // Display results
    this.log('\n=== Client Profile Details ===\n')
    this.log(printObjectAsKeyValueTable(profileResp.data as unknown as Record<string, unknown>))

    return profileResp
  }
}
