import {BrokerAuthError, BrokerAuthErrorCode, BrokerAuthManager, ScCommand, ScConnection} from '@dishantlangayan/sc-cli-core'
import {Command} from '@oclif/core'

/**
 * Resolves broker and creates authenticated SEMP connection
 *
 * This utility function handles the common pattern of resolving which broker
 * to use for SEMP API calls. It validates the broker identifier exists in
 * stored credentials and creates an authenticated connection.
 *
 * @param command - The ScCommand instance (for error handling and BrokerAuthManager access)
 * @param brokerIdentifier - Broker ID or name from --broker-id or --broker-name flag
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

    // Validate broker exists in stored credentials
    try {
      await brokerAuthManager.getBroker(brokerIdentifier)
    } catch (error) {
      if (error instanceof BrokerAuthError && error.code === BrokerAuthErrorCode.BROKER_NOT_FOUND) {
        command.error(
          `Broker '${brokerIdentifier}' not found. Please run 'broker:login:basic' to store broker credentials first.`,
          {exit: 2},
        )
      }

      throw error
    }

    // Create SEMP connection using stored credentials
    return await brokerAuthManager.createConnection(brokerIdentifier, timeout)
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
