import {printObjectAsKeyValueTable} from '@dishantlangayan/sc-cli-core'
import {Flags} from '@oclif/core'

import {ScBrokerCommand} from '../../../lib/sc-broker-command.js'
import {MsgVpnAclProfileUpdateRequest, MsgVpnAclProfileUpdateResponse} from '../../../types/msgvpn-acl-profile.js'

export default class BrokerAclProfileUpdate extends ScBrokerCommand<typeof BrokerAclProfileUpdate> {
  static override args = {}
  static override description = `Update an ACL Profile on a Solace Event Broker.

Any attribute missing from the request will be left unchanged. The update of instances of this object are synchronized to HA mates and replication sites via config-sync.`
  static override examples = [
    '<%= config.bin %> <%= command.id %> --broker-name=dev-broker --acl-profile-name=myProfile --msg-vpn-name=default --client-connect-default-action=allow',
    '<%= config.bin %> <%= command.id %> --broker-id=dev-broker --acl-profile-name=myProfile --msg-vpn-name=default --publish-topic-default-action=allow',
    '<%= config.bin %> <%= command.id %> --broker-name=dev-broker --acl-profile-name=myProfile --msg-vpn-name=default --subscribe-topic-default-action=allow --subscribe-share-name-default-action=disallow',
    '<%= config.bin %> <%= command.id %> --acl-profile-name=myProfile --publish-topic-default-action=disallow',
  ]
  static override flags = {
    ...ScBrokerCommand.baseFlags,
    'acl-profile-name': Flags.string({
      char: 'a',
      description: 'The name of the ACL Profile to update.',
      required: true,
    }),
    'client-connect-default-action': Flags.string({
      description: 'The default action to take when a client using the ACL Profile connects.',
      options: ['allow', 'disallow'],
    }),
    'publish-topic-default-action': Flags.string({
      description: 'The default action to take when a client using the ACL Profile publishes to a topic.',
      options: ['allow', 'disallow'],
    }),
    'subscribe-share-name-default-action': Flags.string({
      description: 'The default action to take when a client using the ACL Profile subscribes to a share-name subscription.',
      options: ['allow', 'disallow'],
    }),
    'subscribe-topic-default-action': Flags.string({
      description: 'The default action to take when a client using the ACL Profile subscribes to a topic.',
      options: ['allow', 'disallow'],
    }),
  }

  public async run(): Promise<MsgVpnAclProfileUpdateResponse> {
    const {flags} = await this.parse(BrokerAclProfileUpdate)

    // Build ACL profile update request body (only includes provided flags)
    const updateBody: MsgVpnAclProfileUpdateRequest = this.buildAclProfileUpdateRequest(flags)

    // Make SEMP Config API call to update the ACL profile
    const aclProfileName = flags['acl-profile-name']
    const endpoint = `/SEMP/v2/config/msgVpns/${this.msgVpnName}/aclProfiles/${aclProfileName}`
    const sempResp = await this.sempConn.patch<MsgVpnAclProfileUpdateResponse>(endpoint, updateBody)

    // Display results
    this.log(printObjectAsKeyValueTable(sempResp.data as unknown as Record<string, unknown>))

    return sempResp
  }

  /**
   * Builds the ACL profile update request body from command flags
   * Only includes fields that were explicitly provided
   * Does NOT include aclProfileName (it goes in the URL path)
   */
  private buildAclProfileUpdateRequest(flags: {
    'client-connect-default-action'?: string
    'publish-topic-default-action'?: string
    'subscribe-share-name-default-action'?: string
    'subscribe-topic-default-action'?: string
  }): MsgVpnAclProfileUpdateRequest {
    return {
      ...(flags['client-connect-default-action'] && {
        clientConnectDefaultAction: flags['client-connect-default-action'] as 'allow' | 'disallow',
      }),
      ...(flags['publish-topic-default-action'] && {
        publishTopicDefaultAction: flags['publish-topic-default-action'] as 'allow' | 'disallow',
      }),
      ...(flags['subscribe-share-name-default-action'] && {
        subscribeShareNameDefaultAction: flags['subscribe-share-name-default-action'] as 'allow' | 'disallow',
      }),
      ...(flags['subscribe-topic-default-action'] && {
        subscribeTopicDefaultAction: flags['subscribe-topic-default-action'] as 'allow' | 'disallow',
      }),
    }
  }
}
