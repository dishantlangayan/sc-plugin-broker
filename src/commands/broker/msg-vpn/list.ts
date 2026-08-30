import {camelCaseToTitleCase, createStreamTable} from '@dishantlangayan/sc-cli-core'
import {confirm} from '@inquirer/prompts'
import {Flags} from '@oclif/core'

import {ScBrokerCommand} from '../../../lib/sc-broker-command.js'
import {MsgVpnMonitor, MsgVpnsMonitorResponse} from '../../../types/msgvpn.js'

export default class BrokerMsgVpnList extends ScBrokerCommand<typeof BrokerMsgVpnList> {
  static override args = {}
  static override baseFlags = ScBrokerCommand.brokerFlags
  static override description = `List Message VPNs from a Solace Event Broker.

Retrieves and displays Message VPNs using the SEMP Monitor API.
Supports filtering by name (with wildcards), custom attribute selection, and pagination.
Refer to the SEMP Monitor API docs for available attributes.`
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --count=20',
    '<%= config.bin %> <%= command.id %> --name="prod*"',
    '<%= config.bin %> <%= command.id %> --select=msgVpnName,enabled,connectionCount',
    '<%= config.bin %> <%= command.id %> --all',
  ]
  static override flags = {    ...ScBrokerCommand.brokerFlags,
    all: Flags.boolean({
      char: 'a',
      default: false,
      description: 'Display all Message VPNs (auto-pagination).',
    }),
    count: Flags.integer({
      char: 'c',
      default: 10,
      description: 'Number of Message VPNs to display per page.',
      max: 100,
      min: 1,
    }),
    name: Flags.string({
      char: 'n',
      description: 'Filter Message VPNs by name. Supports * wildcard.',
    }),
    select: Flags.string({
      char: 's',
      description: 'Comma-separated list of attributes to display (max 10).',
      multiple: false,
    }),
  }
  // This command manages Message VPNs directly and lists all VPNs on the
  // broker, so it does not resolve a single VPN via -v/--msg-vpn-name.
  protected override resolveMsgVpn = false
  // Default attributes to display
  private readonly DEFAULT_ATTRIBUTES = [
    'msgVpnName',
    'enabled',
    'state',
    'maxConnectionCount',
    'msgSpoolMsgCount',
    'msgSpoolUsage',
    'maxMsgSpoolUsage',
  ]

  public async run(): Promise<{data: MsgVpnMonitor[]}> {
    const {flags} = await this.parse(BrokerMsgVpnList)

    // Parse and validate select attributes
    const selectedAttrs = this.parseSelectAttributes(flags.select)

    // Create stream table
    const columnCount = selectedAttrs.length
    const streamTable = createStreamTable(columnCount, {
      1: {width: 12, wrapWord: true},
      2: {width: 12, wrapWord: true},
    })

    // Write header row
    const headers = selectedAttrs.map(attr => camelCaseToTitleCase(attr))
    streamTable.write(headers)

    // Fetch Message VPNs with pagination and stream to table
    const vpns = await this.fetchAndDisplayMsgVpns(flags, selectedAttrs, streamTable)

    // Display results
    if (vpns.length === 0) {
      this.log('\nNo Message VPNs found.')
    } else {
      this.log(`\nTotal: ${vpns.length} Message VPN(s)`)
    }

    return {data: vpns}
  }

  /**
   * Fetch Message VPNs with pagination and stream to table
   */
  private async fetchAndDisplayMsgVpns(
    flags: {all: boolean; count: number; name?: string},
    selectedAttrs: string[],
    streamTable: import('table').WritableStream,
  ): Promise<MsgVpnMonitor[]> {
    const allVpns: MsgVpnMonitor[] = []
    let cursor: string | undefined

    while (true) {
      // Build query params
      const params = new URLSearchParams()
      params.set('count', flags.count.toString())

      // Add where clause for Message VPN name filtering if provided
      if (flags.name) {
        params.set('where', `msgVpnName==${flags.name}`)
      }

      // Add select parameter for performance optimization
      // Always include msgVpnName even if not in display attributes
      const selectAttrs = new Set(['msgVpnName', ...selectedAttrs])
      const selectParam = [...selectAttrs].join(',')

      if (cursor) {
        params.set('cursor', cursor)
      }

      // Fetch page
      // Note: select parameter is appended manually to avoid comma encoding
      const endpoint = `/SEMP/v2/monitor/msgVpns?${params.toString()}&select=${selectParam}`
      // eslint-disable-next-line no-await-in-loop
      const response = await this.sempConn.get<MsgVpnsMonitorResponse>(endpoint)

      // Write rows to stream table
      for (const vpn of response.data) {
        const row = selectedAttrs.map(attr => this.formatAttributeValue(vpn, attr))
        streamTable.write(row)
      }

      allVpns.push(...response.data)

      // Check if more pages exist
      const hasMore = Boolean(response.meta.paging?.cursorQuery)
      cursor = response.meta.paging?.cursorQuery

      // Handle pagination
      if (hasMore && !flags.all) {
        // eslint-disable-next-line no-await-in-loop
        const shouldContinue = await confirm(
          {
            default: true,
            message: `\nShowing ${allVpns.length} Message VPNs. More results available. Continue?`,
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

    return allVpns
  }

  /**
   * Format attribute value for display
   */
  private formatAttributeValue(vpn: MsgVpnMonitor, attr: string): string {
    const value = vpn[attr]

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
