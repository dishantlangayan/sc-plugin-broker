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
 * Response from SEMP Config API queue creation
 */
export interface MsgVpnQueueCreateResponse {
  data: MsgVpnQueue
  links?: {[key: string]: unknown; uri?: string;}
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
