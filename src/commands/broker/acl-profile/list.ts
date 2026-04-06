import {camelCaseToTitleCase, createStreamTable} from '@dishantlangayan/sc-cli-core'
import {confirm} from '@inquirer/prompts'
import {Flags} from '@oclif/core'

import {ScBrokerCommand} from '../../../lib/sc-broker-command.js'
import {MsgVpnAclProfileMonitor, MsgVpnAclProfilesMonitorResponse} from '../../../types/msgvpn-acl-profile.js'

export default class BrokerAclProfileList extends ScBrokerCommand<typeof BrokerAclProfileList> {
  static override args = {}
  static override description = `List ACL Profiles from a Solace Event Broker.

Retrieves and displays ACL Profiles from the specified Message VPN using the SEMP Monitor API.
Supports filtering by name (with wildcards), custom attribute selection, and pagination.`
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --count=20',
    '<%= config.bin %> <%= command.id %> --acl-profile-name="client*"',
    '<%= config.bin %> <%= command.id %> --select=aclProfileName,clientConnectDefaultAction,publishTopicDefaultAction',
    '<%= config.bin %> <%= command.id %> --all',
    '<%= config.bin %> <%= command.id %> --acl-profile-name="*custom*" --count=5 --all',
  ]
  static override flags = {
    ...ScBrokerCommand.baseFlags,
    'acl-profile-name': Flags.string({
      description: 'Filter ACL profiles by name. Supports * wildcard.',
    }),
    all: Flags.boolean({
      char: 'a',
      default: false,
      description: 'Display all ACL profiles (auto-pagination).',
    }),
    count: Flags.integer({
      char: 'c',
      default: 10,
      description: 'Number of ACL profiles to display per page.',
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
    'aclProfileName',
    'clientConnectDefaultAction',
    'publishTopicDefaultAction',
    'subscribeTopicDefaultAction',
    'subscribeShareNameDefaultAction',
  ]

  public async run(): Promise<{data: MsgVpnAclProfileMonitor[]}> {
    const {flags} = await this.parse(BrokerAclProfileList)

    // Parse and validate select attributes
    const selectedAttrs = this.parseSelectAttributes(flags.select)

    // Create stream table
    const columnCount = selectedAttrs.length
    const streamTable = createStreamTable(columnCount, {
      1: {width: 20, wrapWord: true},
      2: {width: 15, wrapWord: true},
      3: {width: 15, wrapWord: true},
      4: {width: 15, wrapWord: true},
    })

    // Write header row
    const headers = selectedAttrs.map(attr => camelCaseToTitleCase(attr))
    streamTable.write(headers)

    // Fetch ACL profiles with pagination and stream to table
    const aclProfiles = await this.fetchAndDisplayAclProfiles(flags, selectedAttrs, streamTable)

    // Display results
    if (aclProfiles.length === 0) {
      this.log('No ACL profiles found.')
    } else {
      this.log(`\nTotal: ${aclProfiles.length} ACL profile(s)`)
    }

    return {data: aclProfiles}
  }

  /**
   * Fetch ACL profiles with pagination and stream to table
   */
  private async fetchAndDisplayAclProfiles(
    flags: {'acl-profile-name'?: string; all: boolean; count: number;},
    selectedAttrs: string[],
    streamTable: import('table').WritableStream,
  ): Promise<MsgVpnAclProfileMonitor[]> {
    const allProfiles: MsgVpnAclProfileMonitor[] = []
    let cursor: string | undefined

    while (true) {
      // Build query params
      const params = new URLSearchParams()
      params.set('count', flags.count.toString())

      // Add where clause for ACL profile name filtering if provided
      if (flags['acl-profile-name']) {
        params.set('where', `aclProfileName==${flags['acl-profile-name']}`)
      }

      // Add select parameter for performance optimization
      // Always include msgVpnName and aclProfileName even if not in display attributes
      const selectAttrs = new Set(['aclProfileName', 'msgVpnName', ...selectedAttrs])
      const selectParam = [...selectAttrs].join(',')

      if (cursor) {
        params.set('cursor', cursor)
      }

      // Fetch page
      const endpoint = `/SEMP/v2/monitor/msgVpns/${this.msgVpnName}/aclProfiles?${params.toString()}&select=${selectParam}`
      // eslint-disable-next-line no-await-in-loop
      const response = await this.sempConn.get<MsgVpnAclProfilesMonitorResponse>(endpoint)

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
            message: `\nShowing ${allProfiles.length} ACL profiles. More results available. Continue?`,
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
  private formatAttributeValue(profile: MsgVpnAclProfileMonitor, attr: string): string {
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
