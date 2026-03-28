import {printObjectAsKeyValueTable} from '@dishantlangayan/sc-cli-core'
import {Flags} from '@oclif/core'

import {ScBrokerCommand} from '../../../lib/sc-broker-command.js'
import {MsgVpnQueueUpdateRequest, MsgVpnQueueUpdateResponse} from '../../../types/msgvpn-queue.js'

export default class BrokerQueueUpdate extends ScBrokerCommand<typeof BrokerQueueUpdate> {
  static override args = {}
  static override description = `Update a Queue on a Solace Event Broker.

Any attribute missing from the request will be left unchanged. The update of instances of this object are synchronized to HA mates and replication sites via config-sync.`
  static override examples = [
    '<%= config.bin %> <%= command.id %> --broker-name=dev-broker --queue-name=myQueue --msg-vpn-name=default --egress-enabled',
    '<%= config.bin %> <%= command.id %> --broker-id=dev-broker --queue-name=myQueue --msg-vpn-name=default --max-msg-spool-usage=2048',
    '<%= config.bin %> <%= command.id %> --broker-name=dev-broker --queue-name=myQueue --msg-vpn-name=default --max-msg-spool-usage=1024 --max-ttl=3600',
    '<%= config.bin %> <%= command.id %> --queue-name=myQueue --owner=newowner',
    '<%= config.bin %> <%= command.id %> --queue-name=myQueue --permission=read-only --no-egress-enabled',
  ]
  static override flags = {
    ...ScBrokerCommand.baseFlags,
    'access-type': Flags.string({
      char: 'a',
      description: 'The access type for the queue.',
      options: ['exclusive', 'non-exclusive'],
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
    owner: Flags.string({
      char: 'o',
      description: 'The client username that owns the queue and has permission equivalent to delete.',
    }),
    permission: Flags.string({
      char: 'p',
      description: 'The permission level for all consumers of the queue, excluding the owner.',
      options: ['consume', 'delete', 'modify-topic', 'no-access', 'read-only'],
    }),
    'queue-name': Flags.string({
      char: 'q',
      description: 'The name of the queue to update.',
      required: true,
    }),
    'respect-ttl-enabled': Flags.boolean({
      allowNo: true,
      description: 'Enable or disable the respecting of the time-to-live (TTL) for messages.',
    }),
  }

  public async run(): Promise<MsgVpnQueueUpdateResponse> {
    const {flags} = await this.parse(BrokerQueueUpdate)

    // Build queue update request body (only includes provided flags)
    const updateBody: MsgVpnQueueUpdateRequest = this.buildQueueUpdateRequest(flags)

    // Make SEMP Config API call to update the queue
    const queueName = flags['queue-name']
    const endpoint = `/SEMP/v2/config/msgVpns/${this.msgVpnName}/queues/${queueName}`
    const sempResp = await this.sempConn.patch<MsgVpnQueueUpdateResponse>(endpoint, updateBody)

    // Display results
    this.log(printObjectAsKeyValueTable(sempResp.data as unknown as Record<string, unknown>))

    return sempResp
  }

  /**
   * Builds the queue update request body from command flags
   * Only includes fields that were explicitly provided
   * Does NOT include queueName (it goes in the URL path)
   */
  private buildQueueUpdateRequest(flags: {
    'access-type'?: string
    'dead-msg-queue'?: string
    'egress-enabled'?: boolean
    'ingress-enabled'?: boolean
    'max-msg-spool-usage'?: number
    'max-redelivery-count'?: number
    'max-ttl'?: number
    owner?: string
    permission?: string
    'respect-ttl-enabled'?: boolean
  }): MsgVpnQueueUpdateRequest {
    return {
      ...(flags['access-type'] && {accessType: flags['access-type'] as 'exclusive' | 'non-exclusive'}),
      ...(flags['dead-msg-queue'] && {deadMsgQueue: flags['dead-msg-queue']}),
      ...(flags['egress-enabled'] !== undefined && {egressEnabled: flags['egress-enabled']}),
      ...(flags['ingress-enabled'] !== undefined && {ingressEnabled: flags['ingress-enabled']}),
      ...(flags['max-msg-spool-usage'] !== undefined && {maxMsgSpoolUsage: flags['max-msg-spool-usage']}),
      ...(flags['max-redelivery-count'] !== undefined && {maxRedeliveryCount: flags['max-redelivery-count']}),
      ...(flags['max-ttl'] !== undefined && {maxTtl: flags['max-ttl']}),
      ...(flags.owner !== undefined && {owner: flags.owner}),
      ...(flags.permission && {
        permission: flags.permission as 'consume' | 'delete' | 'modify-topic' | 'no-access' | 'read-only',
      }),
      ...(flags['respect-ttl-enabled'] !== undefined && {respectTtlEnabled: flags['respect-ttl-enabled']}),
    }
  }

}
