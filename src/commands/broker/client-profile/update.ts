import {printObjectAsKeyValueTable} from '@dishantlangayan/sc-cli-core'
import {Flags} from '@oclif/core'

import {ScBrokerCommand} from '../../../lib/sc-broker-command.js'
import {
  MsgVpnClientProfileUpdateRequest,
  MsgVpnClientProfileUpdateResponse,
} from '../../../types/msgvpn-client-profile.js'

export default class BrokerClientProfileUpdate extends ScBrokerCommand<typeof BrokerClientProfileUpdate> {
  static override args = {}
  static override description = `Update a Client Profile on a Solace Event Broker.

Updates the configuration of an existing Client Profile. Only provided attributes will be updated (PATCH semantics). The updates are synchronized to HA mates and replication sites via config-sync.`
  static override examples = [
    '<%= config.bin %> <%= command.id %> --broker-name=dev-broker --client-profile-name=myProfile --msg-vpn-name=default --compression-enabled',
    '<%= config.bin %> <%= command.id %> --broker-id=dev-broker --client-profile-name=myProfile --msg-vpn-name=default --no-eliding-enabled',
    '<%= config.bin %> <%= command.id %> --broker-name=dev-broker --client-profile-name=myProfile --msg-vpn-name=default --allow-guaranteed-msg-send-enabled --allow-guaranteed-msg-receive-enabled',
    '<%= config.bin %> <%= command.id %> --client-profile-name=myProfile --eliding-delay=100',
  ]
  static override flags = {
    ...ScBrokerCommand.baseFlags,
    'allow-bridge-connections-enabled': Flags.boolean({
      allowNo: true,
      description: 'Enable or disable allowing Bridge clients using the Client Profile to connect.',
    }),
    'allow-guaranteed-endpoint-create-durability': Flags.string({
      description: 'The types of Queues and Topic Endpoints that clients can create.',
      options: ['all', 'durable', 'non-durable'],
    }),
    'allow-guaranteed-endpoint-create-enabled': Flags.boolean({
      allowNo: true,
      description: 'Enable or disable allowing clients to create topic endpoints or queues.',
    }),
    'allow-guaranteed-msg-receive-enabled': Flags.boolean({
      allowNo: true,
      description: 'Enable or disable allowing clients to receive guaranteed messages.',
    }),
    'allow-guaranteed-msg-send-enabled': Flags.boolean({
      allowNo: true,
      description: 'Enable or disable allowing clients to send guaranteed messages.',
    }),
    'allow-shared-subscriptions-enabled': Flags.boolean({
      allowNo: true,
      description: 'Enable or disable allowing shared subscriptions.',
    }),
    'allow-transacted-sessions-enabled': Flags.boolean({
      allowNo: true,
      description: 'Enable or disable allowing clients to establish transacted sessions.',
    }),
    'api-queue-management-copy-from-on-create-name': Flags.string({
      description: 'The name of a queue to copy settings from when a new queue is created by a client.',
    }),
    'api-queue-management-copy-from-on-create-template-name': Flags.string({
      description: 'The name of a queue template to copy settings from when a new queue is created by a client.',
    }),
    'client-profile-name': Flags.string({
      char: 'c',
      description: 'The name of the client profile to update.',
      required: true,
    }),
    'compression-enabled': Flags.boolean({
      allowNo: true,
      description: 'Enable or disable allowing clients to use compression.',
    }),
    'eliding-delay': Flags.integer({
      description: 'The amount of time to delay the delivery of messages to clients, in milliseconds.',
      min: 0,
    }),
    'eliding-enabled': Flags.boolean({
      allowNo: true,
      description: 'Enable or disable message eliding.',
    }),
    'tls-allow-downgrade-to-plain-text-enabled': Flags.boolean({
      allowNo: true,
      description: 'Enable or disable allowing a client to downgrade an encrypted connection to plain text.',
    }),
  }

  public async run(): Promise<MsgVpnClientProfileUpdateResponse> {
    const {flags} = await this.parse(BrokerClientProfileUpdate)
    const clientProfileName = flags['client-profile-name']

    // Build client profile update request body
    const updateBody: MsgVpnClientProfileUpdateRequest = this.buildClientProfileUpdateRequest(flags)

    // Make SEMP Config API call to update the client profile
    const endpoint = `/SEMP/v2/config/msgVpns/${this.msgVpnName}/clientProfiles/${clientProfileName}`
    const sempResp = await this.sempConn.patch<MsgVpnClientProfileUpdateResponse>(endpoint, updateBody)

    // Display results
    this.log(printObjectAsKeyValueTable(sempResp.data as unknown as Record<string, unknown>))

    return sempResp
  }

  /**
   * Builds the client profile update request body from command flags
   * Note: clientProfileName is NOT included - it's in the URL path
   */
  private buildClientProfileUpdateRequest(flags: {
    'allow-bridge-connections-enabled'?: boolean
    'allow-guaranteed-endpoint-create-durability'?: string
    'allow-guaranteed-endpoint-create-enabled'?: boolean
    'allow-guaranteed-msg-receive-enabled'?: boolean
    'allow-guaranteed-msg-send-enabled'?: boolean
    'allow-shared-subscriptions-enabled'?: boolean
    'allow-transacted-sessions-enabled'?: boolean
    'api-queue-management-copy-from-on-create-name'?: string
    'api-queue-management-copy-from-on-create-template-name'?: string
    'compression-enabled'?: boolean
    'eliding-delay'?: number
    'eliding-enabled'?: boolean
    'tls-allow-downgrade-to-plain-text-enabled'?: boolean
  }): MsgVpnClientProfileUpdateRequest {
    return {
      ...(flags['allow-bridge-connections-enabled'] !== undefined && {
        allowBridgeConnectionsEnabled: flags['allow-bridge-connections-enabled'],
      }),
      ...(flags['allow-guaranteed-endpoint-create-durability'] && {
        allowGuaranteedEndpointCreateDurability: flags['allow-guaranteed-endpoint-create-durability'] as
          | 'all'
          | 'durable'
          | 'non-durable',
      }),
      ...(flags['allow-guaranteed-endpoint-create-enabled'] !== undefined && {
        allowGuaranteedEndpointCreateEnabled: flags['allow-guaranteed-endpoint-create-enabled'],
      }),
      ...(flags['allow-guaranteed-msg-receive-enabled'] !== undefined && {
        allowGuaranteedMsgReceiveEnabled: flags['allow-guaranteed-msg-receive-enabled'],
      }),
      ...(flags['allow-guaranteed-msg-send-enabled'] !== undefined && {
        allowGuaranteedMsgSendEnabled: flags['allow-guaranteed-msg-send-enabled'],
      }),
      ...(flags['allow-shared-subscriptions-enabled'] !== undefined && {
        allowSharedSubscriptionsEnabled: flags['allow-shared-subscriptions-enabled'],
      }),
      ...(flags['allow-transacted-sessions-enabled'] !== undefined && {
        allowTransactedSessionsEnabled: flags['allow-transacted-sessions-enabled'],
      }),
      ...(flags['api-queue-management-copy-from-on-create-name'] && {
        apiQueueManagementCopyFromOnCreateName: flags['api-queue-management-copy-from-on-create-name'],
      }),
      ...(flags['api-queue-management-copy-from-on-create-template-name'] && {
        apiQueueManagementCopyFromOnCreateTemplateName: flags['api-queue-management-copy-from-on-create-template-name'],
      }),
      ...(flags['compression-enabled'] !== undefined && {compressionEnabled: flags['compression-enabled']}),
      ...(flags['eliding-delay'] !== undefined && {elidingDelay: flags['eliding-delay']}),
      ...(flags['eliding-enabled'] !== undefined && {elidingEnabled: flags['eliding-enabled']}),
      ...(flags['tls-allow-downgrade-to-plain-text-enabled'] !== undefined && {
        tlsAllowDowngradeToPlainTextEnabled: flags['tls-allow-downgrade-to-plain-text-enabled'],
      }),
    }
  }
}
