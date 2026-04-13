import {printObjectAsKeyValueTable} from '@dishantlangayan/sc-cli-core'
import {Flags} from '@oclif/core'

import {ScBrokerCommand} from '../../../lib/sc-broker-command.js'
import {MsgVpnQueueTemplateCreateRequest, MsgVpnQueueTemplateCreateResponse} from '../../../types/msgvpn-queue-template.js'

export default class BrokerQueueTemplateCreate extends ScBrokerCommand<typeof BrokerQueueTemplateCreate> {
  static override args = {}
  static override description = `Create a Queue Template on a Solace Event Broker.

Any attribute missing from the request will be set to its default value. The creation of instances of this object are synchronized to HA mates and replication sites via config-sync.`
  static override examples = [
    '<%= config.bin %> <%= command.id %> --broker-name=dev-broker --queue-template-name=myTemplate --msg-vpn-name=default',
    '<%= config.bin %> <%= command.id %> --broker-id=dev-broker --queue-template-name=myTemplate --msg-vpn-name=default --access-type=non-exclusive',
    '<%= config.bin %> <%= command.id %> --broker-name=dev-broker --queue-template-name=myTemplate --msg-vpn-name=default --max-msg-spool-usage=1024 --permission=consume',
    '<%= config.bin %> <%= command.id %> --queue-template-name=myTemplate --queue-name-filter="order.*"',
    '<%= config.bin %> <%= command.id %> --queue-template-name=myTemplate --max-bind-count=500 --durability-override=non-durable',
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
      description: 'The name of the queue template to create.',
      required: true,
    }),
  }

  public async run(): Promise<MsgVpnQueueTemplateCreateResponse> {
    const {flags} = await this.parse(BrokerQueueTemplateCreate)

    // Build queue template creation request body
    const queueTemplateBody: MsgVpnQueueTemplateCreateRequest = this.buildCreateRequest(flags)

    // Make SEMP Config API call to create the queue template
    const endpoint = `/SEMP/v2/config/msgVpns/${this.msgVpnName}/queueTemplates`
    const sempResp = await this.sempConn.post<MsgVpnQueueTemplateCreateResponse>(endpoint, queueTemplateBody)

    // Display results
    this.log(printObjectAsKeyValueTable(sempResp.data as unknown as Record<string, unknown>))

    return sempResp
  }

  /**
   * Builds the queue template creation request body from command flags
   */
  private buildCreateRequest(flags: {
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
    'queue-template-name': string
  }): MsgVpnQueueTemplateCreateRequest {
    return {
      queueTemplateName: flags['queue-template-name'],
      ...(flags['access-type'] && {accessType: flags['access-type'] as 'exclusive' | 'non-exclusive'}),
      ...(flags['dead-msg-queue'] && {deadMsgQueue: flags['dead-msg-queue']}),
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
      ...(flags['queue-name-filter'] && {queueNameFilter: flags['queue-name-filter']}),
    }
  }
}
