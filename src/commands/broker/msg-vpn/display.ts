import {printObjectAsKeyValueTable} from '@dishantlangayan/sc-cli-core'
import {Flags} from '@oclif/core'

import {ScBrokerCommand} from '../../../lib/sc-broker-command.js'
import {MsgVpnMonitorResponse} from '../../../types/msgvpn.js'

export default class BrokerMsgVpnDisplay extends ScBrokerCommand<typeof BrokerMsgVpnDisplay> {
  static override args = {}
  static override baseFlags = ScBrokerCommand.brokerFlags
  static override description = `Display Message VPN information from a Solace Event Broker.

Retrieves and displays detailed information about a Message VPN using the SEMP Monitor API, including operational state, statistics, and configuration.`
  static override examples = ['<%= config.bin %> <%= command.id %> --name=myVpn']
  static override flags = {    ...ScBrokerCommand.brokerFlags,
    name: Flags.string({
      char: 'n',
      description: 'The name of the Message VPN to display.',
      required: true,
    }),
  }
  // This command manages Message VPNs directly; the target VPN is identified
  // by the --name flag rather than the VPN-scoped -v/--msg-vpn-name flag.
  protected override resolveMsgVpn = false

  public async run(): Promise<MsgVpnMonitorResponse> {
    const {flags} = await this.parse(BrokerMsgVpnDisplay)

    // Fetch Message VPN details from Monitor API
    const endpoint = `/SEMP/v2/monitor/msgVpns/${flags.name}`
    const sempResp = await this.sempConn.get<MsgVpnMonitorResponse>(endpoint)

    // Display results
    this.log('\n=== Message VPN Details ===\n')
    this.log(printObjectAsKeyValueTable(sempResp.data as unknown as Record<string, unknown>))

    return sempResp
  }
}
