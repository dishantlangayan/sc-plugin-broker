import {ScCommand, ScConnection} from '@dishantlangayan/sc-cli-core'
import {Command, Flags, Interfaces} from '@oclif/core'

import {resolveBrokerConnection, resolveMsgVpnName} from './broker-utils.js'

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
  // Define the three common broker flags merged with parent baseFlags
  static override baseFlags = {
    ...ScCommand.baseFlags,
    'broker-id': Flags.string({
      char: 'b',
      description: 'Stored broker identifier. If not provided, uses the default broker.',
      exclusive: ['broker-name'],
    }),
    'broker-name': Flags.string({
      char: 'n',
      description: 'Stored broker name. If not provided, uses the default broker.',
      exclusive: ['broker-id'],
    }),
    'msg-vpn-name': Flags.string({
      char: 'v',
      description: 'The name of the Message VPN.',
    }),
  }
  // Protected properties initialized in init()
  protected brokerIdentifier!: string
  protected msgVpnName!: string
  protected sempConn!: ScConnection

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

    // Step 3: Resolve msg-vpn-name
    this.msgVpnName = await resolveMsgVpnName(this, this.brokerIdentifier, brokerFlags['msg-vpn-name'])
  }
}
