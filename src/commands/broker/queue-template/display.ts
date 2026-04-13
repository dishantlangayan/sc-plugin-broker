import {printObjectAsKeyValueTable} from '@dishantlangayan/sc-cli-core'
import {Flags} from '@oclif/core'

import {ScBrokerCommand} from '../../../lib/sc-broker-command.js'
import {MsgVpnQueueTemplateMonitorResponse} from '../../../types/msgvpn-queue-template.js'

export default class BrokerQueueTemplateDisplay extends ScBrokerCommand<typeof BrokerQueueTemplateDisplay> {
  static override args = {}
  static override description = `Display queue template information from a Solace Event Broker.

Retrieves and displays detailed information about a queue template using the SEMP Monitor API, including configuration and state.`
  static override examples = [
    '<%= config.bin %> <%= command.id %> --queue-template-name=myTemplate --msg-vpn-name=default',
    '<%= config.bin %> <%= command.id %> --broker-name=dev-broker --queue-template-name=myTemplate --msg-vpn-name=default',
    '<%= config.bin %> <%= command.id %> --queue-template-name=myTemplate',
  ]
  static override flags = {
    ...ScBrokerCommand.baseFlags,
    'queue-template-name': Flags.string({
      char: 't',
      description: 'The name of the queue template to display.',
      required: true,
    }),
  }

  public async run(): Promise<{queueTemplate: MsgVpnQueueTemplateMonitorResponse}> {
    const {flags} = await this.parse(BrokerQueueTemplateDisplay)

    // Fetch queue template details from Monitor API
    const endpoint = `/SEMP/v2/monitor/msgVpns/${this.msgVpnName}/queueTemplates/${flags['queue-template-name']}`
    const queueTemplateResp = await this.sempConn.get<MsgVpnQueueTemplateMonitorResponse>(endpoint)

    // Display queue template details
    this.log('\n=== Queue Template Details ===\n')
    this.log(printObjectAsKeyValueTable(queueTemplateResp.data as unknown as Record<string, unknown>))

    return {queueTemplate: queueTemplateResp}
  }
}
