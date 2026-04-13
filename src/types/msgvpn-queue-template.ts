/**
 * SEMP Config API type definitions for MsgVpnQueueTemplate operations
 */

/**
 * Request body for creating a queue template via SEMP Config API
 */
export interface MsgVpnQueueTemplateCreateRequest {
  accessType?: 'exclusive' | 'non-exclusive'
  deadMsgQueue?: string
  durabilityOverride?: 'durable' | 'non-durable' | 'none'
  maxBindCount?: number
  maxDeliveredUnackedMsgsPerFlow?: number
  maxMsgSize?: number
  maxMsgSpoolUsage?: number
  maxRedeliveryCount?: number
  maxTtl?: number
  permission?: 'consume' | 'delete' | 'modify-topic' | 'no-access' | 'read-only'
  queueNameFilter?: string
  queueTemplateName: string
}

/**
 * Request body for updating a queue template via SEMP Config API (PATCH)
 * All fields are optional since PATCH only updates provided values
 * Note: queueTemplateName is NOT included - it's in the URL path for updates
 */
export interface MsgVpnQueueTemplateUpdateRequest {
  accessType?: 'exclusive' | 'non-exclusive'
  deadMsgQueue?: string
  durabilityOverride?: 'durable' | 'non-durable' | 'none'
  maxBindCount?: number
  maxDeliveredUnackedMsgsPerFlow?: number
  maxMsgSize?: number
  maxMsgSpoolUsage?: number
  maxRedeliveryCount?: number
  maxTtl?: number
  permission?: 'consume' | 'delete' | 'modify-topic' | 'no-access' | 'read-only'
  queueNameFilter?: string
}

/**
 * Response from SEMP Config API queue template creation
 */
export interface MsgVpnQueueTemplateCreateResponse {
  data: MsgVpnQueueTemplate
  links?: {[key: string]: unknown; uri?: string}
  meta: SempMeta
}

/**
 * Response from SEMP Config API queue template update
 * Same structure as create response
 */
export interface MsgVpnQueueTemplateUpdateResponse {
  data: MsgVpnQueueTemplate
  links?: {[key: string]: unknown; uri?: string}
  meta: SempMeta
}

/**
 * Response from SEMP Config API queue template deletion
 * DELETE operations return only metadata (no data or links)
 */
export interface MsgVpnQueueTemplateDeleteResponse {
  meta: SempMeta
}

/**
 * MsgVpnQueueTemplate object returned by SEMP
 */
export interface MsgVpnQueueTemplate {
  [key: string]: unknown // Allow additional SEMP fields
  msgVpnName: string
  queueTemplateName: string
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
 * Response from SEMP Monitor API queue template retrieval
 */
export interface MsgVpnQueueTemplateMonitorResponse {
  data: MsgVpnQueueTemplateMonitor
  links?: {[key: string]: unknown; uri?: string}
  meta: SempMeta
}

/**
 * Queue template object returned by SEMP Monitor API
 * Contains configuration and state
 */
export interface MsgVpnQueueTemplateMonitor {
  [key: string]: unknown // Allow additional SEMP fields
  accessType?: 'exclusive' | 'non-exclusive'
  consumerAckPropagationEnabled?: boolean
  deadMsgQueue?: string
  deliveryDelay?: number
  durabilityOverride?: 'durable' | 'non-durable' | 'none'
  eventBindCountThreshold?: {clearPercent?: number; setPercent?: number}
  eventMsgSpoolUsageThreshold?: {clearPercent?: number; setPercent?: number}
  eventRejectLowPriorityMsgLimitThreshold?: {clearPercent?: number; setPercent?: number}
  maxBindCount?: number
  maxDeliveredUnackedMsgsPerFlow?: number
  maxMsgSize?: number
  maxMsgSpoolUsage?: number
  maxRedeliveryCount?: number
  maxTtl?: number
  msgVpnName: string
  permission?: 'consume' | 'delete' | 'modify-topic' | 'no-access' | 'read-only'
  queueNameFilter?: string
  queueTemplateName: string
  redeliveryDelayEnabled?: boolean
  redeliveryDelayInitialInterval?: number
  redeliveryDelayMaxInterval?: number
  redeliveryDelayMultiplier?: number
  redeliveryEnabled?: boolean
  rejectLowPriorityMsgEnabled?: boolean
  rejectLowPriorityMsgLimit?: number
  rejectMsgToSenderOnDiscardBehavior?: string
  respectMsgPriorityEnabled?: boolean
  respectTtlEnabled?: boolean
}

/**
 * Response from SEMP Monitor API queue templates list retrieval
 */
export interface MsgVpnQueueTemplatesMonitorResponse {
  data: MsgVpnQueueTemplateMonitor[]
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
