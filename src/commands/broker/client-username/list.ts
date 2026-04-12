import {camelCaseToTitleCase, createStreamTable} from '@dishantlangayan/sc-cli-core'
import {confirm} from '@inquirer/prompts'
import {Flags} from '@oclif/core'

import {ScBrokerCommand} from '../../../lib/sc-broker-command.js'
import {MsgVpnClientUsernameMonitor, MsgVpnClientUsernamesMonitorResponse} from '../../../types/msgvpn-client-username.js'

export default class BrokerClientUsernameList extends ScBrokerCommand<typeof BrokerClientUsernameList> {
  static override args = {}
  static override description = `List Client Usernames from a Solace Event Broker.

Retrieves and displays Client Usernames from the specified Message VPN using the SEMP Monitor API.
Supports filtering by name (with wildcards), custom attribute selection, and pagination.`
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --count=20',
    '<%= config.bin %> <%= command.id %> --client-username="user*"',
    '<%= config.bin %> <%= command.id %> --select=clientUsername,enabled,aclProfileName',
    '<%= config.bin %> <%= command.id %> --all',
    '<%= config.bin %> <%= command.id %> --client-username="admin*" --count=5 --all',
  ]
  static override flags = {
    ...ScBrokerCommand.baseFlags,
    all: Flags.boolean({
      char: 'a',
      default: false,
      description: 'Display all Client Usernames (auto-pagination).',
    }),
    'client-username': Flags.string({
      description: 'Filter Client Usernames by name. Supports * wildcard.',
    }),
    count: Flags.integer({
      char: 'c',
      default: 10,
      description: 'Number of Client Usernames to display per page.',
      max: 100,
      min: 1,
    }),
    select: Flags.string({
      char: 's',
      description: 'Comma-separated list of attributes to display (max 10).',
      multiple: false,
    }),
  }
// Default attributes to display
  private readonly DEFAULT_ATTRIBUTES = [
    'clientUsername',
    'enabled',
    'aclProfileName',
    'clientProfileName',
    'subscriptionManagerEnabled',
  ]

  public async run(): Promise<{data: MsgVpnClientUsernameMonitor[]}> {
    const {flags} = await this.parse(BrokerClientUsernameList)

    // Parse and validate select attributes
    const selectedAttrs = this.parseSelectAttributes(flags.select)

    // Create stream table
    const columnCount = selectedAttrs.length
    const streamTable = createStreamTable(columnCount, {
      1: {width: 20, wrapWord: true},
      2: {width: 15, wrapWord: true},
      3: {width: 20, wrapWord: true},
      4: {width: 20, wrapWord: true},
    })

    // Write header row
    const headers = selectedAttrs.map(attr => camelCaseToTitleCase(attr))
    streamTable.write(headers)

    // Fetch Client Usernames with pagination and stream to table
    const clientUsernames = await this.fetchAndDisplayClientUsernames(flags, selectedAttrs, streamTable)

    // Display results
    if (clientUsernames.length === 0) {
      this.log('No Client Usernames found.')
    } else {
      this.log(`\nTotal: ${clientUsernames.length} Client Username(s)`)
    }

    return {data: clientUsernames}
  }

  /**
   * Fetch Client Usernames with pagination and stream to table
   */
  private async fetchAndDisplayClientUsernames(
    flags: {all: boolean; 'client-username'?: string; count: number;},
    selectedAttrs: string[],
    streamTable: import('table').WritableStream,
  ): Promise<MsgVpnClientUsernameMonitor[]> {
    const allClientUsernames: MsgVpnClientUsernameMonitor[] = []
    let cursor: string | undefined

    while (true) {
      // Build query params
      const params = new URLSearchParams()
      params.set('count', flags.count.toString())

      // Add where clause for filtering if provided
      if (flags['client-username']) {
        params.set('where', `clientUsername==${flags['client-username']}`)
      }

      // Add select parameter for performance optimization
      // Always include msgVpnName and clientUsername even if not in display attributes
      const selectAttrs = new Set(['clientUsername', 'msgVpnName', ...selectedAttrs])
      const selectParam = [...selectAttrs].join(',')

      if (cursor) {
        params.set('cursor', cursor)
      }

      // Fetch page
      const endpoint = `/SEMP/v2/monitor/msgVpns/${this.msgVpnName}/clientUsernames?${params.toString()}&select=${selectParam}`
      // eslint-disable-next-line no-await-in-loop
      const response = await this.sempConn.get<MsgVpnClientUsernamesMonitorResponse>(endpoint)

      // Write rows to stream table
      for (const clientUsername of response.data) {
        const row = selectedAttrs.map(attr => this.formatAttributeValue(clientUsername, attr))
        streamTable.write(row)
      }

      allClientUsernames.push(...response.data)

      // Check if more pages exist
      const hasMore = Boolean(response.meta.paging?.cursorQuery)
      cursor = response.meta.paging?.cursorQuery

      // Handle pagination
      if (hasMore && !flags.all) {
        // eslint-disable-next-line no-await-in-loop
        const shouldContinue = await confirm(
          {
            default: true,
            message: `\nShowing ${allClientUsernames.length} Client Usernames. More results available. Continue?`,
          },
          {
            clearPromptOnDone: true,
          },
        )

        if (!shouldContinue) {
          break
        }
      } else if (!hasMore) {
        break
      }
    }

    return allClientUsernames
  }

  /**
   * Format attribute value for display
   */
  private formatAttributeValue(clientUsername: MsgVpnClientUsernameMonitor, attr: string): string {
    const value = clientUsername[attr]

    // Handle boolean values
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No'
    }

    // Handle null/undefined
    if (value === null || value === undefined) {
      return '-'
    }

    // Handle other types
    return String(value)
  }

  /**
   * Parse and validate the select attributes from the flag
   */
  private parseSelectAttributes(selectFlag?: string): string[] {
    if (!selectFlag) {
      return this.DEFAULT_ATTRIBUTES
    }

    const attrs = selectFlag
      .split(',')
      .map(a => a.trim())
      .filter(a => a.length > 0)

    if (attrs.length === 0) {
      return this.DEFAULT_ATTRIBUTES
    }

    if (attrs.length > 10) {
      this.error('Maximum 10 attributes allowed for --select flag.')
    }

    return attrs
  }
}
