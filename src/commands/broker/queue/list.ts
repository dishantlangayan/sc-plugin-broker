import {camelCaseToTitleCase, renderTable} from '@dishantlangayan/sc-cli-core'
import {confirm} from '@inquirer/prompts'
import {Flags} from '@oclif/core'

import {ScBrokerCommand} from '../../../lib/sc-broker-command.js'
import {MsgVpnQueueMonitor, MsgVpnQueuesMonitorResponse} from '../../../types/msgvpn-queue.js'

export default class BrokerQueueList extends ScBrokerCommand<typeof BrokerQueueList> {
  static override args = {}
static override description = `List queues from a Solace Event Broker.

Retrieves and displays queues from the specified Message VPN using the SEMP Monitor API.
Supports filtering by name (with wildcards), custom attribute selection, and pagination.`
static override examples = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --count=20',
    '<%= config.bin %> <%= command.id %> --queue-name="order*"',
    '<%= config.bin %> <%= command.id %> --select=queueName,owner,maxMsgSpoolUsage',
    '<%= config.bin %> <%= command.id %> --all',
    '<%= config.bin %> <%= command.id %> --queue-name="*test*" --count=5 --all',
  ]
static override flags = {
    ...ScBrokerCommand.baseFlags,
    all: Flags.boolean({
      char: 'a',
      default: false,
      description: 'Display all queues (auto-pagination).',
    }),
    count: Flags.integer({
      char: 'c',
      default: 10,
      description: 'Number of queues to display per page.',
      max: 100,
      min: 1,
    }),
    'queue-name': Flags.string({
      char: 'q',
      description: 'Filter queues by name. Supports * wildcard.',
    }),
    select: Flags.string({
      char: 's',
      description: 'Comma-separated list of attributes to display (max 10).',
      multiple: false,
    }),
  }
// Default attributes to display
  private readonly DEFAULT_ATTRIBUTES = [
    'queueName',
    'ingressEnabled',
    'egressEnabled',
    'accessType',
    'spooledMsgCount',
    'spooledByteCount',
    'durable',
  ]

  public async run(): Promise<{data: MsgVpnQueueMonitor[]}> {
    const {flags} = await this.parse(BrokerQueueList)

    // Parse and validate select attributes
    const selectedAttrs = this.parseSelectAttributes(flags.select)

    // Fetch queues with pagination
    // Filtering handled by SEMP API via where clause
    // Attribute selection handled by SEMP API via select parameter
    const queues = await this.fetchAllQueues(flags, selectedAttrs)

    // Display results
    if (queues.length === 0) {
      this.log('No queues found.')
    } else {
      this.displayQueuesTable(queues, selectedAttrs)
    }

    return {data: queues}
  }

  /**
   * Display queues as a formatted table
   */
  private displayQueuesTable(queues: MsgVpnQueueMonitor[], attributes: string[]): void {
    // Format attribute names for header (camelCase -> Title Case)
    const headers = attributes.map(attr => camelCaseToTitleCase(attr))

    // Build table rows
    const rows = queues.map(queue => attributes.map(attr => this.formatAttributeValue(queue, attr)))

    // Render table
    const table = [headers, ...rows]
    this.log(renderTable(table, {
      1: {width: 12, wrapWord: true},
      2: {width: 12, wrapWord: true},
      4: {width: 12, wrapWord: true},
      5: {width: 12, wrapWord: true},
    }))
    this.log(`\nTotal: ${queues.length} queue(s)`)
  }

  /**
   * Fetch all queues with pagination, filtering, and attribute selection
   */
  private async fetchAllQueues(
    flags: {all: boolean; count: number; 'queue-name'?: string},
    selectedAttrs: string[],
  ): Promise<MsgVpnQueueMonitor[]> {
    const allQueues: MsgVpnQueueMonitor[] = []
    let cursor: string | undefined

    while (true) {
      // Build query params
      const params = new URLSearchParams()
      params.set('count', flags.count.toString())

      // Add where clause for queue name filtering if provided
      if (flags['queue-name']) {
        params.set('where', `queueName==${flags['queue-name']}`)
      }

      // Add select parameter for performance optimization
      // Always include msgVpnName and queueName even if not in display attributes
      const selectAttrs = new Set(['msgVpnName', 'queueName', ...selectedAttrs])
      const selectParam = [...selectAttrs].join(',')

      if (cursor) {
        params.set('cursor', cursor)
      }

      // Fetch page
      // Note: select parameter is appended manually to avoid comma encoding
      const endpoint = `/SEMP/v2/monitor/msgVpns/${this.msgVpnName}/queues?${params.toString()}&select=${selectParam}`
      // eslint-disable-next-line no-await-in-loop
      const response = await this.sempConn.get<MsgVpnQueuesMonitorResponse>(endpoint)

      allQueues.push(...response.data)

      // Check if more pages exist
      const hasMore = Boolean(response.meta.paging?.cursorQuery)
      cursor = response.meta.paging?.cursorQuery

      // Handle pagination
      if (hasMore && !flags.all) {
        // eslint-disable-next-line no-await-in-loop
        const shouldContinue = await confirm({
          default: false,
          message: `Showing ${allQueues.length} queues. More results available. Continue?`,
        })

        if (!shouldContinue) {
          break
        }
      } else if (!hasMore) {
        break
      }
    }

    return allQueues
  }

  /**
   * Format attribute value for display
   */
  private formatAttributeValue(queue: MsgVpnQueueMonitor, attr: string): string {
    const value = queue[attr]

    // Handle spooledByteCount conversion to MB
    if (attr === 'spooledByteCount' && typeof value === 'number') {
      return (value / (1024 * 1024)).toFixed(2) + ' MB'
    }

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
