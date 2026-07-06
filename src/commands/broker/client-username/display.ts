import {printObjectAsKeyValueTable} from '@dishantlangayan/sc-cli-core'
import {Flags} from '@oclif/core'

import {ScBrokerCommand} from '../../../lib/sc-broker-command.js'
import {MsgVpnClientUsernameMonitorResponse} from '../../../types/msgvpn-client-username.js'

export default class BrokerClientUsernameDisplay extends ScBrokerCommand<typeof BrokerClientUsernameDisplay> {
  static override args = {}
  static override description = `Display Client Username information from a Solace Event Broker.

Retrieves and displays detailed information about a Client Username using the SEMP Monitor API, including configuration settings and associated profiles.`
  static override examples = [
    '<%= config.bin %> <%= command.id %> --username=user1',
  ]
  static override flags = {
    ...ScBrokerCommand.baseFlags,
    username: Flags.string({
      char: 'u',
      description: 'The name of the Client Username to display.',
      required: true,
    }),
  }

  public async run(): Promise<MsgVpnClientUsernameMonitorResponse> {
    const {flags} = await this.parse(BrokerClientUsernameDisplay)

    // Fetch from Monitor API
    const endpoint = `/SEMP/v2/monitor/msgVpns/${this.msgVpnName}/clientUsernames/${flags.username}`
    const clientUsernameResp = await this.sempConn.get<MsgVpnClientUsernameMonitorResponse>(endpoint)

    // Display details
    this.log('\n=== Client Username Details ===\n')
    this.log(printObjectAsKeyValueTable(clientUsernameResp.data as unknown as Record<string, unknown>))

    return clientUsernameResp
  }
}
