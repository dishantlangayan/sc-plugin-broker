import {printObjectAsKeyValueTable} from '@dishantlangayan/sc-cli-core'
import {Flags} from '@oclif/core'

import {ScBrokerCommand} from '../../../lib/sc-broker-command.js'
import {MsgVpnQueueTemplateUpdateRequest, MsgVpnQueueTemplateUpdateResponse} from '../../../types/msgvpn-queue-template.js'

export default class BrokerQueueTemplateUpdate extends ScBrokerCommand<typeof BrokerQueueTemplateUpdate> {
  static override args = {}
  static override description = `Update a Queue Template on a Solace Event Broker.

Any attribute missing from the request will be left unchanged. The update of instances of this object are synchronized to HA mates and replication sites via config-sync.`
  static override examples = [
    '<%= config.bin %> <%= command.id %> --broker-name=dev-broker --queue-template-name=myTemplate --msg-vpn-name=default --permission=consume',
    '<%= config.bin %> <%= command.id %> --broker-id=dev-broker --queue-template-name=myTemplate --msg-vpn-name=default --max-msg-spool-usage=2048',
    '<%= config.bin %> <%= command.id %> --broker-name=dev-broker --queue-template-name=myTemplate --msg-vpn-name=default --max-msg-spool-usage=1024 --max-ttl=3600',
    '<%= config.bin %> <%= command.id %> --queue-template-name=myTemplate --queue-name-filter="order.*"',
    '<%= config.bin %> <%= command.id %> --queue-template-name=myTemplate --permission=read-only --max-bind-count=200',
  ]
  static override flags = {
    ...ScBrokerCommand.baseFlags,
    'access-type': Flags.string({
      char: 'a',
      description: 'The access type for queues created from this template.',
      options: ['exclusive', 'non-exclusive'],
    }),
    'dead-msg-queue': Flags.string({
      description: 'The name of the Dead Message Queue.',
    }),
    'durability-override': Flags.string({
      description: 'Controls the durability of queues created from this template, overriding the requested durability.',
      options: ['none', 'non-durable', 'durable'],
    }),
    'max-bind-count': Flags.integer({
      description: 'The maximum number of consumer flows that can bind to queues created from this template.',
      min: 0,
    }),
    'max-delivered-unacked-msgs-per-flow': Flags.integer({
      description: 'The maximum number of messages delivered but not acknowledged per flow.',
      min: 0,
    }),
    'max-msg-size': Flags.integer({
      description: 'The maximum message size allowed in queues created from this template, in bytes.',
      min: 0,
    }),
    'max-msg-spool-usage': Flags.integer({
      char: 's',
      description: 'The maximum message spool usage allowed by queues created from this template, in megabytes (MB).',
      min: 0,
    }),
    'max-redelivery-count': Flags.integer({
      description: 'The maximum number of times a message will be redelivered before it is discarded or moved to the DMQ.',
      min: 0,
    }),
    'max-ttl': Flags.integer({
      description: 'The maximum time in seconds a message can stay in queues created from this template when respect-ttl-enabled is true.',
      min: 0,
    }),
    permission: Flags.string({
      char: 'p',
      description: 'The permission level for all consumers of queues created from this template, excluding the owner.',
      options: ['consume', 'delete', 'modify-topic', 'no-access', 'read-only'],
    }),
    'queue-name-filter': Flags.string({
      char: 'f',
      description: 'A wildcarded pattern to match queue names for applying this template. Supports * and > wildcards.',
    }),
    'queue-template-name': Flags.string({
      char: 't',
      description: 'The name of the queue template to update.',
      required: true,
    }),
  }

  public async run(): Promise<MsgVpnQueueTemplateUpdateResponse> {
    const {flags} = await this.parse(BrokerQueueTemplateUpdate)

    // Build queue template update request body (only includes provided flags)
    const updateBody: MsgVpnQueueTemplateUpdateRequest = this.buildUpdateRequest(flags)

    // Make SEMP Config API call to update the queue template
    const queueTemplateName = flags['queue-template-name']
    const endpoint = `/SEMP/v2/config/msgVpns/${this.msgVpnName}/queueTemplates/${queueTemplateName}`
    const sempResp = await this.sempConn.patch<MsgVpnQueueTemplateUpdateResponse>(endpoint, updateBody)

    // Display results
    this.log(printObjectAsKeyValueTable(sempResp.data as unknown as Record<string, unknown>))

    return sempResp
  }

  /**
   * Builds the queue template update request body from command flags
   * Only includes fields that were explicitly provided
   * Does NOT include queueTemplateName (it goes in the URL path)
   */
  private buildUpdateRequest(flags: {
    'access-type'?: string
    'dead-msg-queue'?: string
    'durability-override'?: string
    'max-bind-count'?: number
    'max-delivered-unacked-msgs-per-flow'?: number
    'max-msg-size'?: number
    'max-msg-spool-usage'?: number
    'max-redelivery-count'?: number
    'max-ttl'?: number
    permission?: string
    'queue-name-filter'?: string
  }): MsgVpnQueueTemplateUpdateRequest {
    return {
      ...(flags['access-type'] && {accessType: flags['access-type'] as 'exclusive' | 'non-exclusive'}),
      ...(flags['dead-msg-queue'] !== undefined && {deadMsgQueue: flags['dead-msg-queue']}),
      ...(flags['durability-override'] && {
        durabilityOverride: flags['durability-override'] as 'durable' | 'non-durable' | 'none',
      }),
      ...(flags['max-bind-count'] !== undefined && {maxBindCount: flags['max-bind-count']}),
      ...(flags['max-delivered-unacked-msgs-per-flow'] !== undefined && {
        maxDeliveredUnackedMsgsPerFlow: flags['max-delivered-unacked-msgs-per-flow'],
      }),
      ...(flags['max-msg-size'] !== undefined && {maxMsgSize: flags['max-msg-size']}),
      ...(flags['max-msg-spool-usage'] !== undefined && {maxMsgSpoolUsage: flags['max-msg-spool-usage']}),
      ...(flags['max-redelivery-count'] !== undefined && {maxRedeliveryCount: flags['max-redelivery-count']}),
      ...(flags['max-ttl'] !== undefined && {maxTtl: flags['max-ttl']}),
      ...(flags.permission && {
        permission: flags.permission as 'consume' | 'delete' | 'modify-topic' | 'no-access' | 'read-only',
      }),
      ...(flags['queue-name-filter'] !== undefined && {queueNameFilter: flags['queue-name-filter']}),
    }
  }
}
