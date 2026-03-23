import {printObjectAsKeyValueTable, ScCommand, ScConnection} from '@dishantlangayan/sc-cli-core'
import {Flags} from '@oclif/core'

import {resolveBrokerConnection} from '../../../lib/broker-utils.js'
import {MsgVpnQueueCreateRequest, MsgVpnQueueCreateResponse} from '../../../types/msgvpn-queue.js'

export default class BrokerQueueCreate extends ScCommand<typeof BrokerQueueCreate> {
  static override args = {}
  static override description = `Create a Queue on a Solace Event Broker.

Any attribute missing from the request will be set to its default value. The creation of instances of this object are synchronized to HA mates and replication sites via config-sync.`
static override examples = [
    '<%= config.bin %> <%= command.id %> --broker-name=dev-broker --queue-name=myQueue --msg-vpn-name=default',
    '<%= config.bin %> <%= command.id %> --broker-id=dev-broker --queue-name=myQueue --msg-vpn-name=default --access-type=non-exclusive',
    '<%= config.bin %> <%= command.id %> --broker-name=dev-broker --queue-name=myQueue --msg-vpn-name=default --owner=user1 --permission=consume',
    '<%= config.bin %> <%= command.id %> --broker-name=dev-broker --queue-name=myQueue --msg-vpn-name=default --max-msg-spool-usage=1024 --egress-enabled --ingress-enabled',
    '<%= config.bin %> <%= command.id %> --broker-name=dev-broker --queue-name=myQueue --msg-vpn-name=default --dead-msg-queue=#DEAD_MSG_QUEUE --max-redelivery-count=3',
  ]
static override flags = {
    'access-type': Flags.string({
      char: 'a',
      description: 'The access type for the queue.',
      options: ['exclusive', 'non-exclusive'],
    }),
    'broker-id': Flags.string({
      char: 'b',
      description: 'Stored broker identifier.',
      exactlyOne: ['broker-id', 'broker-name'],
    }),
    'broker-name': Flags.string({
      char: 'n',
      description: 'Stored broker name.',
      exactlyOne: ['broker-id', 'broker-name'],
    }),
    'dead-msg-queue': Flags.string({
      description: 'The name of the Dead Message Queue.',
    }),
    'egress-enabled': Flags.boolean({
      allowNo: true,
      description: 'Enable or disable egress (message consumption) from the queue.',
    }),
    'ingress-enabled': Flags.boolean({
      allowNo: true,
      description: 'Enable or disable ingress (message reception) to the queue.',
    }),
    'max-msg-spool-usage': Flags.integer({
      char: 's',
      description: 'The maximum message spool usage allowed by the queue, in megabytes (MB).',
      min: 0,
    }),
    'max-redelivery-count': Flags.integer({
      description: 'The maximum number of times a message will be redelivered before it is discarded or moved to the DMQ.',
      min: 0,
    }),
    'max-ttl': Flags.integer({
      description: 'The maximum time in seconds a message can stay in the queue when respect-ttl-enabled is true.',
      min: 0,
    }),
    'msg-vpn-name': Flags.string({
      char: 'v',
      description: 'The name of the Message VPN.',
      required: true,
    }),
    owner: Flags.string({
      char: 'o',
      description: 'The client username that owns the queue and has permission equivalent to delete.',
    }),
    permission: Flags.string({
      char: 'p',
      default: 'consume',
      description: 'The permission level for all consumers of the queue, excluding the owner.',
      options: ['consume', 'delete', 'modify-topic', 'no-access', 'read-only'],
    }),
    'queue-name': Flags.string({
      char: 'q',
      description: 'The name of the queue to create.',
      required: true,
    }),
    'respect-ttl-enabled': Flags.boolean({
      allowNo: true,
      description: 'Enable or disable the respecting of the time-to-live (TTL) for messages.',
    }),
  }

  public async run(): Promise<MsgVpnQueueCreateResponse> {
    const {flags} = await this.parse(BrokerQueueCreate)

    // Resolve broker identifier (broker-id OR broker-name are aliases)
    const brokerIdentifier = flags['broker-id'] ?? flags['broker-name'] ?? ''

    // Create SEMP connection using stored credentials
    const sempConn: ScConnection = await resolveBrokerConnection(this, brokerIdentifier)

    // Build queue creation request body
    const queueBody: MsgVpnQueueCreateRequest = this.buildQueueRequest(flags)

    // Make SEMP Config API call to create the queue
    const endpoint = `/SEMP/v2/config/msgVpns/${flags['msg-vpn-name']}/queues`
    const sempResp = await sempConn.post<MsgVpnQueueCreateResponse>(endpoint, queueBody)

    // Display results
    this.log(printObjectAsKeyValueTable(sempResp.data as unknown as Record<string, unknown>))

    return sempResp
  }

  /**
   * Builds the queue creation request body from command flags
   */
  private buildQueueRequest(flags: {
    'access-type'?: string
    'dead-msg-queue'?: string
    'egress-enabled'?: boolean
    'ingress-enabled'?: boolean
    'max-msg-spool-usage'?: number
    'max-redelivery-count'?: number
    'max-ttl'?: number
    owner?: string
    permission?: string
    'queue-name': string
    'respect-ttl-enabled'?: boolean
  }): MsgVpnQueueCreateRequest {
    return {
      queueName: flags['queue-name'],
      ...(flags['access-type'] && {accessType: flags['access-type'] as 'exclusive' | 'non-exclusive'}),
      ...(flags['dead-msg-queue'] && {deadMsgQueue: flags['dead-msg-queue']}),
      ...(flags['egress-enabled'] !== undefined && {egressEnabled: flags['egress-enabled']}),
      ...(flags['ingress-enabled'] !== undefined && {ingressEnabled: flags['ingress-enabled']}),
      ...(flags['max-msg-spool-usage'] !== undefined && {maxMsgSpoolUsage: flags['max-msg-spool-usage']}),
      ...(flags['max-redelivery-count'] !== undefined && {maxRedeliveryCount: flags['max-redelivery-count']}),
      ...(flags['max-ttl'] !== undefined && {maxTtl: flags['max-ttl']}),
      ...(flags.owner && {owner: flags.owner}),
      ...(flags.permission && {
        permission: flags.permission as 'consume' | 'delete' | 'modify-topic' | 'no-access' | 'read-only',
      }),
      ...(flags['respect-ttl-enabled'] !== undefined && {respectTtlEnabled: flags['respect-ttl-enabled']}),
    }
  }

}
