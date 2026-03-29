/**
 * SEMP Config API type definitions for MsgVpnClientProfile operations
 */

/**
 * Request body for creating a client profile via SEMP Config API
 */
export interface MsgVpnClientProfileCreateRequest {
  allowBridgeConnectionsEnabled?: boolean
  allowGuaranteedEndpointCreateDurability?: 'all' | 'durable' | 'non-durable'
  allowGuaranteedEndpointCreateEnabled?: boolean
  allowGuaranteedMsgReceiveEnabled?: boolean
  allowGuaranteedMsgSendEnabled?: boolean
  allowSharedSubscriptionsEnabled?: boolean
  allowTransactedSessionsEnabled?: boolean
  apiQueueManagementCopyFromOnCreateName?: string
  apiQueueManagementCopyFromOnCreateTemplateName?: string
  clientProfileName: string
  compressionEnabled?: boolean
  elidingDelay?: number
  elidingEnabled?: boolean
  tlsAllowDowngradeToPlainTextEnabled?: boolean
}

/**
 * Request body for updating a client profile via SEMP Config API (PATCH)
 * All fields are optional since PATCH only updates provided values
 * Note: clientProfileName is NOT included - it's in the URL path for updates
 */
export interface MsgVpnClientProfileUpdateRequest {
  allowBridgeConnectionsEnabled?: boolean
  allowGuaranteedEndpointCreateDurability?: 'all' | 'durable' | 'non-durable'
  allowGuaranteedEndpointCreateEnabled?: boolean
  allowGuaranteedMsgReceiveEnabled?: boolean
  allowGuaranteedMsgSendEnabled?: boolean
  allowSharedSubscriptionsEnabled?: boolean
  allowTransactedSessionsEnabled?: boolean
  apiQueueManagementCopyFromOnCreateName?: string
  apiQueueManagementCopyFromOnCreateTemplateName?: string
  compressionEnabled?: boolean
  elidingDelay?: number
  elidingEnabled?: boolean
  tlsAllowDowngradeToPlainTextEnabled?: boolean
}

/**
 * Response from SEMP Config API client profile creation
 */
export interface MsgVpnClientProfileCreateResponse {
  data: MsgVpnClientProfile
  links?: {[key: string]: unknown; uri?: string}
  meta: SempMeta
}

/**
 * Response from SEMP Config API client profile update
 * Same structure as create response
 */
export interface MsgVpnClientProfileUpdateResponse {
  data: MsgVpnClientProfile
  links?: {[key: string]: unknown; uri?: string}
  meta: SempMeta
}

/**
 * Response from SEMP Config API client profile deletion
 * DELETE operations return only metadata (no data or links)
 */
export interface MsgVpnClientProfileDeleteResponse {
  meta: SempMeta
}

/**
 * MsgVpnClientProfile object returned by SEMP
 */
export interface MsgVpnClientProfile {
  [key: string]: unknown // Allow additional SEMP fields
  clientProfileName: string
  msgVpnName: string
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
 * Response from SEMP Monitor API client profile retrieval
 */
export interface MsgVpnClientProfileMonitorResponse {
  data: MsgVpnClientProfileMonitor
  links?: {[key: string]: unknown; uri?: string}
  meta: SempMeta
}

/**
 * Client Profile object returned by SEMP Monitor API
 * Contains operational state and configuration
 */
export interface MsgVpnClientProfileMonitor {
  [key: string]: unknown // Allow additional SEMP fields
  allowBridgeConnectionsEnabled?: boolean
  allowGuaranteedEndpointCreateDurability?: 'all' | 'durable' | 'non-durable'
  allowGuaranteedEndpointCreateEnabled?: boolean
  allowGuaranteedMsgReceiveEnabled?: boolean
  allowGuaranteedMsgSendEnabled?: boolean
  allowSharedSubscriptionsEnabled?: boolean
  allowTransactedSessionsEnabled?: boolean
  apiQueueManagementCopyFromOnCreateName?: string
  apiQueueManagementCopyFromOnCreateTemplateName?: string
  clientProfileName: string
  compressionEnabled?: boolean
  elidingDelay?: number
  elidingEnabled?: boolean
  msgVpnName: string
  tlsAllowDowngradeToPlainTextEnabled?: boolean
}

/**
 * Response from SEMP Monitor API client profiles list retrieval
 */
export interface MsgVpnClientProfilesMonitorResponse {
  data: MsgVpnClientProfileMonitor[]
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
