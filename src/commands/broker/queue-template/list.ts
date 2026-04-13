import {camelCaseToTitleCase, createStreamTable} from '@dishantlangayan/sc-cli-core'
import {confirm} from '@inquirer/prompts'
import {Flags} from '@oclif/core'

import {ScBrokerCommand} from '../../../lib/sc-broker-command.js'
import {MsgVpnQueueTemplateMonitor, MsgVpnQueueTemplatesMonitorResponse} from '../../../types/msgvpn-queue-template.js'

export default class BrokerQueueTemplateList extends ScBrokerCommand<typeof BrokerQueueTemplateList> {
  static override args = {}
  static override description = `List queue templates from a Solace Event Broker.

Retrieves and displays queue templates from the specified Message VPN using the SEMP Monitor API.
Supports filtering by name (with wildcards), custom attribute selection, and pagination.`
  static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --count=20',
    '<%= config.bin %> <%= command.id %> --queue-template-name="order*"',
    '<%= config.bin %> <%= command.id %> --select=queueTemplateName,permission,maxMsgSpoolUsage',
    '<%= config.bin %> <%= command.id %> --all',
    '<%= config.bin %> <%= command.id %> --queue-template-name="*test*" --count=5 --all',
  ]
  static override flags = {
    ...ScBrokerCommand.baseFlags,
    all: Flags.boolean({
      char: 'a',
      default: false,
      description: 'Display all queue templates (auto-pagination).',
    }),
    count: Flags.integer({
      char: 'c',
      default: 10,
      description: 'Number of queue templates to display per page.',
      max: 100,
      min: 1,
    }),
    'queue-template-name': Flags.string({
      char: 't',
      description: 'Filter queue templates by name. Supports * wildcard.',
    }),
    select: Flags.string({
      char: 's',
      description: 'Comma-separated list of attributes to display (max 10).',
      multiple: false,
    }),
  }
  // Default attributes to display
  private readonly DEFAULT_ATTRIBUTES = [
    'queueTemplateName',
    'accessType',
    'permission',
    'maxBindCount',
    'maxMsgSpoolUsage',
    'queueNameFilter',
  ]

  public async run(): Promise<{data: MsgVpnQueueTemplateMonitor[]}> {
    const {flags} = await this.parse(BrokerQueueTemplateList)

    // Parse and validate select attributes
    const selectedAttrs = this.parseSelectAttributes(flags.select)

    // Create stream table
    const columnCount = selectedAttrs.length
    const streamTable = createStreamTable(columnCount, {
      1: {width: 12, wrapWord: true},
      2: {width: 12, wrapWord: true},
      4: {width: 12, wrapWord: true},
      5: {width: 12, wrapWord: true},
    })

    // Write header row
    const headers = selectedAttrs.map(attr => camelCaseToTitleCase(attr))
    streamTable.write(headers)

    // Fetch queue templates with pagination and stream to table
    // Filtering handled by SEMP API via where clause
    // Attribute selection handled by SEMP API via select parameter
    const queueTemplates = await this.fetchAndDisplayQueueTemplates(flags, selectedAttrs, streamTable)

    // Display results
    if (queueTemplates.length === 0) {
      this.log('\nNo queue templates found.')
    } else {
      this.log(`\nTotal: ${queueTemplates.length} queue template(s)`)
    }

    return {data: queueTemplates}
  }

  /**
   * Fetch queue templates with pagination and stream to table
   */
  private async fetchAndDisplayQueueTemplates(
    flags: {all: boolean; count: number; 'queue-template-name'?: string},
    selectedAttrs: string[],
    streamTable: import('table').WritableStream,
  ): Promise<MsgVpnQueueTemplateMonitor[]> {
    const allQueueTemplates: MsgVpnQueueTemplateMonitor[] = []
    let cursor: string | undefined

    while (true) {
      // Build query params
      const params = new URLSearchParams()
      params.set('count', flags.count.toString())

      // Add where clause for queue template name filtering if provided
      if (flags['queue-template-name']) {
        params.set('where', `queueTemplateName==${flags['queue-template-name']}`)
      }

      // Add select parameter for performance optimization
      // Always include msgVpnName and queueTemplateName even if not in display attributes
      const selectAttrs = new Set(['msgVpnName', 'queueTemplateName', ...selectedAttrs])
      const selectParam = [...selectAttrs].join(',')

      if (cursor) {
        params.set('cursor', cursor)
      }

      // Fetch page
      // Note: select parameter is appended manually to avoid comma encoding
      const endpoint = `/SEMP/v2/monitor/msgVpns/${this.msgVpnName}/queueTemplates?${params.toString()}&select=${selectParam}`
      // eslint-disable-next-line no-await-in-loop
      const response = await this.sempConn.get<MsgVpnQueueTemplatesMonitorResponse>(endpoint)

      // Write rows to stream table
      for (const queueTemplate of response.data) {
        const row = selectedAttrs.map(attr => this.formatAttributeValue(queueTemplate, attr))
        streamTable.write(row)
      }

      allQueueTemplates.push(...response.data)

      // Check if more pages exist
      const hasMore = Boolean(response.meta.paging?.cursorQuery)
      cursor = response.meta.paging?.cursorQuery

      // Handle pagination
      if (hasMore && !flags.all) {
        // eslint-disable-next-line no-await-in-loop
        const shouldContinue = await confirm(
          {
            default: true,
            message: `\nShowing ${allQueueTemplates.length} queue templates. More results available. Continue?`,
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

    return allQueueTemplates
  }

  /**
   * Format attribute value for display
   */
  private formatAttributeValue(queueTemplate: MsgVpnQueueTemplateMonitor, attr: string): string {
    const value = queueTemplate[attr]

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
