/**
 * SEMP Config API type definitions for MsgVpnAclProfile operations
 */

/**
 * Request body for creating an ACL Profile via SEMP Config API
 */
export interface MsgVpnAclProfileCreateRequest {
  aclProfileName: string
  clientConnectDefaultAction?: 'allow' | 'disallow'
  publishTopicDefaultAction?: 'allow' | 'disallow'
  subscribeShareNameDefaultAction?: 'allow' | 'disallow'
  subscribeTopicDefaultAction?: 'allow' | 'disallow'
}

/**
 * Request body for updating an ACL Profile via SEMP Config API (PATCH)
 * All fields are optional since PATCH only updates provided values
 * Note: aclProfileName is NOT included - it's in the URL path for updates
 */
export interface MsgVpnAclProfileUpdateRequest {
  clientConnectDefaultAction?: 'allow' | 'disallow'
  publishTopicDefaultAction?: 'allow' | 'disallow'
  subscribeShareNameDefaultAction?: 'allow' | 'disallow'
  subscribeTopicDefaultAction?: 'allow' | 'disallow'
}

/**
 * Response from SEMP Config API ACL Profile creation
 */
export interface MsgVpnAclProfileCreateResponse {
  data: MsgVpnAclProfile
  links?: {[key: string]: unknown; uri?: string}
  meta: SempMeta
}

/**
 * Response from SEMP Config API ACL Profile update
 * Same structure as create response
 */
export interface MsgVpnAclProfileUpdateResponse {
  data: MsgVpnAclProfile
  links?: {[key: string]: unknown; uri?: string}
  meta: SempMeta
}

/**
 * Response from SEMP Config API ACL Profile deletion
 * DELETE operations return only metadata (no data or links)
 */
export interface MsgVpnAclProfileDeleteResponse {
  meta: SempMeta
}

/**
 * MsgVpnAclProfile object returned by SEMP
 */
export interface MsgVpnAclProfile {
  [key: string]: unknown // Allow additional SEMP fields
  aclProfileName: string
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
 * Response from SEMP Monitor API ACL Profile retrieval
 */
export interface MsgVpnAclProfileMonitorResponse {
  data: MsgVpnAclProfileMonitor
  links?: {[key: string]: unknown; uri?: string}
  meta: SempMeta
}

/**
 * ACL Profile object returned by SEMP Monitor API
 * Contains configuration and operational state
 */
export interface MsgVpnAclProfileMonitor {
  [key: string]: unknown // Allow additional SEMP fields
  aclProfileName: string
  clientConnectDefaultAction?: 'allow' | 'disallow'
  msgVpnName: string
  publishTopicDefaultAction?: 'allow' | 'disallow'
  subscribeShareNameDefaultAction?: 'allow' | 'disallow'
  subscribeTopicDefaultAction?: 'allow' | 'disallow'
}

/**
 * Response from SEMP Monitor API ACL Profiles list retrieval
 */
export interface MsgVpnAclProfilesMonitorResponse {
  data: MsgVpnAclProfileMonitor[]
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
