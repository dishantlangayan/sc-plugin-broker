import {printObjectAsKeyValueTable} from '@dishantlangayan/sc-cli-core'
import {Flags} from '@oclif/core'

import {ScBrokerCommand} from '../../../../lib/sc-broker-command.js'
import {
  MsgVpnAclProfileClientConnectExceptionCreateRequest,
  MsgVpnAclProfileClientConnectExceptionCreateResponse,
} from '../../../../types/msgvpn-acl-profile-exceptions.js'

export default class BrokerAclProfileClientConnectExceptionsCreate extends ScBrokerCommand<
  typeof BrokerAclProfileClientConnectExceptionsCreate
> {
  static override args = {}
  static override description = `Create a client connect exception for an ACL Profile on a Solace Event Broker.

Adds an exception to the ACL Profile that allows or disallows clients connecting from specific IP addresses. The exception is expressed as an IP address/netmask in CIDR form. The creation is synchronized to HA mates and replication sites via config-sync.`
  static override examples = [
    '<%= config.bin %> <%= command.id %> --acl-profile-name=myProfile --client-connect-exception-address=192.168.1.0/24',
    '<%= config.bin %> <%= command.id %> --broker-name=dev-broker --acl-profile-name=myProfile --msg-vpn-name=default --client-connect-exception-address=10.0.0.0/8',
  ]
  static override flags = {
    ...ScBrokerCommand.baseFlags,
    'acl-profile-name': Flags.string({
      char: 'a',
      description: 'The name of the ACL Profile.',
      required: true,
    }),
    'client-connect-exception-address': Flags.string({
      char: 'c',
      description: 'The IP address/netmask of the client connect exception in CIDR form (e.g., 192.168.1.0/24).',
      required: true,
    }),
  }

  public async run(): Promise<MsgVpnAclProfileClientConnectExceptionCreateResponse> {
    const {flags} = await this.parse(BrokerAclProfileClientConnectExceptionsCreate)

    // Build request body
    const requestBody: MsgVpnAclProfileClientConnectExceptionCreateRequest = {
      clientConnectExceptionAddress: flags['client-connect-exception-address'],
    }

    // Make SEMP Config API call to create the exception
    const endpoint = `/SEMP/v2/config/msgVpns/${this.msgVpnName}/aclProfiles/${flags['acl-profile-name']}/clientConnectExceptions`
    const sempResp = await this.sempConn.post<MsgVpnAclProfileClientConnectExceptionCreateResponse>(
      endpoint,
      requestBody,
    )

    // Display results
    this.log(printObjectAsKeyValueTable(sempResp.data as unknown as Record<string, unknown>))

    return sempResp
  }
}
