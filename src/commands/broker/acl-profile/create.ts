import {printObjectAsKeyValueTable} from '@dishantlangayan/sc-cli-core'
import {Flags} from '@oclif/core'

import {ScBrokerCommand} from '../../../lib/sc-broker-command.js'
import {MsgVpnAclProfileCreateRequest, MsgVpnAclProfileCreateResponse} from '../../../types/msgvpn-acl-profile.js'

export default class BrokerAclProfileCreate extends ScBrokerCommand<typeof BrokerAclProfileCreate> {
  static override args = {}
  static override description = `Create an ACL Profile on a Solace Event Broker.

  Access control list (ACL) profiles control which clients can connect to a message Message VPN and which topics connected clients are allowed to publish and subscribe to.
  
  Each of these access controls require a defined default action (allow or disallow connection, allow or disallow publishing to topics, allow or disallow subscribing to topics, and allow or disallow subscribing to share names).
  
  Default action is disallow for each.`
  static override examples = [
    '<%= config.bin %> <%= command.id %> --name=myProfile',
    '<%= config.bin %> <%= command.id %> --name=myProfile --client-connect-default-action=allow --publish-topic-default-action=disallow --subscribe-topic-default-action=allow',
  ]
  static override flags = {
    ...ScBrokerCommand.baseFlags,
    'client-connect-default-action': Flags.string({
      description: 'The default action to take when a client using the ACL Profile connects.',
      options: ['allow', 'disallow'],
    }),
    name: Flags.string({
      char: 'n',
      description: 'The name of the ACL Profile to create.',
      required: true,
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
    'client-connect-default-action'?: string
    name: string
    'publish-topic-default-action'?: string
    'subscribe-share-name-default-action'?: string
    'subscribe-topic-default-action'?: string
  }): MsgVpnAclProfileCreateRequest {
    return {
      aclProfileName: flags.name,
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
