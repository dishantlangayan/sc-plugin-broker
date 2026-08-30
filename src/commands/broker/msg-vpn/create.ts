import {printObjectAsKeyValueTable} from '@dishantlangayan/sc-cli-core'
import {Flags} from '@oclif/core'

import {ScBrokerCommand} from '../../../lib/sc-broker-command.js'
import {MsgVpnAuthenticationBasicType, MsgVpnCreateRequest, MsgVpnCreateResponse} from '../../../types/msgvpn.js'

export default class BrokerMsgVpnCreate extends ScBrokerCommand<typeof BrokerMsgVpnCreate> {
  static override args = {}
  static override baseFlags = ScBrokerCommand.brokerFlags
  static override description = `Create a Message VPN on a Solace Event Broker.`
  static override examples = [
    '<%= config.bin %> <%= command.id %> --name=myVpn',
    '<%= config.bin %> <%= command.id %> --name=myVpn --no-enabled --max-connection-count=100 --max-msg-spool-usage=1024',
    '<%= config.bin %> <%= command.id %> --name=myVpn --authentication-basic-type=internal --authentication-basic-enabled',
  ]
  static override flags = {    ...ScBrokerCommand.brokerFlags,
    'authentication-basic-enabled': Flags.boolean({
      allowNo: true,
      description: 'Enable or disable basic authentication for clients connecting to the Message VPN.',
    }),
    'authentication-basic-type': Flags.string({
      description: 'The type of basic authentication to use for clients connecting to the Message VPN.',
      options: ['internal', 'ldap', 'none', 'radius'],
    }),
    enabled: Flags.boolean({
      allowNo: true,
      default: true,
      description: 'Enable (default) or disable the Message VPN.',
    }),
    'event-large-msg-threshold': Flags.integer({
      description: 'The threshold, in kilobytes, after which a message is considered to be large.',
      min: 0,
    }),
    'max-connection-count': Flags.integer({
      description: 'The maximum number of client connections to the Message VPN.',
      min: 0,
    }),
    'max-egress-flow-count': Flags.integer({
      description: 'The maximum number of transmit flows that can be created in the Message VPN.',
      min: 0,
    }),
    'max-endpoint-count': Flags.integer({
      description: 'The maximum number of Queues and Topic Endpoints that can be created in the Message VPN.',
      min: 0,
    }),
    'max-ingress-flow-count': Flags.integer({
      description: 'The maximum number of receive flows that can be created in the Message VPN.',
      min: 0,
    }),
    'max-msg-spool-usage': Flags.integer({
      char: 's',
      description: 'The maximum message spool usage by the Message VPN, in megabytes (MB).',
      min: 0,
    }),
    'max-subscription-count': Flags.integer({
      description: 'The maximum number of local subscriptions that can be added to the Message VPN.',
      min: 0,
    }),
    'max-transacted-session-count': Flags.integer({
      description: 'The maximum number of transacted sessions that can be created in the Message VPN.',
      min: 0,
    }),
    'max-transaction-count': Flags.integer({
      description: 'The maximum number of transactions that can be created in the Message VPN.',
      min: 0,
    }),
    name: Flags.string({
      char: 'n',
      description: 'The name of the Message VPN to create.',
      required: true,
    }),
  }
  // This command manages Message VPNs directly; the target VPN is identified
  // by the --name flag rather than the VPN-scoped -v/--msg-vpn-name flag.
  protected override resolveMsgVpn = false

  public async run(): Promise<MsgVpnCreateResponse> {
    const {flags} = await this.parse(BrokerMsgVpnCreate)

    // Message VPNs cannot be created on Solace Cloud brokers (they are
    // provisioned with a single, fixed Message VPN).
    const brokerAuth = await this.getBrokerAuth()
    if (brokerAuth.isSolaceCloud) {
      this.error(
        'Message VPNs cannot be created on a Solace Cloud broker. Cloud brokers are provisioned with a single Message VPN.',
        {exit: 2},
      )
    }

    // Build Message VPN creation request body
    const vpnBody: MsgVpnCreateRequest = this.buildMsgVpnRequest(flags)

    // Make SEMP Config API call to create the Message VPN
    const endpoint = `/SEMP/v2/config/msgVpns`
    const sempResp = await this.sempConn.post<MsgVpnCreateResponse>(endpoint, vpnBody)

    // Display results
    this.log(printObjectAsKeyValueTable(sempResp.data as unknown as Record<string, unknown>))

    return sempResp
  }

  /**
   * Builds the Message VPN creation request body from command flags
   */
  private buildMsgVpnRequest(flags: {
    'authentication-basic-enabled'?: boolean
    'authentication-basic-type'?: string
    enabled?: boolean
    'event-large-msg-threshold'?: number
    'max-connection-count'?: number
    'max-egress-flow-count'?: number
    'max-endpoint-count'?: number
    'max-ingress-flow-count'?: number
    'max-msg-spool-usage'?: number
    'max-subscription-count'?: number
    'max-transacted-session-count'?: number
    'max-transaction-count'?: number
    name: string
  }): MsgVpnCreateRequest {
    return {
      msgVpnName: flags.name,
      ...(flags['authentication-basic-enabled'] !== undefined && {
        authenticationBasicEnabled: flags['authentication-basic-enabled'],
      }),
      ...(flags['authentication-basic-type'] && {
        authenticationBasicType: flags['authentication-basic-type'] as MsgVpnAuthenticationBasicType,
      }),
      ...(flags.enabled !== undefined && {enabled: flags.enabled}),
      ...(flags['event-large-msg-threshold'] !== undefined && {eventLargeMsgThreshold: flags['event-large-msg-threshold']}),
      ...(flags['max-connection-count'] !== undefined && {maxConnectionCount: flags['max-connection-count']}),
      ...(flags['max-egress-flow-count'] !== undefined && {maxEgressFlowCount: flags['max-egress-flow-count']}),
      ...(flags['max-endpoint-count'] !== undefined && {maxEndpointCount: flags['max-endpoint-count']}),
      ...(flags['max-ingress-flow-count'] !== undefined && {maxIngressFlowCount: flags['max-ingress-flow-count']}),
      ...(flags['max-msg-spool-usage'] !== undefined && {maxMsgSpoolUsage: flags['max-msg-spool-usage']}),
      ...(flags['max-subscription-count'] !== undefined && {maxSubscriptionCount: flags['max-subscription-count']}),
      ...(flags['max-transacted-session-count'] !== undefined && {
        maxTransactedSessionCount: flags['max-transacted-session-count'],
      }),
      ...(flags['max-transaction-count'] !== undefined && {maxTransactionCount: flags['max-transaction-count']}),
    }
  }
}
