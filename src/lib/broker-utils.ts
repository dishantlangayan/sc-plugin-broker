import {BrokerAuthError, BrokerAuthErrorCode, BrokerAuthManager, ScCommand, ScConnection} from '@dishantlangayan/sc-cli-core'
import {Command} from '@oclif/core'

/**
 * Resolves broker and creates authenticated SEMP connection
 *
 * This utility function handles the common pattern of resolving which broker
 * to use for SEMP API calls. It validates the broker identifier exists in
 * stored credentials and creates an authenticated connection.
 * If brokerIdentifier is empty, it uses the default broker (if one is set).
 *
 * @param command - The ScCommand instance (for error handling and BrokerAuthManager access)
 * @param brokerIdentifier - Broker ID or name from --broker-id or --broker-name flag (empty if using default)
 * @param timeout - Optional timeout override in milliseconds
 * @returns Configured ScConnection instance ready for SEMP API calls
 * @throws Will call command.error() with user-friendly messages for various error scenarios
 *
 * @example
 * ```typescript
 * // In a command's run() method:
 * const {flags} = await this.parse(MyCommand)
 * const brokerIdentifier = flags['broker-id'] ?? flags['broker-name'] ?? ''
 * const sempConn = await resolveBrokerConnection(this, brokerIdentifier)
 * const resp = await sempConn.get('/SEMP/v2/config/msgVpns')
 * ```
 */
export async function resolveBrokerConnection(
  command: ScCommand<typeof Command>,
  brokerIdentifier: string,
  timeout?: number,
): Promise<ScConnection> {
  try {
    // Use type assertion to access protected method
    const brokerAuthManager: BrokerAuthManager = await (
      command as unknown as {getBrokerAuthManager(): Promise<BrokerAuthManager>}
    ).getBrokerAuthManager()

    // Resolve to default broker if brokerIdentifier is empty
    const resolvedIdentifier = await resolveDefaultBrokerIfNeeded(command, brokerAuthManager, brokerIdentifier)

    // Validate broker exists in stored credentials
    try {
      await brokerAuthManager.getBroker(resolvedIdentifier)
    } catch (error) {
      if (error instanceof BrokerAuthError && error.code === BrokerAuthErrorCode.BROKER_NOT_FOUND) {
        command.error(
          `Broker '${resolvedIdentifier}' not found. Please run 'broker:login:basic' to store broker credentials first.`,
          {exit: 2},
        )
      }

      throw error
    }

    // Create SEMP connection using stored credentials
    return await brokerAuthManager.createConnection(resolvedIdentifier, timeout)
  } catch (error) {
    // Handle BrokerAuthManager-specific errors
    if (error instanceof BrokerAuthError) {
      switch (error.code) {
        case BrokerAuthErrorCode.BROKER_NOT_FOUND: {
          command.error(
            `Broker '${brokerIdentifier}' not found. Please run 'broker:login:basic' to store broker credentials first.`,
            {exit: 2},
          )
          break
        }

        case BrokerAuthErrorCode.INVALID_ACCESS_TOKEN: {
          command.error(
            `Invalid or expired credentials for broker '${brokerIdentifier}'. Please run 'broker:login:basic' again.`,
            {exit: 2},
          )
          break
        }

        default: {
          command.error(`Broker authentication failed: ${error.message}`, {exit: 2})
          break
        }
      }
    }

    // Re-throw unexpected errors
    throw error
  }
}

/**
 * Resolves broker identifier by using the default broker if identifier is empty.
 * This is a shared utility to avoid duplicating the default broker resolution logic.
 *
 * @param command - The ScCommand instance (for error handling)
 * @param brokerAuthManager - The BrokerAuthManager instance
 * @param brokerIdentifier - Broker ID or name (empty string to use default)
 * @returns The resolved broker identifier (never empty)
 * @throws Will call command.error() if no identifier provided and no default broker exists
 */
async function resolveDefaultBrokerIfNeeded(
  command: ScCommand<typeof Command>,
  brokerAuthManager: BrokerAuthManager,
  brokerIdentifier: string,
): Promise<string> {
  // If identifier provided, return it as-is
  if (brokerIdentifier) {
    return brokerIdentifier
  }

  // No identifier - try to get the default broker
  const defaultBroker = await brokerAuthManager.getDefaultBroker()
  if (!defaultBroker) {
    command.error(
      'No broker specified and no default broker set. Please provide --broker-name or --broker-id, or set a default broker.',
      {exit: 2},
    )
  }

  return defaultBroker.name
}

/**
 * Resolves the Message VPN name to use for the operation.
 * For Solace Cloud brokers, retrieves from stored BrokerAuth if not explicitly provided.
 * For non-cloud brokers, requires the msg-vpn-name to be provided.
 *
 * @param command - The ScCommand instance (for error handling and BrokerAuthManager access)
 * @param brokerIdentifier - Broker name or ID
 * @param msgVpnNameFlag - Value from --msg-vpn-name flag (undefined if not provided)
 * @returns The resolved Message VPN name
 * @throws Will call command.error() if msg-vpn-name is required but not provided
 *
 * @example
 * ```typescript
 * // In a command's run() method:
 * const msgVpnName = await resolveMsgVpnName(this, brokerIdentifier, flags['msg-vpn-name'])
 * const endpoint = `/SEMP/v2/config/msgVpns/${msgVpnName}/queues`
 * ```
 */
export async function resolveMsgVpnName(
  command: ScCommand<typeof Command>,
  brokerIdentifier: string,
  msgVpnNameFlag?: string,
): Promise<string> {
  // If flag is explicitly provided, use it (works for both cloud and non-cloud)
  if (msgVpnNameFlag) {
    return msgVpnNameFlag
  }

  // Flag not provided - retrieve broker details to check if it's a cloud broker
  const brokerAuthManager: BrokerAuthManager = await (
    command as unknown as {getBrokerAuthManager(): Promise<BrokerAuthManager>}
  ).getBrokerAuthManager()

  // Resolve to default broker if brokerIdentifier is empty
  const resolvedIdentifier = await resolveDefaultBrokerIfNeeded(command, brokerAuthManager, brokerIdentifier)

  const broker = await brokerAuthManager.getBroker(resolvedIdentifier)

  // This shouldn't happen since resolveBrokerConnection already validated, but be defensive
  if (!broker) {
    command.error(
      `Broker '${resolvedIdentifier}' not found. Please run 'broker:login:basic' or 'broker:login:cloud' first.`,
      {exit: 2},
    )
  }

  // Check if this is a Solace Cloud broker with stored msgVpnName
  if (broker.isSolaceCloud && broker.msgVpnName) {
    return broker.msgVpnName
  }

  // Not a cloud broker, and msg-vpn-name was not provided
  command.error(
    'The --msg-vpn-name flag is required when not using a Solace Cloud Event Broker.',
    {exit: 2},
  )
}
