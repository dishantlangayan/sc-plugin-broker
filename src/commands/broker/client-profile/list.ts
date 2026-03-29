import {camelCaseToTitleCase, createStreamTable} from '@dishantlangayan/sc-cli-core'
import {confirm} from '@inquirer/prompts'
import {Flags} from '@oclif/core'

import {ScBrokerCommand} from '../../../lib/sc-broker-command.js'
import {
  MsgVpnClientProfileMonitor,
  MsgVpnClientProfilesMonitorResponse,
} from '../../../types/msgvpn-client-profile.js'

export default class BrokerClientProfileList extends ScBrokerCommand<typeof BrokerClientProfileList> {
  static override args = {}
  static override description = `List Client Profiles from a Solace Event Broker.

Retrieves and displays Client Profiles from the specified Message VPN using the SEMP Monitor API.
Supports filtering by name (with wildcards), custom attribute selection, and pagination.`
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --count=20',
    '<%= config.bin %> <%= command.id %> --client-profile-name="test*"',
    '<%= config.bin %> <%= command.id %> --select=clientProfileName,compressionEnabled,elidingEnabled',
    '<%= config.bin %> <%= command.id %> --all',
    '<%= config.bin %> <%= command.id %> --client-profile-name="*prod*" --count=5 --all',
  ]
  static override flags = {
    ...ScBrokerCommand.baseFlags,
    all: Flags.boolean({
      char: 'a',
      default: false,
      description: 'Display all client profiles (auto-pagination).',
    }),
    'client-profile-name': Flags.string({
      char: 'c',
      description: 'Filter client profiles by name. Supports * wildcard.',
    }),
    count: Flags.integer({
      default: 10,
      description: 'Number of client profiles to display per page.',
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
    'clientProfileName',
    'allowGuaranteedMsgReceiveEnabled',
    'allowGuaranteedMsgSendEnabled',
  ]

  public async run(): Promise<{data: MsgVpnClientProfileMonitor[]}> {
    const {flags} = await this.parse(BrokerClientProfileList)

    // Parse and validate select attributes
    const selectedAttrs = this.parseSelectAttributes(flags.select)

    // Create stream table
    const columnCount = selectedAttrs.length
    const streamTable = createStreamTable(columnCount, {
      1: {width: 25, wrapWord: true},
      2: {width: 12, wrapWord: true},
      3: {width: 12, wrapWord: true},
    })

    // Write header row
    const headers = selectedAttrs.map(attr => camelCaseToTitleCase(attr))
    streamTable.write(headers)

    // Fetch client profiles with pagination and stream to table
    const profiles = await this.fetchAndDisplayClientProfiles(flags, selectedAttrs, streamTable)

    // Display results
    if (profiles.length === 0) {
      this.log('No client profiles found.')
    } else {
      this.log(`\nTotal: ${profiles.length} client profile(s)`)
    }

    return {data: profiles}
  }

  /**
   * Fetch client profiles with pagination and stream to table
   */
  private async fetchAndDisplayClientProfiles(
    flags: {all: boolean; 'client-profile-name'?: string; count: number},
    selectedAttrs: string[],
    streamTable: import('table').WritableStream,
  ): Promise<MsgVpnClientProfileMonitor[]> {
    const allProfiles: MsgVpnClientProfileMonitor[] = []
    let cursor: string | undefined

    while (true) {
      // Build query params
      const params = new URLSearchParams()
      params.set('count', flags.count.toString())

      // Add where clause for client profile name filtering if provided
      if (flags['client-profile-name']) {
        params.set('where', `clientProfileName==${flags['client-profile-name']}`)
      }

      // Add select parameter for performance optimization
      // Always include msgVpnName and clientProfileName even if not in display attributes
      const selectAttrs = new Set(['clientProfileName', 'msgVpnName', ...selectedAttrs])
      const selectParam = [...selectAttrs].join(',')

      if (cursor) {
        params.set('cursor', cursor)
      }

      // Fetch page
      // Note: select parameter is appended manually to avoid comma encoding
      const endpoint = `/SEMP/v2/monitor/msgVpns/${this.msgVpnName}/clientProfiles?${params.toString()}&select=${selectParam}`
      // eslint-disable-next-line no-await-in-loop
      const response = await this.sempConn.get<MsgVpnClientProfilesMonitorResponse>(endpoint)

      // Write rows to stream table
      for (const profile of response.data) {
        const row = selectedAttrs.map(attr => this.formatAttributeValue(profile, attr))
        streamTable.write(row)
      }

      allProfiles.push(...response.data)

      // Check if more pages exist
      const hasMore = Boolean(response.meta.paging?.cursorQuery)
      cursor = response.meta.paging?.cursorQuery

      // Handle pagination
      if (hasMore && !flags.all) {
        // eslint-disable-next-line no-await-in-loop
        const shouldContinue = await confirm(
          {
            default: true,
            message: `\nShowing ${allProfiles.length} client profiles. More results available. Continue?`,
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

    return allProfiles
  }

  /**
   * Format attribute value for display
   */
  private formatAttributeValue(profile: MsgVpnClientProfileMonitor, attr: string): string {
    const value = profile[attr]

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
