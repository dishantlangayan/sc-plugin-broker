import {BrokerAuth, ScCommand, ScConnection} from '@dishantlangayan/sc-cli-core'
import {Command, Flags, Interfaces} from '@oclif/core'

import {resolveBrokerAuth, resolveBrokerConnection, resolveMsgVpnName} from './broker-utils.js'

// Type helpers for flag and args inference
export type Flags<T extends typeof Command> = Interfaces.InferredFlags<
  (typeof ScBrokerCommand)['baseFlags'] & T['flags']
>
export type Args<T extends typeof Command> = Interfaces.InferredArgs<T['args']>

/**
 * Abstract base class for broker commands that interact with SEMP APIs.
 *
 * Provides common broker flags and automatically resolves:
 * - brokerIdentifier: The broker name or ID (or default)
 * - sempConn: Authenticated SEMP connection
 * - msgVpnName: The Message VPN name to use
 *
 * Child classes should:
 * 1. Merge flags: static override flags = {...ScBrokerCommand.baseFlags, ...}
 * 2. Access properties directly in run(): this.sempConn, this.msgVpnName
 */
export abstract class ScBrokerCommand<T extends typeof Command> extends ScCommand<T> {
  // Broker selection flags only (no msg-vpn-name).
  //
  // For commands that manage Message VPNs themselves (e.g. broker:msg-vpn:*),
  // where the target VPN is identified by a command-specific flag rather than
  // the VPN-scoped -v/--msg-vpn-name flag. Such commands should spread these
  // flags and set `resolveMsgVpn = false`.
  static brokerFlags = {
    ...ScCommand.baseFlags,
    'broker-id': Flags.string({
      description: 'Stored broker identifier. If not provided, uses the default broker.',
      exclusive: ['broker-name'],
    }),
    'broker-name': Flags.string({
      char: 'b',
      description: 'Stored broker name. If not provided, uses the default broker.',
      exclusive: ['broker-id'],
    }),
  }
  // The VPN-scoped flag, mixed into baseFlags for VPN-scoped commands.
  static msgVpnNameFlag = {
    'msg-vpn-name': Flags.string({
      char: 'v',
      description: 'The name of the Message VPN.',
    }),
  }
  // Base flags for VPN-scoped commands: broker selection plus msg-vpn-name.
  //
  // Typed as the parent's baseFlags so commands that manage Message VPNs can
  // override baseFlags with a narrower set (brokerFlags, without msg-vpn-name).
  // The flags are composed via spreads so the wider value satisfies the
  // narrower declared type without tripping excess-property checks.
  static override baseFlags: typeof ScCommand.baseFlags = {
    ...ScBrokerCommand.brokerFlags,
    ...ScBrokerCommand.msgVpnNameFlag,
  }
  // Protected properties initialized in init()
  protected brokerIdentifier!: string
  protected msgVpnName!: string
  // Whether init() should resolve a Message VPN name. Commands that manage
  // Message VPNs themselves set this to false and identify the target VPN via
  // their own flag (see brokerFlags).
  protected resolveMsgVpn = true
  protected sempConn!: ScConnection

  /**
   * Resolve the stored BrokerAuth for the selected broker (or the default
   * broker). Useful for inspecting broker properties such as whether it is a
   * Solace Cloud broker before performing an operation.
   */
  protected async getBrokerAuth(): Promise<BrokerAuth> {
    return resolveBrokerAuth(this, this.brokerIdentifier)
  }

  /**
   * Initialize broker properties before run() is called.
   * This method is part of oclif's lifecycle and runs after flag parsing.
   */
  public async init(): Promise<void> {
    // Call parent init first (sets up ScCommand functionality)
    await super.init()

    // Parse flags to access broker-specific flags
    // Note: We need to parse with the child class to get all flags
    const {flags} = await this.parse(this.constructor as typeof Command)

    // Extract broker flags (type assertion needed since flags type varies by child)
    const brokerFlags = flags as {
      'broker-id'?: string
      'broker-name'?: string
      'msg-vpn-name'?: string
    }

    // Step 1: Resolve broker identifier
    this.brokerIdentifier = brokerFlags['broker-id'] ?? brokerFlags['broker-name'] ?? ''

    // Step 2: Create SEMP connection
    this.sempConn = await resolveBrokerConnection(this, this.brokerIdentifier)

    // Step 3: Resolve msg-vpn-name (skipped for commands that manage VPNs directly)
    if (this.resolveMsgVpn) {
      this.msgVpnName = await resolveMsgVpnName(this, this.brokerIdentifier, brokerFlags['msg-vpn-name'])
    }
  }
}
