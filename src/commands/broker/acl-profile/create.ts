import {printObjectAsKeyValueTable} from '@dishantlangayan/sc-cli-core'
import {Flags} from '@oclif/core'

import {ScBrokerCommand} from '../../../lib/sc-broker-command.js'
import {MsgVpnAclProfileCreateRequest, MsgVpnAclProfileCreateResponse} from '../../../types/msgvpn-acl-profile.js'

export default class BrokerAclProfileCreate extends ScBrokerCommand<typeof BrokerAclProfileCreate> {
  static override args = {}
  static override description = `Create an ACL Profile on a Solace Event Broker.

Any attribute missing from the request will be set to its default value. The creation of instances of this object are synchronized to HA mates and replication sites via config-sync.`
  static override examples = [
    '<%= config.bin %> <%= command.id %> --broker-name=dev-broker --acl-profile-name=myProfile --msg-vpn-name=default',
    '<%= config.bin %> <%= command.id %> --broker-id=dev-broker --acl-profile-name=myProfile --msg-vpn-name=default --client-connect-default-action=allow',
    '<%= config.bin %> <%= command.id %> --broker-name=dev-broker --acl-profile-name=myProfile --msg-vpn-name=default --publish-topic-default-action=allow --subscribe-topic-default-action=allow',
    '<%= config.bin %> <%= command.id %> --acl-profile-name=myProfile',
  ]
  static override flags = {
    ...ScBrokerCommand.baseFlags,
    'acl-profile-name': Flags.string({
      char: 'a',
      description: 'The name of the ACL Profile to create.',
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

  public async run(): Promise<MsgVpnAclProfileCreateResponse> {
    const {flags} = await this.parse(BrokerAclProfileCreate)

    // Build ACL profile creation request body
    const aclProfileBody: MsgVpnAclProfileCreateRequest = this.buildAclProfileRequest(flags)

    // Make SEMP Config API call to create the ACL profile
    const endpoint = `/SEMP/v2/config/msgVpns/${this.msgVpnName}/aclProfiles`
    const sempResp = await this.sempConn.post<MsgVpnAclProfileCreateResponse>(endpoint, aclProfileBody)

    // Display results
    this.log(printObjectAsKeyValueTable(sempResp.data as unknown as Record<string, unknown>))

    return sempResp
  }

  /**
   * Builds the ACL profile creation request body from command flags
   */
  private buildAclProfileRequest(flags: {
    'acl-profile-name': string
    'client-connect-default-action'?: string
    'publish-topic-default-action'?: string
    'subscribe-share-name-default-action'?: string
    'subscribe-topic-default-action'?: string
  }): MsgVpnAclProfileCreateRequest {
    return {
      aclProfileName: flags['acl-profile-name'],
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
