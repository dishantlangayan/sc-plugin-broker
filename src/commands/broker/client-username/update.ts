import {printObjectAsKeyValueTable} from '@dishantlangayan/sc-cli-core'
import {Flags} from '@oclif/core'

import {ScBrokerCommand} from '../../../lib/sc-broker-command.js'
import {MsgVpnClientUsernameUpdateRequest, MsgVpnClientUsernameUpdateResponse} from '../../../types/msgvpn-client-username.js'

export default class BrokerClientUsernameUpdate extends ScBrokerCommand<typeof BrokerClientUsernameUpdate> {
  static override args = {}
  static override description = `Update a Client Username on a Solace Event Broker.

Any attribute missing from the request will be left unchanged. The update of instances of this object are synchronized to HA mates and replication sites via config-sync.

Note: Modifying aclProfileName or clientProfileName while enabled may be service impacting as the Client Username will be temporarily disabled to apply the change.`
  static override examples = [
    '<%= config.bin %> <%= command.id %> --client-username=user1 --enabled',
    '<%= config.bin %> <%= command.id %> --broker-name=dev-broker --client-username=user1 --acl-profile-name=new-acl',
    '<%= config.bin %> <%= command.id %> --client-username=user1 --password=newPassword123',
    '<%= config.bin %> <%= command.id %> --client-username=admin --subscription-manager-enabled --guaranteed-endpoint-permission-override-enabled',
  ]
  static override flags = {
    ...ScBrokerCommand.baseFlags,
    'acl-profile-name': Flags.string({
      description: 'The ACL Profile name for authorization.',
    }),
    'client-profile-name': Flags.string({
      description: 'The Client Profile name for connection settings.',
    }),
    'client-username': Flags.string({
      char: 'u',
      description: 'The name of the Client Username to update.',
      required: true,
    }),
    'enabled': Flags.boolean({
      description: 'Enable or disable the Client Username.',
    }),
    'guaranteed-endpoint-permission-override-enabled': Flags.boolean({
      description: 'Enable or disable permission override for guaranteed endpoints.',
    }),
    'password': Flags.string({
      description: 'Update the password for authentication.',
    }),
    'subscription-manager-enabled': Flags.boolean({
      description: 'Enable or disable subscription management capability.',
    }),
  }

  public async run(): Promise<MsgVpnClientUsernameUpdateResponse> {
    const {flags} = await this.parse(BrokerClientUsernameUpdate)

    // Build update request body (only includes provided flags)
    const updateBody: MsgVpnClientUsernameUpdateRequest = this.buildUpdateRequest(flags)

    // Make SEMP Config API call
    const clientUsername = flags['client-username']
    const endpoint = `/SEMP/v2/config/msgVpns/${this.msgVpnName}/clientUsernames/${clientUsername}`
    const sempResp = await this.sempConn.patch<MsgVpnClientUsernameUpdateResponse>(endpoint, updateBody)

    // Display results
    this.log(printObjectAsKeyValueTable(sempResp.data as unknown as Record<string, unknown>))

    return sempResp
  }

  /**
   * Builds the Client Username update request body from command flags
   * Only includes fields that were explicitly provided
   * Does NOT include clientUsername (it goes in the URL path)
   */
  private buildUpdateRequest(flags: {
    'acl-profile-name'?: string
    'client-profile-name'?: string
    'enabled'?: boolean
    'guaranteed-endpoint-permission-override-enabled'?: boolean
    'password'?: string
    'subscription-manager-enabled'?: boolean
  }): MsgVpnClientUsernameUpdateRequest {
    return {
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
