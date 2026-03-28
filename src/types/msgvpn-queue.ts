/**
 * SEMP Config API type definitions for MsgVpnQueue operations
 */

/**
 * Request body for creating a queue via SEMP Config API
 */
export interface MsgVpnQueueCreateRequest {
  accessType?: 'exclusive' | 'non-exclusive'
  deadMsgQueue?: string
  egressEnabled?: boolean
  ingressEnabled?: boolean
  maxMsgSpoolUsage?: number
  maxRedeliveryCount?: number
  maxTtl?: number
  owner?: string
  permission?: 'consume' | 'delete' | 'modify-topic' | 'no-access' | 'read-only'
  queueName: string
  respectTtlEnabled?: boolean
}

/**
 * Request body for updating a queue via SEMP Config API (PATCH)
 * All fields are optional since PATCH only updates provided values
 * Note: queueName is NOT included - it's in the URL path for updates
 */
export interface MsgVpnQueueUpdateRequest {
  accessType?: 'exclusive' | 'non-exclusive'
  deadMsgQueue?: string
  egressEnabled?: boolean
  ingressEnabled?: boolean
  maxMsgSpoolUsage?: number
  maxRedeliveryCount?: number
  maxTtl?: number
  owner?: string
  permission?: 'consume' | 'delete' | 'modify-topic' | 'no-access' | 'read-only'
  respectTtlEnabled?: boolean
}

/**
 * Response from SEMP Config API queue creation
 */
export interface MsgVpnQueueCreateResponse {
  data: MsgVpnQueue
  links?: {[key: string]: unknown; uri?: string;}
  meta: SempMeta
}

/**
 * Response from SEMP Config API queue update
 * Same structure as create response
 */
export interface MsgVpnQueueUpdateResponse {
  data: MsgVpnQueue
  links?: {[key: string]: unknown; uri?: string}
  meta: SempMeta
}

/**
 * Response from SEMP Config API queue deletion
 * DELETE operations return only metadata (no data or links)
 */
export interface MsgVpnQueueDeleteResponse {
  meta: SempMeta
}

/**
 * MsgVpnQueue object returned by SEMP
 */
export interface MsgVpnQueue {
  [key: string]: unknown // Allow additional SEMP fields
  msgVpnName: string
  queueName: string
}

/**
 * SEMP response metadata
 */
export interface SempMeta {
  [key: string]: unknown
  request?: {method?: string; uri?: string}
  responseCode?: number
}

/**
 * Response from SEMP Monitor API queue retrieval
 */
export interface MsgVpnQueueMonitorResponse {
  data: MsgVpnQueueMonitor
  links?: {[key: string]: unknown; uri?: string}
  meta: SempMeta
}

/**
 * Queue object returned by SEMP Monitor API
 * Contains operational state and statistics
 */
export interface MsgVpnQueueMonitor {
  [key: string]: unknown // Allow additional SEMP fields
  accessType?: 'exclusive' | 'non-exclusive'
  alreadyBoundBindFailureCount?: number
  averageBindRequestRate?: number
  averageRxByteRate?: number
  averageRxMsgRate?: number
  averageTxByteRate?: number
  averageTxMsgRate?: number
  bindRequestCount?: number
  bindRequestRate?: number
  bindSuccessCount?: number
  consumerAckPropagationEnabled?: boolean
  deadMsgQueue?: string
  durable?: boolean
  egressEnabled?: boolean
  highestAckedMsgId?: number
  highestMsgId?: number
  ingressEnabled?: boolean
  maxBindCount?: number
  maxDeliveredUnackedMsgsPerFlow?: number
  maxMsgSize?: number
  maxMsgSpoolUsage?: number
  maxRedeliveryCount?: number
  maxTtl?: number
  msgSpoolPeakUsage?: number
  msgSpoolUsage?: number
  msgVpnName: string
  owner?: string
  permission?: 'consume' | 'delete' | 'modify-topic' | 'no-access' | 'read-only'
  queueName: string
  redeliveryEnabled?: boolean
  respectMsgPriorityEnabled?: boolean
  respectTtlEnabled?: boolean
  rxByteRate?: number
  rxMsgRate?: number
  spooledByteCount?: number
  spooledMsgCount?: number
  txByteRate?: number
  txMsgRate?: number
  txUnackedMsgCount?: number
}

/**
 * Response from SEMP Monitor API queue subscriptions retrieval
 */
export interface MsgVpnQueueSubscriptionsResponse {
  data: MsgVpnQueueSubscription[]
  links?: {[key: string]: unknown}
  meta: SempMeta
}

/**
 * Queue subscription object from SEMP Monitor API
 */
export interface MsgVpnQueueSubscription {
  msgVpnName: string
  queueName: string
  subscriptionTopic: string
}

/**
 * Response from SEMP Monitor API queues list retrieval
 */
export interface MsgVpnQueuesMonitorResponse {
  data: MsgVpnQueueMonitor[]
  links?: {[key: string]: unknown}
  meta: SempMetaWithPaging
}

/**
 * SEMP response metadata with pagination support
 */
export interface SempMetaWithPaging extends SempMeta {
  count?: number // Total count of objects requested
  paging?: {
    cursorQuery: string // Cursor for next page
    nextPageUri: string // Full URI for next page
  }
}
