import {printObjectAsKeyValueTable} from '@dishantlangayan/sc-cli-core'
import {Flags} from '@oclif/core'

import {ScBrokerCommand} from '../../../lib/sc-broker-command.js'
import {MsgVpnClientUsernameCreateRequest, MsgVpnClientUsernameCreateResponse} from '../../../types/msgvpn-client-username.js'

export default class BrokerClientUsernameCreate extends ScBrokerCommand<typeof BrokerClientUsernameCreate> {
  static override args = {}
  static override description = `Create a Client Username on a Solace Event Broker.

Any attribute missing from the request will be set to its default value. The creation of instances of this object are synchronized to HA mates and replication sites via config-sync.

A Client Username represents a client that can connect to the broker with specific authentication and authorization settings.`
  static override examples = [
    '<%= config.bin %> <%= command.id %> --username=user1',
    '<%= config.bin %> <%= command.id %> --username=user1 --enabled',
    '<%= config.bin %> <%= command.id %> --username=user1 --password=secret123 --acl-profile-name=custom-acl --client-profile-name=custom-profile',
    '<%= config.bin %> <%= command.id %> --username=admin --enabled --subscription-manager-enabled --guaranteed-endpoint-permission-override-enabled',
  ]
  static override flags = {
    ...ScBrokerCommand.baseFlags,
    'acl-profile-name': Flags.string({
      description: 'The ACL Profile name for authorization.',
    }),
    'client-profile-name': Flags.string({
      description: 'The Client Profile name for connection settings.',
    }),
    'enabled': Flags.boolean({
      description: 'Enable the Client Username. When disabled, clients cannot connect.',
    }),
    'guaranteed-endpoint-permission-override-enabled': Flags.boolean({
      description: 'Enable permission override for guaranteed endpoints.',
    }),
    'password': Flags.string({
      description: 'Password for Client Username authentication.',
    }),
    'subscription-manager-enabled': Flags.boolean({
      description: 'Enable subscription management capability.',
    }),
    username: Flags.string({
      char: 'u',
      description: 'The name of the Client Username to create.',
      required: true,
    }),
  }

  public async run(): Promise<MsgVpnClientUsernameCreateResponse> {
    const {flags} = await this.parse(BrokerClientUsernameCreate)

    // Build request body
    const requestBody: MsgVpnClientUsernameCreateRequest = this.buildCreateRequest(flags)

    // Make SEMP Config API call
    const endpoint = `/SEMP/v2/config/msgVpns/${this.msgVpnName}/clientUsernames`
    const sempResp = await this.sempConn.post<MsgVpnClientUsernameCreateResponse>(endpoint, requestBody)

    // Display results
    this.log(printObjectAsKeyValueTable(sempResp.data as unknown as Record<string, unknown>))

    return sempResp
  }

  /**
   * Builds the Client Username creation request body from command flags
   */
  private buildCreateRequest(flags: {
    'acl-profile-name'?: string
    'client-profile-name'?: string
    'enabled'?: boolean
    'guaranteed-endpoint-permission-override-enabled'?: boolean
    'password'?: string
    'subscription-manager-enabled'?: boolean
    'username': string
  }): MsgVpnClientUsernameCreateRequest {
    return {
      clientUsername: flags.username,
      ...(flags['acl-profile-name'] && {aclProfileName: flags['acl-profile-name']}),
      ...(flags['client-profile-name'] && {clientProfileName: flags['client-profile-name']}),
      ...(flags.enabled !== undefined && {enabled: flags.enabled}),
      ...(flags['guaranteed-endpoint-permission-override-enabled'] !== undefined && {
        guaranteedEndpointPermissionOverrideEnabled: flags['guaranteed-endpoint-permission-override-enabled'],
      }),
      ...(flags.password && {password: flags.password}),
      ...(flags['subscription-manager-enabled'] !== undefined && {
        subscriptionManagerEnabled: flags['subscription-manager-enabled'],
      }),
    }
  }
}
