//Originally from https://github.com/Frooastside/node-widevine/blob/main/src/license_protocol.ts

import Long from 'long';
import _m0 from 'protobufjs/minimal';

export const protobufPackage = 'license_protocol';

export enum LicenseType {
  STREAMING = 1,
  OFFLINE = 2,
  /** AUTOMATIC - License type decision is left to provider. */
  AUTOMATIC = 3,
  UNRECOGNIZED = -1
}

export function licenseTypeFromJSON(object: any): LicenseType {
  switch (object) {
  case 1:
  case 'STREAMING':
    return LicenseType.STREAMING;
  case 2:
  case 'OFFLINE':
    return LicenseType.OFFLINE;
  case 3:
  case 'AUTOMATIC':
    return LicenseType.AUTOMATIC;
  case -1:
  case 'UNRECOGNIZED':
  default:
    return LicenseType.UNRECOGNIZED;
  }
}

export function licenseTypeToJSON(object: LicenseType): string {
  switch (object) {
  case LicenseType.STREAMING:
    return 'STREAMING';
  case LicenseType.OFFLINE:
    return 'OFFLINE';
  case LicenseType.AUTOMATIC:
    return 'AUTOMATIC';
  case LicenseType.UNRECOGNIZED:
  default:
    return 'UNRECOGNIZED';
  }
}

export enum PlatformVerificationStatus {
  /** PLATFORM_UNVERIFIED - The platform is not verified. */
  PLATFORM_UNVERIFIED = 0,
  /** PLATFORM_TAMPERED - Tampering detected on the platform. */
  PLATFORM_TAMPERED = 1,
  /** PLATFORM_SOFTWARE_VERIFIED - The platform has been verified by means of software. */
  PLATFORM_SOFTWARE_VERIFIED = 2,
  /** PLATFORM_HARDWARE_VERIFIED - The platform has been verified by means of hardware (e.g. secure boot). */
  PLATFORM_HARDWARE_VERIFIED = 3,
  /** PLATFORM_NO_VERIFICATION - Platform verification was not performed. */
  PLATFORM_NO_VERIFICATION = 4,
  /**
   * PLATFORM_SECURE_STORAGE_SOFTWARE_VERIFIED - Platform and secure storage capability have been verified by means of
   * software.
   */
  PLATFORM_SECURE_STORAGE_SOFTWARE_VERIFIED = 5,
  UNRECOGNIZED = -1
}

export function platformVerificationStatusFromJSON(object: any): PlatformVerificationStatus {
  switch (object) {
  case 0:
  case 'PLATFORM_UNVERIFIED':
    return PlatformVerificationStatus.PLATFORM_UNVERIFIED;
  case 1:
  case 'PLATFORM_TAMPERED':
    return PlatformVerificationStatus.PLATFORM_TAMPERED;
  case 2:
  case 'PLATFORM_SOFTWARE_VERIFIED':
    return PlatformVerificationStatus.PLATFORM_SOFTWARE_VERIFIED;
  case 3:
  case 'PLATFORM_HARDWARE_VERIFIED':
    return PlatformVerificationStatus.PLATFORM_HARDWARE_VERIFIED;
  case 4:
  case 'PLATFORM_NO_VERIFICATION':
    return PlatformVerificationStatus.PLATFORM_NO_VERIFICATION;
  case 5:
  case 'PLATFORM_SECURE_STORAGE_SOFTWARE_VERIFIED':
    return PlatformVerificationStatus.PLATFORM_SECURE_STORAGE_SOFTWARE_VERIFIED;
  case -1:
  case 'UNRECOGNIZED':
  default:
    return PlatformVerificationStatus.UNRECOGNIZED;
  }
}

export function platformVerificationStatusToJSON(object: PlatformVerificationStatus): string {
  switch (object) {
  case PlatformVerificationStatus.PLATFORM_UNVERIFIED:
    return 'PLATFORM_UNVERIFIED';
  case PlatformVerificationStatus.PLATFORM_TAMPERED:
    return 'PLATFORM_TAMPERED';
  case PlatformVerificationStatus.PLATFORM_SOFTWARE_VERIFIED:
    return 'PLATFORM_SOFTWARE_VERIFIED';
  case PlatformVerificationStatus.PLATFORM_HARDWARE_VERIFIED:
    return 'PLATFORM_HARDWARE_VERIFIED';
  case PlatformVerificationStatus.PLATFORM_NO_VERIFICATION:
    return 'PLATFORM_NO_VERIFICATION';
  case PlatformVerificationStatus.PLATFORM_SECURE_STORAGE_SOFTWARE_VERIFIED:
    return 'PLATFORM_SECURE_STORAGE_SOFTWARE_VERIFIED';
  case PlatformVerificationStatus.UNRECOGNIZED:
  default:
    return 'UNRECOGNIZED';
  }
}

export enum ProtocolVersion {
  VERSION_2_0 = 20,
  VERSION_2_1 = 21,
  VERSION_2_2 = 22,
  UNRECOGNIZED = -1
}

export function protocolVersionFromJSON(object: any): ProtocolVersion {
  switch (object) {
  case 20:
  case 'VERSION_2_0':
    return ProtocolVersion.VERSION_2_0;
  case 21:
  case 'VERSION_2_1':
    return ProtocolVersion.VERSION_2_1;
  case 22:
  case 'VERSION_2_2':
    return ProtocolVersion.VERSION_2_2;
  case -1:
  case 'UNRECOGNIZED':
  default:
    return ProtocolVersion.UNRECOGNIZED;
  }
}

export function protocolVersionToJSON(object: ProtocolVersion): string {
  switch (object) {
  case ProtocolVersion.VERSION_2_0:
    return 'VERSION_2_0';
  case ProtocolVersion.VERSION_2_1:
    return 'VERSION_2_1';
  case ProtocolVersion.VERSION_2_2:
    return 'VERSION_2_2';
  case ProtocolVersion.UNRECOGNIZED:
  default:
    return 'UNRECOGNIZED';
  }
}

export enum HashAlgorithmProto {
  /**
   * HASH_ALGORITHM_UNSPECIFIED - Unspecified hash algorithm: SHA_256 shall be used for ECC based algorithms
   * and SHA_1 shall be used otherwise.
   */
  HASH_ALGORITHM_UNSPECIFIED = 0,
  HASH_ALGORITHM_SHA_1 = 1,
  HASH_ALGORITHM_SHA_256 = 2,
  HASH_ALGORITHM_SHA_384 = 3,
  UNRECOGNIZED = -1
}

export function hashAlgorithmProtoFromJSON(object: any): HashAlgorithmProto {
  switch (object) {
  case 0:
  case 'HASH_ALGORITHM_UNSPECIFIED':
    return HashAlgorithmProto.HASH_ALGORITHM_UNSPECIFIED;
  case 1:
  case 'HASH_ALGORITHM_SHA_1':
    return HashAlgorithmProto.HASH_ALGORITHM_SHA_1;
  case 2:
  case 'HASH_ALGORITHM_SHA_256':
    return HashAlgorithmProto.HASH_ALGORITHM_SHA_256;
  case 3:
  case 'HASH_ALGORITHM_SHA_384':
    return HashAlgorithmProto.HASH_ALGORITHM_SHA_384;
  case -1:
  case 'UNRECOGNIZED':
  default:
    return HashAlgorithmProto.UNRECOGNIZED;
  }
}

export function hashAlgorithmProtoToJSON(object: HashAlgorithmProto): string {
  switch (object) {
  case HashAlgorithmProto.HASH_ALGORITHM_UNSPECIFIED:
    return 'HASH_ALGORITHM_UNSPECIFIED';
  case HashAlgorithmProto.HASH_ALGORITHM_SHA_1:
    return 'HASH_ALGORITHM_SHA_1';
  case HashAlgorithmProto.HASH_ALGORITHM_SHA_256:
    return 'HASH_ALGORITHM_SHA_256';
  case HashAlgorithmProto.HASH_ALGORITHM_SHA_384:
    return 'HASH_ALGORITHM_SHA_384';
  case HashAlgorithmProto.UNRECOGNIZED:
  default:
    return 'UNRECOGNIZED';
  }
}

/**
 * LicenseIdentification is propagated from LicenseRequest to License,
 * incrementing version with each iteration.
 */
export interface LicenseIdentification {
  requestId: Buffer;
  sessionId: Buffer;
  purchaseId: Buffer;
  type: LicenseType;
  version: number;
  providerSessionToken: Buffer;
}

export interface License {
  id: LicenseIdentification | undefined;
  policy: License_Policy | undefined;
  key: License_KeyContainer[];
  /**
   * Time of the request in seconds (UTC) as set in
   * LicenseRequest.request_time.  If this time is not set in the request,
   * the local time at the license service is used in this field.
   */
  licenseStartTime: Long;
  remoteAttestationVerified: boolean;
  /** Client token generated by the content provider. Optional. */
  providerClientToken: Buffer;
  /**
   * 4cc code specifying the CENC protection scheme as defined in the CENC 3.0
   * specification. Propagated from Widevine PSSH box. Optional.
   */
  protectionScheme: number;
  /**
   * 8 byte verification field "HDCPDATA" followed by unsigned 32 bit minimum
   * HDCP SRM version (whether the version is for HDCP1 SRM or HDCP2 SRM
   * depends on client max_hdcp_version).
   * Additional details can be found in Widevine Modular DRM Security
   * Integration Guide for CENC.
   */
  srmRequirement: Buffer;
  /**
   * If present this contains a signed SRM file (either HDCP1 SRM or HDCP2 SRM
   * depending on client max_hdcp_version) that should be installed on the
   * client device.
   */
  srmUpdate: Buffer;
  /**
   * Indicates the status of any type of platform verification performed by the
   * server.
   */
  platformVerificationStatus: PlatformVerificationStatus;
  /** IDs of the groups for which keys are delivered in this license, if any. */
  groupIds: Buffer[];
}

export interface License_Policy {
  /** Indicates that playback of the content is allowed. */
  canPlay: boolean;
  /**
   * Indicates that the license may be persisted to non-volatile
   * storage for offline use.
   */
  canPersist: boolean;
  /** Indicates that renewal of this license is allowed. */
  canRenew: boolean;
  /** Indicates the rental window. */
  rentalDurationSeconds: Long;
  /** Indicates the viewing window, once playback has begun. */
  playbackDurationSeconds: Long;
  /** Indicates the time window for this specific license. */
  licenseDurationSeconds: Long;
  /**
   * The window of time, in which playback is allowed to continue while
   * renewal is attempted, yet unsuccessful due to backend problems with
   * the license server.
   */
  renewalRecoveryDurationSeconds: Long;
  /**
   * All renewal requests for this license shall be directed to the
   * specified URL.
   */
  renewalServerUrl: string;
  /**
   * How many seconds after license_start_time, before renewal is first
   * attempted.
   */
  renewalDelaySeconds: Long;
  /**
   * Specifies the delay in seconds between subsequent license
   * renewal requests, in case of failure.
   */
  renewalRetryIntervalSeconds: Long;
  /**
   * Indicates that the license shall be sent for renewal when usage is
   * started.
   */
  renewWithUsage: boolean;
  /**
   * Indicates to client that license renewal and release requests ought to
   * include ClientIdentification (client_id).
   */
  alwaysIncludeClientId: boolean;
  /**
   * Duration of grace period before playback_duration_seconds (short window)
   * goes into effect. Optional.
   */
  playStartGracePeriodSeconds: Long;
  /**
   * Enables "soft enforcement" of playback_duration_seconds, letting the user
   * finish playback even if short window expires. Optional.
   */
  softEnforcePlaybackDuration: boolean;
  /**
   * Enables "soft enforcement" of rental_duration_seconds. Initial playback
   * must always start before rental duration expires.  In order to allow
   * subsequent playbacks to start after the rental duration expires,
   * soft_enforce_playback_duration must be true. Otherwise, subsequent
   * playbacks will not be allowed once rental duration expires. Optional.
   */
  softEnforceRentalDuration: boolean;
}

export interface License_KeyContainer {
  id: Buffer;
  iv: Buffer;
  key: Buffer;
  type: License_KeyContainer_KeyType;
  level: License_KeyContainer_SecurityLevel;
  requiredProtection: License_KeyContainer_OutputProtection | undefined;
  /**
   * NOTE: Use of requested_protection is not recommended as it is only
   * supported on a small number of platforms.
   */
  requestedProtection: License_KeyContainer_OutputProtection | undefined;
  keyControl: License_KeyContainer_KeyControl | undefined;
  operatorSessionKeyPermissions: License_KeyContainer_OperatorSessionKeyPermissions | undefined;
  /**
   * Optional video resolution constraints. If the video resolution of the
   * content being decrypted/decoded falls within one of the specified ranges,
   * the optional required_protections may be applied. Otherwise an error will
   * be reported.
   * NOTE: Use of this feature is not recommended, as it is only supported on
   * a small number of platforms.
   */
  videoResolutionConstraints: License_KeyContainer_VideoResolutionConstraint[];
  /**
   * Optional flag to indicate the key must only be used if the client
   * supports anti rollback of the user table.  Content provider can query the
   * client capabilities to determine if the client support this feature.
   */
  antiRollbackUsageTable: boolean;
  /**
   * Optional not limited to commonly known track types such as SD, HD.
   * It can be some provider defined label to identify the track.
   */
  trackLabel: string;
}

export enum License_KeyContainer_KeyType {
  /** SIGNING - Exactly one key of this type must appear. */
  SIGNING = 1,
  /** CONTENT - Content key. */
  CONTENT = 2,
  /** KEY_CONTROL - Key control block for license renewals. No key. */
  KEY_CONTROL = 3,
  /** OPERATOR_SESSION - wrapped keys for auxiliary crypto operations. */
  OPERATOR_SESSION = 4,
  /** ENTITLEMENT - Entitlement keys. */
  ENTITLEMENT = 5,
  /** OEM_CONTENT - Partner-specific content key. */
  OEM_CONTENT = 6,
  UNRECOGNIZED = -1
}

export function license_KeyContainer_KeyTypeFromJSON(object: any): License_KeyContainer_KeyType {
  switch (object) {
  case 1:
  case 'SIGNING':
    return License_KeyContainer_KeyType.SIGNING;
  case 2:
  case 'CONTENT':
    return License_KeyContainer_KeyType.CONTENT;
  case 3:
  case 'KEY_CONTROL':
    return License_KeyContainer_KeyType.KEY_CONTROL;
  case 4:
  case 'OPERATOR_SESSION':
    return License_KeyContainer_KeyType.OPERATOR_SESSION;
  case 5:
  case 'ENTITLEMENT':
    return License_KeyContainer_KeyType.ENTITLEMENT;
  case 6:
  case 'OEM_CONTENT':
    return License_KeyContainer_KeyType.OEM_CONTENT;
  case -1:
  case 'UNRECOGNIZED':
  default:
    return License_KeyContainer_KeyType.UNRECOGNIZED;
  }
}

export function license_KeyContainer_KeyTypeToJSON(object: License_KeyContainer_KeyType): string {
  switch (object) {
  case License_KeyContainer_KeyType.SIGNING:
    return 'SIGNING';
  case License_KeyContainer_KeyType.CONTENT:
    return 'CONTENT';
  case License_KeyContainer_KeyType.KEY_CONTROL:
    return 'KEY_CONTROL';
  case License_KeyContainer_KeyType.OPERATOR_SESSION:
    return 'OPERATOR_SESSION';
  case License_KeyContainer_KeyType.ENTITLEMENT:
    return 'ENTITLEMENT';
  case License_KeyContainer_KeyType.OEM_CONTENT:
    return 'OEM_CONTENT';
  case License_KeyContainer_KeyType.UNRECOGNIZED:
  default:
    return 'UNRECOGNIZED';
  }
}

/**
 * The SecurityLevel enumeration allows the server to communicate the level
 * of robustness required by the client, in order to use the key.
 */
export enum License_KeyContainer_SecurityLevel {
  /** SW_SECURE_CRYPTO - Software-based whitebox crypto is required. */
  SW_SECURE_CRYPTO = 1,
  /** SW_SECURE_DECODE - Software crypto and an obfuscated decoder is required. */
  SW_SECURE_DECODE = 2,
  /**
   * HW_SECURE_CRYPTO - The key material and crypto operations must be performed within a
   * hardware backed trusted execution environment.
   */
  HW_SECURE_CRYPTO = 3,
  /**
   * HW_SECURE_DECODE - The crypto and decoding of content must be performed within a hardware
   * backed trusted execution environment.
   */
  HW_SECURE_DECODE = 4,
  /**
   * HW_SECURE_ALL - The crypto, decoding and all handling of the media (compressed and
   * uncompressed) must be handled within a hardware backed trusted
   * execution environment.
   */
  HW_SECURE_ALL = 5,
  UNRECOGNIZED = -1
}

export function license_KeyContainer_SecurityLevelFromJSON(object: any): License_KeyContainer_SecurityLevel {
  switch (object) {
  case 1:
  case 'SW_SECURE_CRYPTO':
    return License_KeyContainer_SecurityLevel.SW_SECURE_CRYPTO;
  case 2:
  case 'SW_SECURE_DECODE':
    return License_KeyContainer_SecurityLevel.SW_SECURE_DECODE;
  case 3:
  case 'HW_SECURE_CRYPTO':
    return License_KeyContainer_SecurityLevel.HW_SECURE_CRYPTO;
  case 4:
  case 'HW_SECURE_DECODE':
    return License_KeyContainer_SecurityLevel.HW_SECURE_DECODE;
  case 5:
  case 'HW_SECURE_ALL':
    return License_KeyContainer_SecurityLevel.HW_SECURE_ALL;
  case -1:
  case 'UNRECOGNIZED':
  default:
    return License_KeyContainer_SecurityLevel.UNRECOGNIZED;
  }
}

export function license_KeyContainer_SecurityLevelToJSON(object: License_KeyContainer_SecurityLevel): string {
  switch (object) {
  case License_KeyContainer_SecurityLevel.SW_SECURE_CRYPTO:
    return 'SW_SECURE_CRYPTO';
  case License_KeyContainer_SecurityLevel.SW_SECURE_DECODE:
    return 'SW_SECURE_DECODE';
  case License_KeyContainer_SecurityLevel.HW_SECURE_CRYPTO:
    return 'HW_SECURE_CRYPTO';
  case License_KeyContainer_SecurityLevel.HW_SECURE_DECODE:
    return 'HW_SECURE_DECODE';
  case License_KeyContainer_SecurityLevel.HW_SECURE_ALL:
    return 'HW_SECURE_ALL';
  case License_KeyContainer_SecurityLevel.UNRECOGNIZED:
  default:
    return 'UNRECOGNIZED';
  }
}

export interface License_KeyContainer_KeyControl {
  /**
   * |key_control| is documented in:
   * Widevine Modular DRM Security Integration Guide for CENC
   * If present, the key control must be communicated to the secure
   * environment prior to any usage. This message is automatically generated
   * by the Widevine License Server SDK.
   */
  keyControlBlock: Buffer;
  iv: Buffer;
}

export interface License_KeyContainer_OutputProtection {
  hdcp: License_KeyContainer_OutputProtection_HDCP;
  cgmsFlags: License_KeyContainer_OutputProtection_CGMS;
  hdcpSrmRule: License_KeyContainer_OutputProtection_HdcpSrmRule;
  /** Optional requirement to indicate analog output is not allowed. */
  disableAnalogOutput: boolean;
  /** Optional requirement to indicate digital output is not allowed. */
  disableDigitalOutput: boolean;
}

/**
 * Indicates whether HDCP is required on digital outputs, and which
 * version should be used.
 */
export enum License_KeyContainer_OutputProtection_HDCP {
  HDCP_NONE = 0,
  HDCP_V1 = 1,
  HDCP_V2 = 2,
  HDCP_V2_1 = 3,
  HDCP_V2_2 = 4,
  HDCP_V2_3 = 5,
  HDCP_NO_DIGITAL_OUTPUT = 255,
  UNRECOGNIZED = -1
}

export function license_KeyContainer_OutputProtection_HDCPFromJSON(object: any): License_KeyContainer_OutputProtection_HDCP {
  switch (object) {
  case 0:
  case 'HDCP_NONE':
    return License_KeyContainer_OutputProtection_HDCP.HDCP_NONE;
  case 1:
  case 'HDCP_V1':
    return License_KeyContainer_OutputProtection_HDCP.HDCP_V1;
  case 2:
  case 'HDCP_V2':
    return License_KeyContainer_OutputProtection_HDCP.HDCP_V2;
  case 3:
  case 'HDCP_V2_1':
    return License_KeyContainer_OutputProtection_HDCP.HDCP_V2_1;
  case 4:
  case 'HDCP_V2_2':
    return License_KeyContainer_OutputProtection_HDCP.HDCP_V2_2;
  case 5:
  case 'HDCP_V2_3':
    return License_KeyContainer_OutputProtection_HDCP.HDCP_V2_3;
  case 255:
  case 'HDCP_NO_DIGITAL_OUTPUT':
    return License_KeyContainer_OutputProtection_HDCP.HDCP_NO_DIGITAL_OUTPUT;
  case -1:
  case 'UNRECOGNIZED':
  default:
    return License_KeyContainer_OutputProtection_HDCP.UNRECOGNIZED;
  }
}

export function license_KeyContainer_OutputProtection_HDCPToJSON(object: License_KeyContainer_OutputProtection_HDCP): string {
  switch (object) {
  case License_KeyContainer_OutputProtection_HDCP.HDCP_NONE:
    return 'HDCP_NONE';
  case License_KeyContainer_OutputProtection_HDCP.HDCP_V1:
    return 'HDCP_V1';
  case License_KeyContainer_OutputProtection_HDCP.HDCP_V2:
    return 'HDCP_V2';
  case License_KeyContainer_OutputProtection_HDCP.HDCP_V2_1:
    return 'HDCP_V2_1';
  case License_KeyContainer_OutputProtection_HDCP.HDCP_V2_2:
    return 'HDCP_V2_2';
  case License_KeyContainer_OutputProtection_HDCP.HDCP_V2_3:
    return 'HDCP_V2_3';
  case License_KeyContainer_OutputProtection_HDCP.HDCP_NO_DIGITAL_OUTPUT:
    return 'HDCP_NO_DIGITAL_OUTPUT';
  case License_KeyContainer_OutputProtection_HDCP.UNRECOGNIZED:
  default:
    return 'UNRECOGNIZED';
  }
}

/** Indicate the CGMS setting to be inserted on analog output. */
export enum License_KeyContainer_OutputProtection_CGMS {
  CGMS_NONE = 42,
  COPY_FREE = 0,
  COPY_ONCE = 2,
  COPY_NEVER = 3,
  UNRECOGNIZED = -1
}

export function license_KeyContainer_OutputProtection_CGMSFromJSON(object: any): License_KeyContainer_OutputProtection_CGMS {
  switch (object) {
  case 42:
  case 'CGMS_NONE':
    return License_KeyContainer_OutputProtection_CGMS.CGMS_NONE;
  case 0:
  case 'COPY_FREE':
    return License_KeyContainer_OutputProtection_CGMS.COPY_FREE;
  case 2:
  case 'COPY_ONCE':
    return License_KeyContainer_OutputProtection_CGMS.COPY_ONCE;
  case 3:
  case 'COPY_NEVER':
    return License_KeyContainer_OutputProtection_CGMS.COPY_NEVER;
  case -1:
  case 'UNRECOGNIZED':
  default:
    return License_KeyContainer_OutputProtection_CGMS.UNRECOGNIZED;
  }
}

export function license_KeyContainer_OutputProtection_CGMSToJSON(object: License_KeyContainer_OutputProtection_CGMS): string {
  switch (object) {
  case License_KeyContainer_OutputProtection_CGMS.CGMS_NONE:
    return 'CGMS_NONE';
  case License_KeyContainer_OutputProtection_CGMS.COPY_FREE:
    return 'COPY_FREE';
  case License_KeyContainer_OutputProtection_CGMS.COPY_ONCE:
    return 'COPY_ONCE';
  case License_KeyContainer_OutputProtection_CGMS.COPY_NEVER:
    return 'COPY_NEVER';
  case License_KeyContainer_OutputProtection_CGMS.UNRECOGNIZED:
  default:
    return 'UNRECOGNIZED';
  }
}

export enum License_KeyContainer_OutputProtection_HdcpSrmRule {
  HDCP_SRM_RULE_NONE = 0,
  /**
   * CURRENT_SRM - In 'required_protection', this means most current SRM is required.
   * Update the SRM on the device. If update cannot happen,
   * do not allow the key.
   * In 'requested_protection', this means most current SRM is requested.
   * Update the SRM on the device. If update cannot happen,
   * allow use of the key anyway.
   */
  CURRENT_SRM = 1,
  UNRECOGNIZED = -1
}

export function license_KeyContainer_OutputProtection_HdcpSrmRuleFromJSON(object: any): License_KeyContainer_OutputProtection_HdcpSrmRule {
  switch (object) {
  case 0:
  case 'HDCP_SRM_RULE_NONE':
    return License_KeyContainer_OutputProtection_HdcpSrmRule.HDCP_SRM_RULE_NONE;
  case 1:
  case 'CURRENT_SRM':
    return License_KeyContainer_OutputProtection_HdcpSrmRule.CURRENT_SRM;
  case -1:
  case 'UNRECOGNIZED':
  default:
    return License_KeyContainer_OutputProtection_HdcpSrmRule.UNRECOGNIZED;
  }
}

export function license_KeyContainer_OutputProtection_HdcpSrmRuleToJSON(object: License_KeyContainer_OutputProtection_HdcpSrmRule): string {
  switch (object) {
  case License_KeyContainer_OutputProtection_HdcpSrmRule.HDCP_SRM_RULE_NONE:
    return 'HDCP_SRM_RULE_NONE';
  case License_KeyContainer_OutputProtection_HdcpSrmRule.CURRENT_SRM:
    return 'CURRENT_SRM';
  case License_KeyContainer_OutputProtection_HdcpSrmRule.UNRECOGNIZED:
  default:
    return 'UNRECOGNIZED';
  }
}

export interface License_KeyContainer_VideoResolutionConstraint {
  /** Minimum and maximum video resolutions in the range (height x width). */
  minResolutionPixels: number;
  maxResolutionPixels: number;
  /**
   * Optional output protection requirements for this range. If not
   * specified, the OutputProtection in the KeyContainer applies.
   */
  requiredProtection: License_KeyContainer_OutputProtection | undefined;
}

export interface License_KeyContainer_OperatorSessionKeyPermissions {
  /**
   * Permissions/key usage flags for operator service keys
   * (type = OPERATOR_SESSION).
   */
  allowEncrypt: boolean;
  allowDecrypt: boolean;
  allowSign: boolean;
  allowSignatureVerify: boolean;
}

export interface LicenseRequest {
  /**
   * The client_id provides information authenticating the calling device.  It
   * contains the Widevine keybox token that was installed on the device at the
   * factory.  This field or encrypted_client_id below is required for a valid
   * license request, but both should never be present in the same request.
   */
  clientId: ClientIdentification | undefined;
  contentId: LicenseRequest_ContentIdentification | undefined;
  type: LicenseRequest_RequestType;
  /** Time of the request in seconds (UTC) as set by the client. */
  requestTime: Long;
  /** Old-style decimal-encoded string key control nonce. */
  keyControlNonceDeprecated: Buffer;
  protocolVersion: ProtocolVersion;
  /**
   * New-style uint32 key control nonce, please use instead of
   * key_control_nonce_deprecated.
   */
  keyControlNonce: number;
  /** Encrypted ClientIdentification message, used for privacy purposes. */
  encryptedClientId: EncryptedClientIdentification | undefined;
}

export enum LicenseRequest_RequestType {
  NEW = 1,
  RENEWAL = 2,
  RELEASE = 3,
  UNRECOGNIZED = -1
}

export function licenseRequest_RequestTypeFromJSON(object: any): LicenseRequest_RequestType {
  switch (object) {
  case 1:
  case 'NEW':
    return LicenseRequest_RequestType.NEW;
  case 2:
  case 'RENEWAL':
    return LicenseRequest_RequestType.RENEWAL;
  case 3:
  case 'RELEASE':
    return LicenseRequest_RequestType.RELEASE;
  case -1:
  case 'UNRECOGNIZED':
  default:
    return LicenseRequest_RequestType.UNRECOGNIZED;
  }
}

export function licenseRequest_RequestTypeToJSON(object: LicenseRequest_RequestType): string {
  switch (object) {
  case LicenseRequest_RequestType.NEW:
    return 'NEW';
  case LicenseRequest_RequestType.RENEWAL:
    return 'RENEWAL';
  case LicenseRequest_RequestType.RELEASE:
    return 'RELEASE';
  case LicenseRequest_RequestType.UNRECOGNIZED:
  default:
    return 'UNRECOGNIZED';
  }
}

export interface LicenseRequest_ContentIdentification {
  /** Exactly one of these must be present. */
  widevinePsshData?: LicenseRequest_ContentIdentification_WidevinePsshData | undefined;
  webmKeyId?: LicenseRequest_ContentIdentification_WebmKeyId | undefined;
  existingLicense?: LicenseRequest_ContentIdentification_ExistingLicense | undefined;
  initData?: LicenseRequest_ContentIdentification_InitData | undefined;
}

export interface LicenseRequest_ContentIdentification_WidevinePsshData {
  psshData: Buffer[];
  licenseType: LicenseType;
  /** Opaque, client-specified. */
  requestId: Buffer;
}

export interface LicenseRequest_ContentIdentification_WebmKeyId {
  header: Buffer;
  licenseType: LicenseType;
  /** Opaque, client-specified. */
  requestId: Buffer;
}

export interface LicenseRequest_ContentIdentification_ExistingLicense {
  licenseId: LicenseIdentification | undefined;
  secondsSinceStarted: Long;
  secondsSinceLastPlayed: Long;
  sessionUsageTableEntry: Buffer;
}

export interface LicenseRequest_ContentIdentification_InitData {
  initDataType: LicenseRequest_ContentIdentification_InitData_InitDataType;
  initData: Buffer;
  licenseType: LicenseType;
  requestId: Buffer;
}

export enum LicenseRequest_ContentIdentification_InitData_InitDataType {
  CENC = 1,
  WEBM = 2,
  UNRECOGNIZED = -1
}

export function licenseRequest_ContentIdentification_InitData_InitDataTypeFromJSON(
  object: any
): LicenseRequest_ContentIdentification_InitData_InitDataType {
  switch (object) {
  case 1:
  case 'CENC':
    return LicenseRequest_ContentIdentification_InitData_InitDataType.CENC;
  case 2:
  case 'WEBM':
    return LicenseRequest_ContentIdentification_InitData_InitDataType.WEBM;
  case -1:
  case 'UNRECOGNIZED':
  default:
    return LicenseRequest_ContentIdentification_InitData_InitDataType.UNRECOGNIZED;
  }
}

export function licenseRequest_ContentIdentification_InitData_InitDataTypeToJSON(
  object: LicenseRequest_ContentIdentification_InitData_InitDataType
): string {
  switch (object) {
  case LicenseRequest_ContentIdentification_InitData_InitDataType.CENC:
    return 'CENC';
  case LicenseRequest_ContentIdentification_InitData_InitDataType.WEBM:
    return 'WEBM';
  case LicenseRequest_ContentIdentification_InitData_InitDataType.UNRECOGNIZED:
  default:
    return 'UNRECOGNIZED';
  }
}

export interface MetricData {
  /** 'stage' that is currently processing the SignedMessage.  Required. */
  stageName: string;
  /** metric and associated value. */
  metricData: MetricData_TypeValue[];
}

export enum MetricData_MetricType {
  /** LATENCY - The time spent in the 'stage', specified in microseconds. */
  LATENCY = 1,
  /**
   * TIMESTAMP - The UNIX epoch timestamp at which the 'stage' was first accessed in
   * microseconds.
   */
  TIMESTAMP = 2,
  UNRECOGNIZED = -1
}

export function metricData_MetricTypeFromJSON(object: any): MetricData_MetricType {
  switch (object) {
  case 1:
  case 'LATENCY':
    return MetricData_MetricType.LATENCY;
  case 2:
  case 'TIMESTAMP':
    return MetricData_MetricType.TIMESTAMP;
  case -1:
  case 'UNRECOGNIZED':
  default:
    return MetricData_MetricType.UNRECOGNIZED;
  }
}

export function metricData_MetricTypeToJSON(object: MetricData_MetricType): string {
  switch (object) {
  case MetricData_MetricType.LATENCY:
    return 'LATENCY';
  case MetricData_MetricType.TIMESTAMP:
    return 'TIMESTAMP';
  case MetricData_MetricType.UNRECOGNIZED:
  default:
    return 'UNRECOGNIZED';
  }
}

export interface MetricData_TypeValue {
  type: MetricData_MetricType;
  /**
   * The value associated with 'type'.  For example if type == LATENCY, the
   * value would be the time in microseconds spent in this 'stage'.
   */
  value: Long;
}

export interface VersionInfo {
  /**
   * License SDK version reported by the Widevine License SDK. This field
   * is populated automatically by the SDK.
   */
  licenseSdkVersion: string;
  /**
   * Version of the service hosting the license SDK. This field is optional.
   * It may be provided by the hosting service.
   */
  licenseServiceVersion: string;
}

export interface SignedMessage {
  type: SignedMessage_MessageType;
  msg: Buffer;
  /**
   * Required field that contains the signature of the bytes of msg.
   * For license requests, the signing algorithm is determined by the
   * certificate contained in the request.
   * For license responses, the signing algorithm is HMAC with signing key based
   * on |session_key|.
   */
  signature: Buffer;
  /**
   * If populated, the contents of this field will be signaled by the
   * |session_key_type| type. If the |session_key_type| is WRAPPED_AES_KEY the
   * key is the bytes of an encrypted AES key. If the |session_key_type| is
   * EPHERMERAL_ECC_PUBLIC_KEY the field contains the bytes of an RFC5208 ASN1
   * serialized ECC public key.
   */
  sessionKey: Buffer;
  /**
   * Remote attestation data which will be present in the initial license
   * request for ChromeOS client devices operating in verified mode. Remote
   * attestation challenge data is |msg| field above. Optional.
   */
  remoteAttestation: Buffer;
  metricData: MetricData[];
  /**
   * Version information from the SDK and license service. This information is
   * provided in the license response.
   */
  serviceVersionInfo: VersionInfo | undefined;
  /**
   * Optional field that contains the algorithm type used to generate the
   * session_key and signature in a LICENSE message.
   */
  sessionKeyType: SignedMessage_SessionKeyType;
  /**
   * The core message is the simple serialization of fields used by OEMCrypto.
   * This field was introduced in OEMCrypto API v16.
   */
  oemcryptoCoreMessage: Buffer;
}

export enum SignedMessage_MessageType {
  LICENSE_REQUEST = 1,
  LICENSE = 2,
  ERROR_RESPONSE = 3,
  SERVICE_CERTIFICATE_REQUEST = 4,
  SERVICE_CERTIFICATE = 5,
  SUB_LICENSE = 6,
  CAS_LICENSE_REQUEST = 7,
  CAS_LICENSE = 8,
  EXTERNAL_LICENSE_REQUEST = 9,
  EXTERNAL_LICENSE = 10,
  UNRECOGNIZED = -1
}

export function signedMessage_MessageTypeFromJSON(object: any): SignedMessage_MessageType {
  switch (object) {
  case 1:
  case 'LICENSE_REQUEST':
    return SignedMessage_MessageType.LICENSE_REQUEST;
  case 2:
  case 'LICENSE':
    return SignedMessage_MessageType.LICENSE;
  case 3:
  case 'ERROR_RESPONSE':
    return SignedMessage_MessageType.ERROR_RESPONSE;
  case 4:
  case 'SERVICE_CERTIFICATE_REQUEST':
    return SignedMessage_MessageType.SERVICE_CERTIFICATE_REQUEST;
  case 5:
  case 'SERVICE_CERTIFICATE':
    return SignedMessage_MessageType.SERVICE_CERTIFICATE;
  case 6:
  case 'SUB_LICENSE':
    return SignedMessage_MessageType.SUB_LICENSE;
  case 7:
  case 'CAS_LICENSE_REQUEST':
    return SignedMessage_MessageType.CAS_LICENSE_REQUEST;
  case 8:
  case 'CAS_LICENSE':
    return SignedMessage_MessageType.CAS_LICENSE;
  case 9:
  case 'EXTERNAL_LICENSE_REQUEST':
    return SignedMessage_MessageType.EXTERNAL_LICENSE_REQUEST;
  case 10:
  case 'EXTERNAL_LICENSE':
    return SignedMessage_MessageType.EXTERNAL_LICENSE;
  case -1:
  case 'UNRECOGNIZED':
  default:
    return SignedMessage_MessageType.UNRECOGNIZED;
  }
}

export function signedMessage_MessageTypeToJSON(object: SignedMessage_MessageType): string {
  switch (object) {
  case SignedMessage_MessageType.LICENSE_REQUEST:
    return 'LICENSE_REQUEST';
  case SignedMessage_MessageType.LICENSE:
    return 'LICENSE';
  case SignedMessage_MessageType.ERROR_RESPONSE:
    return 'ERROR_RESPONSE';
  case SignedMessage_MessageType.SERVICE_CERTIFICATE_REQUEST:
    return 'SERVICE_CERTIFICATE_REQUEST';
  case SignedMessage_MessageType.SERVICE_CERTIFICATE:
    return 'SERVICE_CERTIFICATE';
  case SignedMessage_MessageType.SUB_LICENSE:
    return 'SUB_LICENSE';
  case SignedMessage_MessageType.CAS_LICENSE_REQUEST:
    return 'CAS_LICENSE_REQUEST';
  case SignedMessage_MessageType.CAS_LICENSE:
    return 'CAS_LICENSE';
  case SignedMessage_MessageType.EXTERNAL_LICENSE_REQUEST:
    return 'EXTERNAL_LICENSE_REQUEST';
  case SignedMessage_MessageType.EXTERNAL_LICENSE:
    return 'EXTERNAL_LICENSE';
  case SignedMessage_MessageType.UNRECOGNIZED:
  default:
    return 'UNRECOGNIZED';
  }
}

export enum SignedMessage_SessionKeyType {
  UNDEFINED = 0,
  WRAPPED_AES_KEY = 1,
  EPHERMERAL_ECC_PUBLIC_KEY = 2,
  UNRECOGNIZED = -1
}

export function signedMessage_SessionKeyTypeFromJSON(object: any): SignedMessage_SessionKeyType {
  switch (object) {
  case 0:
  case 'UNDEFINED':
    return SignedMessage_SessionKeyType.UNDEFINED;
  case 1:
  case 'WRAPPED_AES_KEY':
    return SignedMessage_SessionKeyType.WRAPPED_AES_KEY;
  case 2:
  case 'EPHERMERAL_ECC_PUBLIC_KEY':
    return SignedMessage_SessionKeyType.EPHERMERAL_ECC_PUBLIC_KEY;
  case -1:
  case 'UNRECOGNIZED':
  default:
    return SignedMessage_SessionKeyType.UNRECOGNIZED;
  }
}

export function signedMessage_SessionKeyTypeToJSON(object: SignedMessage_SessionKeyType): string {
  switch (object) {
  case SignedMessage_SessionKeyType.UNDEFINED:
    return 'UNDEFINED';
  case SignedMessage_SessionKeyType.WRAPPED_AES_KEY:
    return 'WRAPPED_AES_KEY';
  case SignedMessage_SessionKeyType.EPHERMERAL_ECC_PUBLIC_KEY:
    return 'EPHERMERAL_ECC_PUBLIC_KEY';
  case SignedMessage_SessionKeyType.UNRECOGNIZED:
  default:
    return 'UNRECOGNIZED';
  }
}

/** ClientIdentification message used to authenticate the client device. */
export interface ClientIdentification {
  /** Type of factory-provisioned device root of trust. Optional. */
  type: ClientIdentification_TokenType;
  /** Factory-provisioned device root of trust. Required. */
  token: Buffer;
  /** Optional client information name/value pairs. */
  clientInfo: ClientIdentification_NameValue[];
  /** Client token generated by the content provider. Optional. */
  providerClientToken: Buffer;
  /**
   * Number of licenses received by the client to which the token above belongs.
   * Only present if client_token is specified.
   */
  licenseCounter: number;
  /** List of non-baseline client capabilities. */
  clientCapabilities: ClientIdentification_ClientCapabilities | undefined;
  /** Serialized VmpData message. Optional. */
  vmpData: Buffer;
  /** Optional field that may contain additional provisioning credentials. */
  deviceCredentials: ClientIdentification_ClientCredentials[];
}

export enum ClientIdentification_TokenType {
  KEYBOX = 0,
  DRM_DEVICE_CERTIFICATE = 1,
  REMOTE_ATTESTATION_CERTIFICATE = 2,
  OEM_DEVICE_CERTIFICATE = 3,
  UNRECOGNIZED = -1
}

export function clientIdentification_TokenTypeFromJSON(object: any): ClientIdentification_TokenType {
  switch (object) {
  case 0:
  case 'KEYBOX':
    return ClientIdentification_TokenType.KEYBOX;
  case 1:
  case 'DRM_DEVICE_CERTIFICATE':
    return ClientIdentification_TokenType.DRM_DEVICE_CERTIFICATE;
  case 2:
  case 'REMOTE_ATTESTATION_CERTIFICATE':
    return ClientIdentification_TokenType.REMOTE_ATTESTATION_CERTIFICATE;
  case 3:
  case 'OEM_DEVICE_CERTIFICATE':
    return ClientIdentification_TokenType.OEM_DEVICE_CERTIFICATE;
  case -1:
  case 'UNRECOGNIZED':
  default:
    return ClientIdentification_TokenType.UNRECOGNIZED;
  }
}

export function clientIdentification_TokenTypeToJSON(object: ClientIdentification_TokenType): string {
  switch (object) {
  case ClientIdentification_TokenType.KEYBOX:
    return 'KEYBOX';
  case ClientIdentification_TokenType.DRM_DEVICE_CERTIFICATE:
    return 'DRM_DEVICE_CERTIFICATE';
  case ClientIdentification_TokenType.REMOTE_ATTESTATION_CERTIFICATE:
    return 'REMOTE_ATTESTATION_CERTIFICATE';
  case ClientIdentification_TokenType.OEM_DEVICE_CERTIFICATE:
    return 'OEM_DEVICE_CERTIFICATE';
  case ClientIdentification_TokenType.UNRECOGNIZED:
  default:
    return 'UNRECOGNIZED';
  }
}

export interface ClientIdentification_NameValue {
  name: string;
  value: string;
}

/**
 * Capabilities which not all clients may support. Used for the license
 * exchange protocol only.
 */
export interface ClientIdentification_ClientCapabilities {
  clientToken: boolean;
  sessionToken: boolean;
  videoResolutionConstraints: boolean;
  maxHdcpVersion: ClientIdentification_ClientCapabilities_HdcpVersion;
  oemCryptoApiVersion: number;
  /**
   * Client has hardware support for protecting the usage table, such as
   * storing the generation number in secure memory.  For Details, see:
   * Widevine Modular DRM Security Integration Guide for CENC
   */
  antiRollbackUsageTable: boolean;
  /** The client shall report |srm_version| if available. */
  srmVersion: number;
  /**
   * A device may have SRM data, and report a version, but may not be capable
   * of updating SRM data.
   */
  canUpdateSrm: boolean;
  supportedCertificateKeyType: ClientIdentification_ClientCapabilities_CertificateKeyType[];
  analogOutputCapabilities: ClientIdentification_ClientCapabilities_AnalogOutputCapabilities;
  canDisableAnalogOutput: boolean;
  /**
   * Clients can indicate a performance level supported by OEMCrypto.
   * This will allow applications and providers to choose an appropriate
   * quality of content to serve. Currently defined tiers are
   * 1 (low), 2 (medium) and 3 (high). Any other value indicates that
   * the resource rating is unavailable or reporting erroneous values
   * for that device. For details see,
   * Widevine Modular DRM Security Integration Guide for CENC
   */
  resourceRatingTier: number;
}

export enum ClientIdentification_ClientCapabilities_HdcpVersion {
  HDCP_NONE = 0,
  HDCP_V1 = 1,
  HDCP_V2 = 2,
  HDCP_V2_1 = 3,
  HDCP_V2_2 = 4,
  HDCP_V2_3 = 5,
  HDCP_NO_DIGITAL_OUTPUT = 255,
  UNRECOGNIZED = -1
}

export function clientIdentification_ClientCapabilities_HdcpVersionFromJSON(object: any): ClientIdentification_ClientCapabilities_HdcpVersion {
  switch (object) {
  case 0:
  case 'HDCP_NONE':
    return ClientIdentification_ClientCapabilities_HdcpVersion.HDCP_NONE;
  case 1:
  case 'HDCP_V1':
    return ClientIdentification_ClientCapabilities_HdcpVersion.HDCP_V1;
  case 2:
  case 'HDCP_V2':
    return ClientIdentification_ClientCapabilities_HdcpVersion.HDCP_V2;
  case 3:
  case 'HDCP_V2_1':
    return ClientIdentification_ClientCapabilities_HdcpVersion.HDCP_V2_1;
  case 4:
  case 'HDCP_V2_2':
    return ClientIdentification_ClientCapabilities_HdcpVersion.HDCP_V2_2;
  case 5:
  case 'HDCP_V2_3':
    return ClientIdentification_ClientCapabilities_HdcpVersion.HDCP_V2_3;
  case 255:
  case 'HDCP_NO_DIGITAL_OUTPUT':
    return ClientIdentification_ClientCapabilities_HdcpVersion.HDCP_NO_DIGITAL_OUTPUT;
  case -1:
  case 'UNRECOGNIZED':
  default:
    return ClientIdentification_ClientCapabilities_HdcpVersion.UNRECOGNIZED;
  }
}

export function clientIdentification_ClientCapabilities_HdcpVersionToJSON(object: ClientIdentification_ClientCapabilities_HdcpVersion): string {
  switch (object) {
  case ClientIdentification_ClientCapabilities_HdcpVersion.HDCP_NONE:
    return 'HDCP_NONE';
  case ClientIdentification_ClientCapabilities_HdcpVersion.HDCP_V1:
    return 'HDCP_V1';
  case ClientIdentification_ClientCapabilities_HdcpVersion.HDCP_V2:
    return 'HDCP_V2';
  case ClientIdentification_ClientCapabilities_HdcpVersion.HDCP_V2_1:
    return 'HDCP_V2_1';
  case ClientIdentification_ClientCapabilities_HdcpVersion.HDCP_V2_2:
    return 'HDCP_V2_2';
  case ClientIdentification_ClientCapabilities_HdcpVersion.HDCP_V2_3:
    return 'HDCP_V2_3';
  case ClientIdentification_ClientCapabilities_HdcpVersion.HDCP_NO_DIGITAL_OUTPUT:
    return 'HDCP_NO_DIGITAL_OUTPUT';
  case ClientIdentification_ClientCapabilities_HdcpVersion.UNRECOGNIZED:
  default:
    return 'UNRECOGNIZED';
  }
}

export enum ClientIdentification_ClientCapabilities_CertificateKeyType {
  RSA_2048 = 0,
  RSA_3072 = 1,
  ECC_SECP256R1 = 2,
  ECC_SECP384R1 = 3,
  ECC_SECP521R1 = 4,
  UNRECOGNIZED = -1
}

export function clientIdentification_ClientCapabilities_CertificateKeyTypeFromJSON(
  object: any
): ClientIdentification_ClientCapabilities_CertificateKeyType {
  switch (object) {
  case 0:
  case 'RSA_2048':
    return ClientIdentification_ClientCapabilities_CertificateKeyType.RSA_2048;
  case 1:
  case 'RSA_3072':
    return ClientIdentification_ClientCapabilities_CertificateKeyType.RSA_3072;
  case 2:
  case 'ECC_SECP256R1':
    return ClientIdentification_ClientCapabilities_CertificateKeyType.ECC_SECP256R1;
  case 3:
  case 'ECC_SECP384R1':
    return ClientIdentification_ClientCapabilities_CertificateKeyType.ECC_SECP384R1;
  case 4:
  case 'ECC_SECP521R1':
    return ClientIdentification_ClientCapabilities_CertificateKeyType.ECC_SECP521R1;
  case -1:
  case 'UNRECOGNIZED':
  default:
    return ClientIdentification_ClientCapabilities_CertificateKeyType.UNRECOGNIZED;
  }
}

export function clientIdentification_ClientCapabilities_CertificateKeyTypeToJSON(
  object: ClientIdentification_ClientCapabilities_CertificateKeyType
): string {
  switch (object) {
  case ClientIdentification_ClientCapabilities_CertificateKeyType.RSA_2048:
    return 'RSA_2048';
  case ClientIdentification_ClientCapabilities_CertificateKeyType.RSA_3072:
    return 'RSA_3072';
  case ClientIdentification_ClientCapabilities_CertificateKeyType.ECC_SECP256R1:
    return 'ECC_SECP256R1';
  case ClientIdentification_ClientCapabilities_CertificateKeyType.ECC_SECP384R1:
    return 'ECC_SECP384R1';
  case ClientIdentification_ClientCapabilities_CertificateKeyType.ECC_SECP521R1:
    return 'ECC_SECP521R1';
  case ClientIdentification_ClientCapabilities_CertificateKeyType.UNRECOGNIZED:
  default:
    return 'UNRECOGNIZED';
  }
}

export enum ClientIdentification_ClientCapabilities_AnalogOutputCapabilities {
  ANALOG_OUTPUT_UNKNOWN = 0,
  ANALOG_OUTPUT_NONE = 1,
  ANALOG_OUTPUT_SUPPORTED = 2,
  ANALOG_OUTPUT_SUPPORTS_CGMS_A = 3,
  UNRECOGNIZED = -1
}

export function clientIdentification_ClientCapabilities_AnalogOutputCapabilitiesFromJSON(
  object: any
): ClientIdentification_ClientCapabilities_AnalogOutputCapabilities {
  switch (object) {
  case 0:
  case 'ANALOG_OUTPUT_UNKNOWN':
    return ClientIdentification_ClientCapabilities_AnalogOutputCapabilities.ANALOG_OUTPUT_UNKNOWN;
  case 1:
  case 'ANALOG_OUTPUT_NONE':
    return ClientIdentification_ClientCapabilities_AnalogOutputCapabilities.ANALOG_OUTPUT_NONE;
  case 2:
  case 'ANALOG_OUTPUT_SUPPORTED':
    return ClientIdentification_ClientCapabilities_AnalogOutputCapabilities.ANALOG_OUTPUT_SUPPORTED;
  case 3:
  case 'ANALOG_OUTPUT_SUPPORTS_CGMS_A':
    return ClientIdentification_ClientCapabilities_AnalogOutputCapabilities.ANALOG_OUTPUT_SUPPORTS_CGMS_A;
  case -1:
  case 'UNRECOGNIZED':
  default:
    return ClientIdentification_ClientCapabilities_AnalogOutputCapabilities.UNRECOGNIZED;
  }
}

export function clientIdentification_ClientCapabilities_AnalogOutputCapabilitiesToJSON(
  object: ClientIdentification_ClientCapabilities_AnalogOutputCapabilities
): string {
  switch (object) {
  case ClientIdentification_ClientCapabilities_AnalogOutputCapabilities.ANALOG_OUTPUT_UNKNOWN:
    return 'ANALOG_OUTPUT_UNKNOWN';
  case ClientIdentification_ClientCapabilities_AnalogOutputCapabilities.ANALOG_OUTPUT_NONE:
    return 'ANALOG_OUTPUT_NONE';
  case ClientIdentification_ClientCapabilities_AnalogOutputCapabilities.ANALOG_OUTPUT_SUPPORTED:
    return 'ANALOG_OUTPUT_SUPPORTED';
  case ClientIdentification_ClientCapabilities_AnalogOutputCapabilities.ANALOG_OUTPUT_SUPPORTS_CGMS_A:
    return 'ANALOG_OUTPUT_SUPPORTS_CGMS_A';
  case ClientIdentification_ClientCapabilities_AnalogOutputCapabilities.UNRECOGNIZED:
  default:
    return 'UNRECOGNIZED';
  }
}

export interface ClientIdentification_ClientCredentials {
  type: ClientIdentification_TokenType;
  token: Buffer;
}

/**
 * EncryptedClientIdentification message used to hold ClientIdentification
 * messages encrypted for privacy purposes.
 */
export interface EncryptedClientIdentification {
  /**
   * Provider ID for which the ClientIdentifcation is encrypted (owner of
   * service certificate).
   */
  providerId: string;
  /**
   * Serial number for the service certificate for which ClientIdentification is
   * encrypted.
   */
  serviceCertificateSerialNumber: Buffer;
  /**
   * Serialized ClientIdentification message, encrypted with the privacy key
   * using AES-128-CBC with PKCS#5 padding.
   */
  encryptedClientId: Buffer;
  /** Initialization vector needed to decrypt encrypted_client_id. */
  encryptedClientIdIv: Buffer;
  /** AES-128 privacy key, encrypted with the service public key using RSA-OAEP. */
  encryptedPrivacyKey: Buffer;
}

/**
 * DRM certificate definition for user devices, intermediate, service, and root
 * certificates.
 */
export interface DrmCertificate {
  /** Type of certificate. Required. */
  type: DrmCertificate_Type;
  /**
   * 128-bit globally unique serial number of certificate.
   * Value is 0 for root certificate. Required.
   */
  serialNumber: Buffer;
  /** POSIX time, in seconds, when the certificate was created. Required. */
  creationTimeSeconds: number;
  /**
   * POSIX time, in seconds, when the certificate should expire. Value of zero
   * denotes indefinite expiry time. For more information on limited lifespan
   * DRM certificates see (go/limited-lifespan-drm-certificates).
   */
  expirationTimeSeconds: number;
  /** Device public key. PKCS#1 ASN.1 DER-encoded. Required. */
  publicKey: Buffer;
  /**
   * Widevine system ID for the device. Required for intermediate and
   * user device certificates.
   */
  systemId: number;
  /**
   * Deprecated field, which used to indicate whether the device was a test
   * (non-production) device. The test_device field in ProvisionedDeviceInfo
   * below should be observed instead.
   *
   * @deprecated
   */
  testDeviceDeprecated: boolean;
  /**
   * Service identifier (web origin) for the provider which owns the
   * certificate. Required for service and provisioner certificates.
   */
  providerId: string;
  /**
   * This field is used only when type = SERVICE to specify which SDK uses
   * service certificate. This repeated field is treated as a set. A certificate
   * may be used for the specified service SDK if the appropriate ServiceType
   * is specified in this field.
   */
  serviceTypes: DrmCertificate_ServiceType[];
  /**
   * Required. The algorithm field contains the curve used to create the
   * |public_key| if algorithm is one of the ECC types.
   * The |algorithm| is used for both to determine the if the certificate is ECC
   * or RSA. The |algorithm| also specifies the parameters that were used to
   * create |public_key| and are used to create an ephemeral session key.
   */
  algorithm: DrmCertificate_Algorithm;
  /**
   * Optional. May be present in DEVICE certificate types. This is the root
   * of trust identifier that holds an encrypted value that identifies the
   * keybox or other root of trust that was used to provision a DEVICE drm
   * certificate.
   */
  rotId: Buffer;
  /**
   * Optional. May be present in devices that explicitly support dual keys. When
   * present the |public_key| is used for verification of received license
   * request messages.
   */
  encryptionKey: DrmCertificate_EncryptionKey | undefined;
}

export enum DrmCertificate_Type {
  /** ROOT - ProtoBestPractices: ignore. */
  ROOT = 0,
  DEVICE_MODEL = 1,
  DEVICE = 2,
  SERVICE = 3,
  PROVISIONER = 4,
  UNRECOGNIZED = -1
}

export function drmCertificate_TypeFromJSON(object: any): DrmCertificate_Type {
  switch (object) {
  case 0:
  case 'ROOT':
    return DrmCertificate_Type.ROOT;
  case 1:
  case 'DEVICE_MODEL':
    return DrmCertificate_Type.DEVICE_MODEL;
  case 2:
  case 'DEVICE':
    return DrmCertificate_Type.DEVICE;
  case 3:
  case 'SERVICE':
    return DrmCertificate_Type.SERVICE;
  case 4:
  case 'PROVISIONER':
    return DrmCertificate_Type.PROVISIONER;
  case -1:
  case 'UNRECOGNIZED':
  default:
    return DrmCertificate_Type.UNRECOGNIZED;
  }
}

export function drmCertificate_TypeToJSON(object: DrmCertificate_Type): string {
  switch (object) {
  case DrmCertificate_Type.ROOT:
    return 'ROOT';
  case DrmCertificate_Type.DEVICE_MODEL:
    return 'DEVICE_MODEL';
  case DrmCertificate_Type.DEVICE:
    return 'DEVICE';
  case DrmCertificate_Type.SERVICE:
    return 'SERVICE';
  case DrmCertificate_Type.PROVISIONER:
    return 'PROVISIONER';
  case DrmCertificate_Type.UNRECOGNIZED:
  default:
    return 'UNRECOGNIZED';
  }
}

export enum DrmCertificate_ServiceType {
  UNKNOWN_SERVICE_TYPE = 0,
  LICENSE_SERVER_SDK = 1,
  LICENSE_SERVER_PROXY_SDK = 2,
  PROVISIONING_SDK = 3,
  CAS_PROXY_SDK = 4,
  UNRECOGNIZED = -1
}

export function drmCertificate_ServiceTypeFromJSON(object: any): DrmCertificate_ServiceType {
  switch (object) {
  case 0:
  case 'UNKNOWN_SERVICE_TYPE':
    return DrmCertificate_ServiceType.UNKNOWN_SERVICE_TYPE;
  case 1:
  case 'LICENSE_SERVER_SDK':
    return DrmCertificate_ServiceType.LICENSE_SERVER_SDK;
  case 2:
  case 'LICENSE_SERVER_PROXY_SDK':
    return DrmCertificate_ServiceType.LICENSE_SERVER_PROXY_SDK;
  case 3:
  case 'PROVISIONING_SDK':
    return DrmCertificate_ServiceType.PROVISIONING_SDK;
  case 4:
  case 'CAS_PROXY_SDK':
    return DrmCertificate_ServiceType.CAS_PROXY_SDK;
  case -1:
  case 'UNRECOGNIZED':
  default:
    return DrmCertificate_ServiceType.UNRECOGNIZED;
  }
}

export function drmCertificate_ServiceTypeToJSON(object: DrmCertificate_ServiceType): string {
  switch (object) {
  case DrmCertificate_ServiceType.UNKNOWN_SERVICE_TYPE:
    return 'UNKNOWN_SERVICE_TYPE';
  case DrmCertificate_ServiceType.LICENSE_SERVER_SDK:
    return 'LICENSE_SERVER_SDK';
  case DrmCertificate_ServiceType.LICENSE_SERVER_PROXY_SDK:
    return 'LICENSE_SERVER_PROXY_SDK';
  case DrmCertificate_ServiceType.PROVISIONING_SDK:
    return 'PROVISIONING_SDK';
  case DrmCertificate_ServiceType.CAS_PROXY_SDK:
    return 'CAS_PROXY_SDK';
  case DrmCertificate_ServiceType.UNRECOGNIZED:
  default:
    return 'UNRECOGNIZED';
  }
}

export enum DrmCertificate_Algorithm {
  UNKNOWN_ALGORITHM = 0,
  RSA = 1,
  ECC_SECP256R1 = 2,
  ECC_SECP384R1 = 3,
  ECC_SECP521R1 = 4,
  UNRECOGNIZED = -1
}

export function drmCertificate_AlgorithmFromJSON(object: any): DrmCertificate_Algorithm {
  switch (object) {
  case 0:
  case 'UNKNOWN_ALGORITHM':
    return DrmCertificate_Algorithm.UNKNOWN_ALGORITHM;
  case 1:
  case 'RSA':
    return DrmCertificate_Algorithm.RSA;
  case 2:
  case 'ECC_SECP256R1':
    return DrmCertificate_Algorithm.ECC_SECP256R1;
  case 3:
  case 'ECC_SECP384R1':
    return DrmCertificate_Algorithm.ECC_SECP384R1;
  case 4:
  case 'ECC_SECP521R1':
    return DrmCertificate_Algorithm.ECC_SECP521R1;
  case -1:
  case 'UNRECOGNIZED':
  default:
    return DrmCertificate_Algorithm.UNRECOGNIZED;
  }
}

export function drmCertificate_AlgorithmToJSON(object: DrmCertificate_Algorithm): string {
  switch (object) {
  case DrmCertificate_Algorithm.UNKNOWN_ALGORITHM:
    return 'UNKNOWN_ALGORITHM';
  case DrmCertificate_Algorithm.RSA:
    return 'RSA';
  case DrmCertificate_Algorithm.ECC_SECP256R1:
    return 'ECC_SECP256R1';
  case DrmCertificate_Algorithm.ECC_SECP384R1:
    return 'ECC_SECP384R1';
  case DrmCertificate_Algorithm.ECC_SECP521R1:
    return 'ECC_SECP521R1';
  case DrmCertificate_Algorithm.UNRECOGNIZED:
  default:
    return 'UNRECOGNIZED';
  }
}

export interface DrmCertificate_EncryptionKey {
  /** Device public key. PKCS#1 ASN.1 DER-encoded. Required. */
  publicKey: Buffer;
  /**
   * Required. The algorithm field contains the curve used to create the
   * |public_key| if algorithm is one of the ECC types.
   * The |algorithm| is used for both to determine the if the certificate is
   * ECC or RSA. The |algorithm| also specifies the parameters that were used
   * to create |public_key| and are used to create an ephemeral session key.
   */
  algorithm: DrmCertificate_Algorithm;
}

/** DrmCertificate signed by a higher (CA) DRM certificate. */
export interface SignedDrmCertificate {
  /** Serialized certificate. Required. */
  drmCertificate: Buffer;
  /**
   * Signature of certificate. Signed with root or intermediate
   * certificate specified below. Required.
   */
  signature: Buffer;
  /** SignedDrmCertificate used to sign this certificate. */
  signer: SignedDrmCertificate | undefined;
  /** Optional field that indicates the hash algorithm used in signature scheme. */
  hashAlgorithm: HashAlgorithmProto;
}

export interface WidevinePsshData {
  /**
   * Entitlement or content key IDs. Can onnly present in SINGLE or ENTITLEMENT
   * PSSHs. May be repeated to facilitate delivery of multiple keys in a
   * single license. Cannot be used in conjunction with content_id or
   * group_ids, which are the preferred mechanism.
   */
  keyIds: Buffer[];
  /**
   * Content identifier which may map to multiple entitlement or content key
   * IDs to facilitate the delivery of multiple keys in a single license.
   * Cannot be present in conjunction with key_ids, but if used must be in all
   * PSSHs.
   */
  contentId: Buffer;
  /**
   * Crypto period index, for media using key rotation. Always corresponds to
   * The content key period. This means that if using entitlement licensing
   * the ENTITLED_KEY PSSHs will have sequential crypto_period_index's, whereas
   * the ENTITELEMENT PSSHs will have gaps in the sequence. Required if doing
   * key rotation.
   */
  cryptoPeriodIndex: number;
  /**
   * Protection scheme identifying the encryption algorithm. The protection
   * scheme is represented as a uint32 value. The uint32 contains 4 bytes each
   * representing a single ascii character in one of the 4CC protection scheme
   * values. To be deprecated in favor of signaling from content.
   * 'cenc' (AES-CTR) protection_scheme = 0x63656E63,
   * 'cbc1' (AES-CBC) protection_scheme = 0x63626331,
   * 'cens' (AES-CTR pattern encryption) protection_scheme = 0x63656E73,
   * 'cbcs' (AES-CBC pattern encryption) protection_scheme = 0x63626373.
   */
  protectionScheme: number;
  /**
   * Optional. For media using key rotation, this represents the duration
   * of each crypto period in seconds.
   */
  cryptoPeriodSeconds: number;
  /** Type of PSSH. Required if not SINGLE. */
  type: WidevinePsshData_Type;
  /** Key sequence for Widevine-managed keys. Optional. */
  keySequence: number;
  /**
   * Group identifiers for all groups to which the content belongs. This can
   * be used to deliver licenses to unlock multiple titles / channels.
   * Optional, and may only be present in ENTITLEMENT and ENTITLED_KEY PSSHs, and
   * not in conjunction with key_ids.
   */
  groupIds: Buffer[];
  /**
   * Copy/copies of the content key used to decrypt the media stream in which
   * the PSSH box is embedded, each wrapped with a different entitlement key.
   * May also contain sub-licenses to support devices with OEMCrypto 13 or
   * older. May be repeated if using group entitlement keys. Present only in
   * PSSHs of type ENTITLED_KEY.
   */
  entitledKeys: WidevinePsshData_EntitledKey[];
  /**
   * Video feature identifier, which is used in conjunction with |content_id|
   * to determine the set of keys to be returned in the license. Cannot be
   * present in conjunction with |key_ids|.
   * Current values are "HDR".
   */
  videoFeature: string;
  /** @deprecated */
  algorithm: WidevinePsshData_Algorithm;
  /**
   * Content provider name.
   *
   * @deprecated
   */
  provider: string;
  /**
   * Track type. Acceptable values are SD, HD and AUDIO. Used to
   * differentiate content keys used by an asset.
   *
   * @deprecated
   */
  trackType: string;
  /**
   * The name of a registered policy to be used for this asset.
   *
   * @deprecated
   */
  policy: string;
  /**
   * Optional protected context for group content. The grouped_license is a
   * serialized SignedMessage.
   *
   * @deprecated
   */
  groupedLicense: Buffer;
}

export enum WidevinePsshData_Type {
  /** SINGLE - Single PSSH to be used to retrieve content keys. */
  SINGLE = 0,
  /** ENTITLEMENT - Primary PSSH used to retrieve entitlement keys. */
  ENTITLEMENT = 1,
  /** ENTITLED_KEY - Secondary PSSH containing entitled key(s). */
  ENTITLED_KEY = 2,
  UNRECOGNIZED = -1
}

export function widevinePsshData_TypeFromJSON(object: any): WidevinePsshData_Type {
  switch (object) {
  case 0:
  case 'SINGLE':
    return WidevinePsshData_Type.SINGLE;
  case 1:
  case 'ENTITLEMENT':
    return WidevinePsshData_Type.ENTITLEMENT;
  case 2:
  case 'ENTITLED_KEY':
    return WidevinePsshData_Type.ENTITLED_KEY;
  case -1:
  case 'UNRECOGNIZED':
  default:
    return WidevinePsshData_Type.UNRECOGNIZED;
  }
}

export function widevinePsshData_TypeToJSON(object: WidevinePsshData_Type): string {
  switch (object) {
  case WidevinePsshData_Type.SINGLE:
    return 'SINGLE';
  case WidevinePsshData_Type.ENTITLEMENT:
    return 'ENTITLEMENT';
  case WidevinePsshData_Type.ENTITLED_KEY:
    return 'ENTITLED_KEY';
  case WidevinePsshData_Type.UNRECOGNIZED:
  default:
    return 'UNRECOGNIZED';
  }
}

/** //////////////////////////  Deprecated Fields  //////////////////////////// */
export enum WidevinePsshData_Algorithm {
  UNENCRYPTED = 0,
  AESCTR = 1,
  UNRECOGNIZED = -1
}

export function widevinePsshData_AlgorithmFromJSON(object: any): WidevinePsshData_Algorithm {
  switch (object) {
  case 0:
  case 'UNENCRYPTED':
    return WidevinePsshData_Algorithm.UNENCRYPTED;
  case 1:
  case 'AESCTR':
    return WidevinePsshData_Algorithm.AESCTR;
  case -1:
  case 'UNRECOGNIZED':
  default:
    return WidevinePsshData_Algorithm.UNRECOGNIZED;
  }
}

export function widevinePsshData_AlgorithmToJSON(object: WidevinePsshData_Algorithm): string {
  switch (object) {
  case WidevinePsshData_Algorithm.UNENCRYPTED:
    return 'UNENCRYPTED';
  case WidevinePsshData_Algorithm.AESCTR:
    return 'AESCTR';
  case WidevinePsshData_Algorithm.UNRECOGNIZED:
  default:
    return 'UNRECOGNIZED';
  }
}

export interface WidevinePsshData_EntitledKey {
  /** ID of entitlement key used for wrapping |key|. */
  entitlementKeyId: Buffer;
  /** ID of the entitled key. */
  keyId: Buffer;
  /** Wrapped key. Required. */
  key: Buffer;
  /** IV used for wrapping |key|. Required. */
  iv: Buffer;
  /** Size of entitlement key used for wrapping |key|. */
  entitlementKeySizeBytes: number;
}

/** File Hashes for Verified Media Path (VMP) support. */
export interface FileHashes {
  signer: Buffer;
  signatures: FileHashes_Signature[];
}

export interface FileHashes_Signature {
  filename: string;
  /** 0 - release, 1 - testing */
  testSigning: boolean;
  SHA512Hash: Buffer;
  /** 0 for dlls, 1 for exe, this is field 3 in file */
  mainExe: boolean;
  signature: Buffer;
}

function createBaseLicenseIdentification(): LicenseIdentification {
  return {
    requestId: Buffer.alloc(0),
    sessionId: Buffer.alloc(0),
    purchaseId: Buffer.alloc(0),
    type: 1,
    version: 0,
    providerSessionToken: Buffer.alloc(0)
  };
}

export const LicenseIdentification = {
  encode(message: LicenseIdentification, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.requestId.length !== 0) {
      writer.uint32(10).bytes(message.requestId);
    }
    if (message.sessionId.length !== 0) {
      writer.uint32(18).bytes(message.sessionId);
    }
    if (message.purchaseId.length !== 0) {
      writer.uint32(26).bytes(message.purchaseId);
    }
    if (message.type !== 1) {
      writer.uint32(32).int32(message.type);
    }
    if (message.version !== 0) {
      writer.uint32(40).int32(message.version);
    }
    if (message.providerSessionToken.length !== 0) {
      writer.uint32(50).bytes(message.providerSessionToken);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): LicenseIdentification {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    const end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLicenseIdentification();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      case 1:
        message.requestId = reader.bytes() as Buffer;
        break;
      case 2:
        message.sessionId = reader.bytes() as Buffer;
        break;
      case 3:
        message.purchaseId = reader.bytes() as Buffer;
        break;
      case 4:
        message.type = reader.int32() as any;
        break;
      case 5:
        message.version = reader.int32();
        break;
      case 6:
        message.providerSessionToken = reader.bytes() as Buffer;
        break;
      default:
        reader.skipType(tag & 7);
        break;
      }
    }
    return message;
  },

  fromJSON(object: any): LicenseIdentification {
    return {
      requestId: isSet(object.requestId) ? Buffer.from(bytesFromBase64(object.requestId)) : Buffer.alloc(0),
      sessionId: isSet(object.sessionId) ? Buffer.from(bytesFromBase64(object.sessionId)) : Buffer.alloc(0),
      purchaseId: isSet(object.purchaseId) ? Buffer.from(bytesFromBase64(object.purchaseId)) : Buffer.alloc(0),
      type: isSet(object.type) ? licenseTypeFromJSON(object.type) : 1,
      version: isSet(object.version) ? Number(object.version) : 0,
      providerSessionToken: isSet(object.providerSessionToken) ? Buffer.from(bytesFromBase64(object.providerSessionToken)) : Buffer.alloc(0)
    };
  },

  toJSON(message: LicenseIdentification): unknown {
    const obj: any = {};
    message.requestId !== undefined && (obj.requestId = base64FromBytes(message.requestId !== undefined ? message.requestId : Buffer.alloc(0)));
    message.sessionId !== undefined && (obj.sessionId = base64FromBytes(message.sessionId !== undefined ? message.sessionId : Buffer.alloc(0)));
    message.purchaseId !== undefined && (obj.purchaseId = base64FromBytes(message.purchaseId !== undefined ? message.purchaseId : Buffer.alloc(0)));
    message.type !== undefined && (obj.type = licenseTypeToJSON(message.type));
    message.version !== undefined && (obj.version = Math.round(message.version));
    message.providerSessionToken !== undefined &&
      (obj.providerSessionToken = base64FromBytes(message.providerSessionToken !== undefined ? message.providerSessionToken : Buffer.alloc(0)));
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<LicenseIdentification>, I>>(object: I): LicenseIdentification {
    const message = createBaseLicenseIdentification();
    message.requestId = object.requestId ?? Buffer.alloc(0);
    message.sessionId = object.sessionId ?? Buffer.alloc(0);
    message.purchaseId = object.purchaseId ?? Buffer.alloc(0);
    message.type = object.type ?? 1;
    message.version = object.version ?? 0;
    message.providerSessionToken = object.providerSessionToken ?? Buffer.alloc(0);
    return message;
  }
};

function createBaseLicense(): License {
  return {
    id: undefined,
    policy: undefined,
    key: [],
    licenseStartTime: Long.ZERO,
    remoteAttestationVerified: false,
    providerClientToken: Buffer.alloc(0),
    protectionScheme: 0,
    srmRequirement: Buffer.alloc(0),
    srmUpdate: Buffer.alloc(0),
    platformVerificationStatus: 0,
    groupIds: []
  };
}

export const License = {
  encode(message: License, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.id !== undefined) {
      LicenseIdentification.encode(message.id, writer.uint32(10).fork()).ldelim();
    }
    if (message.policy !== undefined) {
      License_Policy.encode(message.policy, writer.uint32(18).fork()).ldelim();
    }
    for (const v of message.key) {
      License_KeyContainer.encode(v!, writer.uint32(26).fork()).ldelim();
    }
    if (!message.licenseStartTime.isZero()) {
      writer.uint32(32).int64(message.licenseStartTime);
    }
    if (message.remoteAttestationVerified === true) {
      writer.uint32(40).bool(message.remoteAttestationVerified);
    }
    if (message.providerClientToken.length !== 0) {
      writer.uint32(50).bytes(message.providerClientToken);
    }
    if (message.protectionScheme !== 0) {
      writer.uint32(56).uint32(message.protectionScheme);
    }
    if (message.srmRequirement.length !== 0) {
      writer.uint32(66).bytes(message.srmRequirement);
    }
    if (message.srmUpdate.length !== 0) {
      writer.uint32(74).bytes(message.srmUpdate);
    }
    if (message.platformVerificationStatus !== 0) {
      writer.uint32(80).int32(message.platformVerificationStatus);
    }
    for (const v of message.groupIds) {
      writer.uint32(90).bytes(v!);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): License {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    const end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLicense();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      case 1:
        message.id = LicenseIdentification.decode(reader, reader.uint32());
        break;
      case 2:
        message.policy = License_Policy.decode(reader, reader.uint32());
        break;
      case 3:
        message.key.push(License_KeyContainer.decode(reader, reader.uint32()));
        break;
      case 4:
        message.licenseStartTime = reader.int64() as Long;
        break;
      case 5:
        message.remoteAttestationVerified = reader.bool();
        break;
      case 6:
        message.providerClientToken = reader.bytes() as Buffer;
        break;
      case 7:
        message.protectionScheme = reader.uint32();
        break;
      case 8:
        message.srmRequirement = reader.bytes() as Buffer;
        break;
      case 9:
        message.srmUpdate = reader.bytes() as Buffer;
        break;
      case 10:
        message.platformVerificationStatus = reader.int32() as any;
        break;
      case 11:
        message.groupIds.push(reader.bytes() as Buffer);
        break;
      default:
        reader.skipType(tag & 7);
        break;
      }
    }
    return message;
  },

  fromJSON(object: any): License {
    return {
      id: isSet(object.id) ? LicenseIdentification.fromJSON(object.id) : undefined,
      policy: isSet(object.policy) ? License_Policy.fromJSON(object.policy) : undefined,
      key: Array.isArray(object?.key) ? object.key.map((e: any) => License_KeyContainer.fromJSON(e)) : [],
      licenseStartTime: isSet(object.licenseStartTime) ? Long.fromValue(object.licenseStartTime) : Long.ZERO,
      remoteAttestationVerified: isSet(object.remoteAttestationVerified) ? Boolean(object.remoteAttestationVerified) : false,
      providerClientToken: isSet(object.providerClientToken) ? Buffer.from(bytesFromBase64(object.providerClientToken)) : Buffer.alloc(0),
      protectionScheme: isSet(object.protectionScheme) ? Number(object.protectionScheme) : 0,
      srmRequirement: isSet(object.srmRequirement) ? Buffer.from(bytesFromBase64(object.srmRequirement)) : Buffer.alloc(0),
      srmUpdate: isSet(object.srmUpdate) ? Buffer.from(bytesFromBase64(object.srmUpdate)) : Buffer.alloc(0),
      platformVerificationStatus: isSet(object.platformVerificationStatus)
        ? platformVerificationStatusFromJSON(object.platformVerificationStatus)
        : 0,
      groupIds: Array.isArray(object?.groupIds) ? object.groupIds.map((e: any) => Buffer.from(bytesFromBase64(e))) : []
    };
  },

  toJSON(message: License): unknown {
    const obj: any = {};
    message.id !== undefined && (obj.id = message.id ? LicenseIdentification.toJSON(message.id) : undefined);
    message.policy !== undefined && (obj.policy = message.policy ? License_Policy.toJSON(message.policy) : undefined);
    if (message.key) {
      obj.key = message.key.map((e) => (e ? License_KeyContainer.toJSON(e) : undefined));
    } else {
      obj.key = [];
    }
    message.licenseStartTime !== undefined && (obj.licenseStartTime = (message.licenseStartTime || Long.ZERO).toString());
    message.remoteAttestationVerified !== undefined && (obj.remoteAttestationVerified = message.remoteAttestationVerified);
    message.providerClientToken !== undefined &&
      (obj.providerClientToken = base64FromBytes(message.providerClientToken !== undefined ? message.providerClientToken : Buffer.alloc(0)));
    message.protectionScheme !== undefined && (obj.protectionScheme = Math.round(message.protectionScheme));
    message.srmRequirement !== undefined &&
      (obj.srmRequirement = base64FromBytes(message.srmRequirement !== undefined ? message.srmRequirement : Buffer.alloc(0)));
    message.srmUpdate !== undefined && (obj.srmUpdate = base64FromBytes(message.srmUpdate !== undefined ? message.srmUpdate : Buffer.alloc(0)));
    message.platformVerificationStatus !== undefined &&
      (obj.platformVerificationStatus = platformVerificationStatusToJSON(message.platformVerificationStatus));
    if (message.groupIds) {
      obj.groupIds = message.groupIds.map((e) => base64FromBytes(e !== undefined ? e : Buffer.alloc(0)));
    } else {
      obj.groupIds = [];
    }
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<License>, I>>(object: I): License {
    const message = createBaseLicense();
    message.id = object.id !== undefined && object.id !== null ? LicenseIdentification.fromPartial(object.id) : undefined;
    message.policy = object.policy !== undefined && object.policy !== null ? License_Policy.fromPartial(object.policy) : undefined;
    message.key = object.key?.map((e) => License_KeyContainer.fromPartial(e)) || [];
    message.licenseStartTime =
      object.licenseStartTime !== undefined && object.licenseStartTime !== null ? Long.fromValue(object.licenseStartTime) : Long.ZERO;
    message.remoteAttestationVerified = object.remoteAttestationVerified ?? false;
    message.providerClientToken = object.providerClientToken ?? Buffer.alloc(0);
    message.protectionScheme = object.protectionScheme ?? 0;
    message.srmRequirement = object.srmRequirement ?? Buffer.alloc(0);
    message.srmUpdate = object.srmUpdate ?? Buffer.alloc(0);
    message.platformVerificationStatus = object.platformVerificationStatus ?? 0;
    message.groupIds = object.groupIds?.map((e) => e) || [];
    return message;
  }
};

function createBaseLicense_Policy(): License_Policy {
  return {
    canPlay: false,
    canPersist: false,
    canRenew: false,
    rentalDurationSeconds: Long.ZERO,
    playbackDurationSeconds: Long.ZERO,
    licenseDurationSeconds: Long.ZERO,
    renewalRecoveryDurationSeconds: Long.ZERO,
    renewalServerUrl: '',
    renewalDelaySeconds: Long.ZERO,
    renewalRetryIntervalSeconds: Long.ZERO,
    renewWithUsage: false,
    alwaysIncludeClientId: false,
    playStartGracePeriodSeconds: Long.ZERO,
    softEnforcePlaybackDuration: false,
    softEnforceRentalDuration: false
  };
}

export const License_Policy = {
  encode(message: License_Policy, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.canPlay === true) {
      writer.uint32(8).bool(message.canPlay);
    }
    if (message.canPersist === true) {
      writer.uint32(16).bool(message.canPersist);
    }
    if (message.canRenew === true) {
      writer.uint32(24).bool(message.canRenew);
    }
    if (!message.rentalDurationSeconds.isZero()) {
      writer.uint32(32).int64(message.rentalDurationSeconds);
    }
    if (!message.playbackDurationSeconds.isZero()) {
      writer.uint32(40).int64(message.playbackDurationSeconds);
    }
    if (!message.licenseDurationSeconds.isZero()) {
      writer.uint32(48).int64(message.licenseDurationSeconds);
    }
    if (!message.renewalRecoveryDurationSeconds.isZero()) {
      writer.uint32(56).int64(message.renewalRecoveryDurationSeconds);
    }
    if (message.renewalServerUrl !== '') {
      writer.uint32(66).string(message.renewalServerUrl);
    }
    if (!message.renewalDelaySeconds.isZero()) {
      writer.uint32(72).int64(message.renewalDelaySeconds);
    }
    if (!message.renewalRetryIntervalSeconds.isZero()) {
      writer.uint32(80).int64(message.renewalRetryIntervalSeconds);
    }
    if (message.renewWithUsage === true) {
      writer.uint32(88).bool(message.renewWithUsage);
    }
    if (message.alwaysIncludeClientId === true) {
      writer.uint32(96).bool(message.alwaysIncludeClientId);
    }
    if (!message.playStartGracePeriodSeconds.isZero()) {
      writer.uint32(104).int64(message.playStartGracePeriodSeconds);
    }
    if (message.softEnforcePlaybackDuration === true) {
      writer.uint32(112).bool(message.softEnforcePlaybackDuration);
    }
    if (message.softEnforceRentalDuration === true) {
      writer.uint32(120).bool(message.softEnforceRentalDuration);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): License_Policy {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    const end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLicense_Policy();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      case 1:
        message.canPlay = reader.bool();
        break;
      case 2:
        message.canPersist = reader.bool();
        break;
      case 3:
        message.canRenew = reader.bool();
        break;
      case 4:
        message.rentalDurationSeconds = reader.int64() as Long;
        break;
      case 5:
        message.playbackDurationSeconds = reader.int64() as Long;
        break;
      case 6:
        message.licenseDurationSeconds = reader.int64() as Long;
        break;
      case 7:
        message.renewalRecoveryDurationSeconds = reader.int64() as Long;
        break;
      case 8:
        message.renewalServerUrl = reader.string();
        break;
      case 9:
        message.renewalDelaySeconds = reader.int64() as Long;
        break;
      case 10:
        message.renewalRetryIntervalSeconds = reader.int64() as Long;
        break;
      case 11:
        message.renewWithUsage = reader.bool();
        break;
      case 12:
        message.alwaysIncludeClientId = reader.bool();
        break;
      case 13:
        message.playStartGracePeriodSeconds = reader.int64() as Long;
        break;
      case 14:
        message.softEnforcePlaybackDuration = reader.bool();
        break;
      case 15:
        message.softEnforceRentalDuration = reader.bool();
        break;
      default:
        reader.skipType(tag & 7);
        break;
      }
    }
    return message;
  },

  fromJSON(object: any): License_Policy {
    return {
      canPlay: isSet(object.canPlay) ? Boolean(object.canPlay) : false,
      canPersist: isSet(object.canPersist) ? Boolean(object.canPersist) : false,
      canRenew: isSet(object.canRenew) ? Boolean(object.canRenew) : false,
      rentalDurationSeconds: isSet(object.rentalDurationSeconds) ? Long.fromValue(object.rentalDurationSeconds) : Long.ZERO,
      playbackDurationSeconds: isSet(object.playbackDurationSeconds) ? Long.fromValue(object.playbackDurationSeconds) : Long.ZERO,
      licenseDurationSeconds: isSet(object.licenseDurationSeconds) ? Long.fromValue(object.licenseDurationSeconds) : Long.ZERO,
      renewalRecoveryDurationSeconds: isSet(object.renewalRecoveryDurationSeconds)
        ? Long.fromValue(object.renewalRecoveryDurationSeconds)
        : Long.ZERO,
      renewalServerUrl: isSet(object.renewalServerUrl) ? String(object.renewalServerUrl) : '',
      renewalDelaySeconds: isSet(object.renewalDelaySeconds) ? Long.fromValue(object.renewalDelaySeconds) : Long.ZERO,
      renewalRetryIntervalSeconds: isSet(object.renewalRetryIntervalSeconds) ? Long.fromValue(object.renewalRetryIntervalSeconds) : Long.ZERO,
      renewWithUsage: isSet(object.renewWithUsage) ? Boolean(object.renewWithUsage) : false,
      alwaysIncludeClientId: isSet(object.alwaysIncludeClientId) ? Boolean(object.alwaysIncludeClientId) : false,
      playStartGracePeriodSeconds: isSet(object.playStartGracePeriodSeconds) ? Long.fromValue(object.playStartGracePeriodSeconds) : Long.ZERO,
      softEnforcePlaybackDuration: isSet(object.softEnforcePlaybackDuration) ? Boolean(object.softEnforcePlaybackDuration) : false,
      softEnforceRentalDuration: isSet(object.softEnforceRentalDuration) ? Boolean(object.softEnforceRentalDuration) : false
    };
  },

  toJSON(message: License_Policy): unknown {
    const obj: any = {};
    message.canPlay !== undefined && (obj.canPlay = message.canPlay);
    message.canPersist !== undefined && (obj.canPersist = message.canPersist);
    message.canRenew !== undefined && (obj.canRenew = message.canRenew);
    message.rentalDurationSeconds !== undefined && (obj.rentalDurationSeconds = (message.rentalDurationSeconds || Long.ZERO).toString());
    message.playbackDurationSeconds !== undefined && (obj.playbackDurationSeconds = (message.playbackDurationSeconds || Long.ZERO).toString());
    message.licenseDurationSeconds !== undefined && (obj.licenseDurationSeconds = (message.licenseDurationSeconds || Long.ZERO).toString());
    message.renewalRecoveryDurationSeconds !== undefined &&
      (obj.renewalRecoveryDurationSeconds = (message.renewalRecoveryDurationSeconds || Long.ZERO).toString());
    message.renewalServerUrl !== undefined && (obj.renewalServerUrl = message.renewalServerUrl);
    message.renewalDelaySeconds !== undefined && (obj.renewalDelaySeconds = (message.renewalDelaySeconds || Long.ZERO).toString());
    message.renewalRetryIntervalSeconds !== undefined &&
      (obj.renewalRetryIntervalSeconds = (message.renewalRetryIntervalSeconds || Long.ZERO).toString());
    message.renewWithUsage !== undefined && (obj.renewWithUsage = message.renewWithUsage);
    message.alwaysIncludeClientId !== undefined && (obj.alwaysIncludeClientId = message.alwaysIncludeClientId);
    message.playStartGracePeriodSeconds !== undefined &&
      (obj.playStartGracePeriodSeconds = (message.playStartGracePeriodSeconds || Long.ZERO).toString());
    message.softEnforcePlaybackDuration !== undefined && (obj.softEnforcePlaybackDuration = message.softEnforcePlaybackDuration);
    message.softEnforceRentalDuration !== undefined && (obj.softEnforceRentalDuration = message.softEnforceRentalDuration);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<License_Policy>, I>>(object: I): License_Policy {
    const message = createBaseLicense_Policy();
    message.canPlay = object.canPlay ?? false;
    message.canPersist = object.canPersist ?? false;
    message.canRenew = object.canRenew ?? false;
    message.rentalDurationSeconds =
      object.rentalDurationSeconds !== undefined && object.rentalDurationSeconds !== null ? Long.fromValue(object.rentalDurationSeconds) : Long.ZERO;
    message.playbackDurationSeconds =
      object.playbackDurationSeconds !== undefined && object.playbackDurationSeconds !== null
        ? Long.fromValue(object.playbackDurationSeconds)
        : Long.ZERO;
    message.licenseDurationSeconds =
      object.licenseDurationSeconds !== undefined && object.licenseDurationSeconds !== null
        ? Long.fromValue(object.licenseDurationSeconds)
        : Long.ZERO;
    message.renewalRecoveryDurationSeconds =
      object.renewalRecoveryDurationSeconds !== undefined && object.renewalRecoveryDurationSeconds !== null
        ? Long.fromValue(object.renewalRecoveryDurationSeconds)
        : Long.ZERO;
    message.renewalServerUrl = object.renewalServerUrl ?? '';
    message.renewalDelaySeconds =
      object.renewalDelaySeconds !== undefined && object.renewalDelaySeconds !== null ? Long.fromValue(object.renewalDelaySeconds) : Long.ZERO;
    message.renewalRetryIntervalSeconds =
      object.renewalRetryIntervalSeconds !== undefined && object.renewalRetryIntervalSeconds !== null
        ? Long.fromValue(object.renewalRetryIntervalSeconds)
        : Long.ZERO;
    message.renewWithUsage = object.renewWithUsage ?? false;
    message.alwaysIncludeClientId = object.alwaysIncludeClientId ?? false;
    message.playStartGracePeriodSeconds =
      object.playStartGracePeriodSeconds !== undefined && object.playStartGracePeriodSeconds !== null
        ? Long.fromValue(object.playStartGracePeriodSeconds)
        : Long.ZERO;
    message.softEnforcePlaybackDuration = object.softEnforcePlaybackDuration ?? false;
    message.softEnforceRentalDuration = object.softEnforceRentalDuration ?? false;
    return message;
  }
};

function createBaseLicense_KeyContainer(): License_KeyContainer {
  return {
    id: Buffer.alloc(0),
    iv: Buffer.alloc(0),
    key: Buffer.alloc(0),
    type: 1,
    level: 1,
    requiredProtection: undefined,
    requestedProtection: undefined,
    keyControl: undefined,
    operatorSessionKeyPermissions: undefined,
    videoResolutionConstraints: [],
    antiRollbackUsageTable: false,
    trackLabel: ''
  };
}

export const License_KeyContainer = {
  encode(message: License_KeyContainer, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.id.length !== 0) {
      writer.uint32(10).bytes(message.id);
    }
    if (message.iv.length !== 0) {
      writer.uint32(18).bytes(message.iv);
    }
    if (message.key.length !== 0) {
      writer.uint32(26).bytes(message.key);
    }
    if (message.type !== 1) {
      writer.uint32(32).int32(message.type);
    }
    if (message.level !== 1) {
      writer.uint32(40).int32(message.level);
    }
    if (message.requiredProtection !== undefined) {
      License_KeyContainer_OutputProtection.encode(message.requiredProtection, writer.uint32(50).fork()).ldelim();
    }
    if (message.requestedProtection !== undefined) {
      License_KeyContainer_OutputProtection.encode(message.requestedProtection, writer.uint32(58).fork()).ldelim();
    }
    if (message.keyControl !== undefined) {
      License_KeyContainer_KeyControl.encode(message.keyControl, writer.uint32(66).fork()).ldelim();
    }
    if (message.operatorSessionKeyPermissions !== undefined) {
      License_KeyContainer_OperatorSessionKeyPermissions.encode(message.operatorSessionKeyPermissions, writer.uint32(74).fork()).ldelim();
    }
    for (const v of message.videoResolutionConstraints) {
      License_KeyContainer_VideoResolutionConstraint.encode(v!, writer.uint32(82).fork()).ldelim();
    }
    if (message.antiRollbackUsageTable === true) {
      writer.uint32(88).bool(message.antiRollbackUsageTable);
    }
    if (message.trackLabel !== '') {
      writer.uint32(98).string(message.trackLabel);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): License_KeyContainer {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    const end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLicense_KeyContainer();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      case 1:
        message.id = reader.bytes() as Buffer;
        break;
      case 2:
        message.iv = reader.bytes() as Buffer;
        break;
      case 3:
        message.key = reader.bytes() as Buffer;
        break;
      case 4:
        message.type = reader.int32() as any;
        break;
      case 5:
        message.level = reader.int32() as any;
        break;
      case 6:
        message.requiredProtection = License_KeyContainer_OutputProtection.decode(reader, reader.uint32());
        break;
      case 7:
        message.requestedProtection = License_KeyContainer_OutputProtection.decode(reader, reader.uint32());
        break;
      case 8:
        message.keyControl = License_KeyContainer_KeyControl.decode(reader, reader.uint32());
        break;
      case 9:
        message.operatorSessionKeyPermissions = License_KeyContainer_OperatorSessionKeyPermissions.decode(reader, reader.uint32());
        break;
      case 10:
        message.videoResolutionConstraints.push(License_KeyContainer_VideoResolutionConstraint.decode(reader, reader.uint32()));
        break;
      case 11:
        message.antiRollbackUsageTable = reader.bool();
        break;
      case 12:
        message.trackLabel = reader.string();
        break;
      default:
        reader.skipType(tag & 7);
        break;
      }
    }
    return message;
  },

  fromJSON(object: any): License_KeyContainer {
    return {
      id: isSet(object.id) ? Buffer.from(bytesFromBase64(object.id)) : Buffer.alloc(0),
      iv: isSet(object.iv) ? Buffer.from(bytesFromBase64(object.iv)) : Buffer.alloc(0),
      key: isSet(object.key) ? Buffer.from(bytesFromBase64(object.key)) : Buffer.alloc(0),
      type: isSet(object.type) ? license_KeyContainer_KeyTypeFromJSON(object.type) : 1,
      level: isSet(object.level) ? license_KeyContainer_SecurityLevelFromJSON(object.level) : 1,
      requiredProtection: isSet(object.requiredProtection) ? License_KeyContainer_OutputProtection.fromJSON(object.requiredProtection) : undefined,
      requestedProtection: isSet(object.requestedProtection) ? License_KeyContainer_OutputProtection.fromJSON(object.requestedProtection) : undefined,
      keyControl: isSet(object.keyControl) ? License_KeyContainer_KeyControl.fromJSON(object.keyControl) : undefined,
      operatorSessionKeyPermissions: isSet(object.operatorSessionKeyPermissions)
        ? License_KeyContainer_OperatorSessionKeyPermissions.fromJSON(object.operatorSessionKeyPermissions)
        : undefined,
      videoResolutionConstraints: Array.isArray(object?.videoResolutionConstraints)
        ? object.videoResolutionConstraints.map((e: any) => License_KeyContainer_VideoResolutionConstraint.fromJSON(e))
        : [],
      antiRollbackUsageTable: isSet(object.antiRollbackUsageTable) ? Boolean(object.antiRollbackUsageTable) : false,
      trackLabel: isSet(object.trackLabel) ? String(object.trackLabel) : ''
    };
  },

  toJSON(message: License_KeyContainer): unknown {
    const obj: any = {};
    message.id !== undefined && (obj.id = base64FromBytes(message.id !== undefined ? message.id : Buffer.alloc(0)));
    message.iv !== undefined && (obj.iv = base64FromBytes(message.iv !== undefined ? message.iv : Buffer.alloc(0)));
    message.key !== undefined && (obj.key = base64FromBytes(message.key !== undefined ? message.key : Buffer.alloc(0)));
    message.type !== undefined && (obj.type = license_KeyContainer_KeyTypeToJSON(message.type));
    message.level !== undefined && (obj.level = license_KeyContainer_SecurityLevelToJSON(message.level));
    message.requiredProtection !== undefined &&
      (obj.requiredProtection = message.requiredProtection ? License_KeyContainer_OutputProtection.toJSON(message.requiredProtection) : undefined);
    message.requestedProtection !== undefined &&
      (obj.requestedProtection = message.requestedProtection ? License_KeyContainer_OutputProtection.toJSON(message.requestedProtection) : undefined);
    message.keyControl !== undefined &&
      (obj.keyControl = message.keyControl ? License_KeyContainer_KeyControl.toJSON(message.keyControl) : undefined);
    message.operatorSessionKeyPermissions !== undefined &&
      (obj.operatorSessionKeyPermissions = message.operatorSessionKeyPermissions
        ? License_KeyContainer_OperatorSessionKeyPermissions.toJSON(message.operatorSessionKeyPermissions)
        : undefined);
    if (message.videoResolutionConstraints) {
      obj.videoResolutionConstraints = message.videoResolutionConstraints.map((e) =>
        e ? License_KeyContainer_VideoResolutionConstraint.toJSON(e) : undefined
      );
    } else {
      obj.videoResolutionConstraints = [];
    }
    message.antiRollbackUsageTable !== undefined && (obj.antiRollbackUsageTable = message.antiRollbackUsageTable);
    message.trackLabel !== undefined && (obj.trackLabel = message.trackLabel);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<License_KeyContainer>, I>>(object: I): License_KeyContainer {
    const message = createBaseLicense_KeyContainer();
    message.id = object.id ?? Buffer.alloc(0);
    message.iv = object.iv ?? Buffer.alloc(0);
    message.key = object.key ?? Buffer.alloc(0);
    message.type = object.type ?? 1;
    message.level = object.level ?? 1;
    message.requiredProtection =
      object.requiredProtection !== undefined && object.requiredProtection !== null
        ? License_KeyContainer_OutputProtection.fromPartial(object.requiredProtection)
        : undefined;
    message.requestedProtection =
      object.requestedProtection !== undefined && object.requestedProtection !== null
        ? License_KeyContainer_OutputProtection.fromPartial(object.requestedProtection)
        : undefined;
    message.keyControl =
      object.keyControl !== undefined && object.keyControl !== null ? License_KeyContainer_KeyControl.fromPartial(object.keyControl) : undefined;
    message.operatorSessionKeyPermissions =
      object.operatorSessionKeyPermissions !== undefined && object.operatorSessionKeyPermissions !== null
        ? License_KeyContainer_OperatorSessionKeyPermissions.fromPartial(object.operatorSessionKeyPermissions)
        : undefined;
    message.videoResolutionConstraints =
      object.videoResolutionConstraints?.map((e) => License_KeyContainer_VideoResolutionConstraint.fromPartial(e)) || [];
    message.antiRollbackUsageTable = object.antiRollbackUsageTable ?? false;
    message.trackLabel = object.trackLabel ?? '';
    return message;
  }
};

function createBaseLicense_KeyContainer_KeyControl(): License_KeyContainer_KeyControl {
  return { keyControlBlock: Buffer.alloc(0), iv: Buffer.alloc(0) };
}

export const License_KeyContainer_KeyControl = {
  encode(message: License_KeyContainer_KeyControl, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.keyControlBlock.length !== 0) {
      writer.uint32(10).bytes(message.keyControlBlock);
    }
    if (message.iv.length !== 0) {
      writer.uint32(18).bytes(message.iv);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): License_KeyContainer_KeyControl {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    const end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLicense_KeyContainer_KeyControl();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      case 1:
        message.keyControlBlock = reader.bytes() as Buffer;
        break;
      case 2:
        message.iv = reader.bytes() as Buffer;
        break;
      default:
        reader.skipType(tag & 7);
        break;
      }
    }
    return message;
  },

  fromJSON(object: any): License_KeyContainer_KeyControl {
    return {
      keyControlBlock: isSet(object.keyControlBlock) ? Buffer.from(bytesFromBase64(object.keyControlBlock)) : Buffer.alloc(0),
      iv: isSet(object.iv) ? Buffer.from(bytesFromBase64(object.iv)) : Buffer.alloc(0)
    };
  },

  toJSON(message: License_KeyContainer_KeyControl): unknown {
    const obj: any = {};
    message.keyControlBlock !== undefined &&
      (obj.keyControlBlock = base64FromBytes(message.keyControlBlock !== undefined ? message.keyControlBlock : Buffer.alloc(0)));
    message.iv !== undefined && (obj.iv = base64FromBytes(message.iv !== undefined ? message.iv : Buffer.alloc(0)));
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<License_KeyContainer_KeyControl>, I>>(object: I): License_KeyContainer_KeyControl {
    const message = createBaseLicense_KeyContainer_KeyControl();
    message.keyControlBlock = object.keyControlBlock ?? Buffer.alloc(0);
    message.iv = object.iv ?? Buffer.alloc(0);
    return message;
  }
};

function createBaseLicense_KeyContainer_OutputProtection(): License_KeyContainer_OutputProtection {
  return { hdcp: 0, cgmsFlags: 0, hdcpSrmRule: 0, disableAnalogOutput: false, disableDigitalOutput: false };
}

export const License_KeyContainer_OutputProtection = {
  encode(message: License_KeyContainer_OutputProtection, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.hdcp !== 0) {
      writer.uint32(8).int32(message.hdcp);
    }
    if (message.cgmsFlags !== 0) {
      writer.uint32(16).int32(message.cgmsFlags);
    }
    if (message.hdcpSrmRule !== 0) {
      writer.uint32(24).int32(message.hdcpSrmRule);
    }
    if (message.disableAnalogOutput === true) {
      writer.uint32(32).bool(message.disableAnalogOutput);
    }
    if (message.disableDigitalOutput === true) {
      writer.uint32(40).bool(message.disableDigitalOutput);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): License_KeyContainer_OutputProtection {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    const end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLicense_KeyContainer_OutputProtection();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      case 1:
        message.hdcp = reader.int32() as any;
        break;
      case 2:
        message.cgmsFlags = reader.int32() as any;
        break;
      case 3:
        message.hdcpSrmRule = reader.int32() as any;
        break;
      case 4:
        message.disableAnalogOutput = reader.bool();
        break;
      case 5:
        message.disableDigitalOutput = reader.bool();
        break;
      default:
        reader.skipType(tag & 7);
        break;
      }
    }
    return message;
  },

  fromJSON(object: any): License_KeyContainer_OutputProtection {
    return {
      hdcp: isSet(object.hdcp) ? license_KeyContainer_OutputProtection_HDCPFromJSON(object.hdcp) : 0,
      cgmsFlags: isSet(object.cgmsFlags) ? license_KeyContainer_OutputProtection_CGMSFromJSON(object.cgmsFlags) : 0,
      hdcpSrmRule: isSet(object.hdcpSrmRule) ? license_KeyContainer_OutputProtection_HdcpSrmRuleFromJSON(object.hdcpSrmRule) : 0,
      disableAnalogOutput: isSet(object.disableAnalogOutput) ? Boolean(object.disableAnalogOutput) : false,
      disableDigitalOutput: isSet(object.disableDigitalOutput) ? Boolean(object.disableDigitalOutput) : false
    };
  },

  toJSON(message: License_KeyContainer_OutputProtection): unknown {
    const obj: any = {};
    message.hdcp !== undefined && (obj.hdcp = license_KeyContainer_OutputProtection_HDCPToJSON(message.hdcp));
    message.cgmsFlags !== undefined && (obj.cgmsFlags = license_KeyContainer_OutputProtection_CGMSToJSON(message.cgmsFlags));
    message.hdcpSrmRule !== undefined && (obj.hdcpSrmRule = license_KeyContainer_OutputProtection_HdcpSrmRuleToJSON(message.hdcpSrmRule));
    message.disableAnalogOutput !== undefined && (obj.disableAnalogOutput = message.disableAnalogOutput);
    message.disableDigitalOutput !== undefined && (obj.disableDigitalOutput = message.disableDigitalOutput);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<License_KeyContainer_OutputProtection>, I>>(object: I): License_KeyContainer_OutputProtection {
    const message = createBaseLicense_KeyContainer_OutputProtection();
    message.hdcp = object.hdcp ?? 0;
    message.cgmsFlags = object.cgmsFlags ?? 0;
    message.hdcpSrmRule = object.hdcpSrmRule ?? 0;
    message.disableAnalogOutput = object.disableAnalogOutput ?? false;
    message.disableDigitalOutput = object.disableDigitalOutput ?? false;
    return message;
  }
};

function createBaseLicense_KeyContainer_VideoResolutionConstraint(): License_KeyContainer_VideoResolutionConstraint {
  return { minResolutionPixels: 0, maxResolutionPixels: 0, requiredProtection: undefined };
}

export const License_KeyContainer_VideoResolutionConstraint = {
  encode(message: License_KeyContainer_VideoResolutionConstraint, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.minResolutionPixels !== 0) {
      writer.uint32(8).uint32(message.minResolutionPixels);
    }
    if (message.maxResolutionPixels !== 0) {
      writer.uint32(16).uint32(message.maxResolutionPixels);
    }
    if (message.requiredProtection !== undefined) {
      License_KeyContainer_OutputProtection.encode(message.requiredProtection, writer.uint32(26).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): License_KeyContainer_VideoResolutionConstraint {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    const end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLicense_KeyContainer_VideoResolutionConstraint();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      case 1:
        message.minResolutionPixels = reader.uint32();
        break;
      case 2:
        message.maxResolutionPixels = reader.uint32();
        break;
      case 3:
        message.requiredProtection = License_KeyContainer_OutputProtection.decode(reader, reader.uint32());
        break;
      default:
        reader.skipType(tag & 7);
        break;
      }
    }
    return message;
  },

  fromJSON(object: any): License_KeyContainer_VideoResolutionConstraint {
    return {
      minResolutionPixels: isSet(object.minResolutionPixels) ? Number(object.minResolutionPixels) : 0,
      maxResolutionPixels: isSet(object.maxResolutionPixels) ? Number(object.maxResolutionPixels) : 0,
      requiredProtection: isSet(object.requiredProtection) ? License_KeyContainer_OutputProtection.fromJSON(object.requiredProtection) : undefined
    };
  },

  toJSON(message: License_KeyContainer_VideoResolutionConstraint): unknown {
    const obj: any = {};
    message.minResolutionPixels !== undefined && (obj.minResolutionPixels = Math.round(message.minResolutionPixels));
    message.maxResolutionPixels !== undefined && (obj.maxResolutionPixels = Math.round(message.maxResolutionPixels));
    message.requiredProtection !== undefined &&
      (obj.requiredProtection = message.requiredProtection ? License_KeyContainer_OutputProtection.toJSON(message.requiredProtection) : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<License_KeyContainer_VideoResolutionConstraint>, I>>(
    object: I
  ): License_KeyContainer_VideoResolutionConstraint {
    const message = createBaseLicense_KeyContainer_VideoResolutionConstraint();
    message.minResolutionPixels = object.minResolutionPixels ?? 0;
    message.maxResolutionPixels = object.maxResolutionPixels ?? 0;
    message.requiredProtection =
      object.requiredProtection !== undefined && object.requiredProtection !== null
        ? License_KeyContainer_OutputProtection.fromPartial(object.requiredProtection)
        : undefined;
    return message;
  }
};

function createBaseLicense_KeyContainer_OperatorSessionKeyPermissions(): License_KeyContainer_OperatorSessionKeyPermissions {
  return { allowEncrypt: false, allowDecrypt: false, allowSign: false, allowSignatureVerify: false };
}

export const License_KeyContainer_OperatorSessionKeyPermissions = {
  encode(message: License_KeyContainer_OperatorSessionKeyPermissions, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.allowEncrypt === true) {
      writer.uint32(8).bool(message.allowEncrypt);
    }
    if (message.allowDecrypt === true) {
      writer.uint32(16).bool(message.allowDecrypt);
    }
    if (message.allowSign === true) {
      writer.uint32(24).bool(message.allowSign);
    }
    if (message.allowSignatureVerify === true) {
      writer.uint32(32).bool(message.allowSignatureVerify);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): License_KeyContainer_OperatorSessionKeyPermissions {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    const end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLicense_KeyContainer_OperatorSessionKeyPermissions();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      case 1:
        message.allowEncrypt = reader.bool();
        break;
      case 2:
        message.allowDecrypt = reader.bool();
        break;
      case 3:
        message.allowSign = reader.bool();
        break;
      case 4:
        message.allowSignatureVerify = reader.bool();
        break;
      default:
        reader.skipType(tag & 7);
        break;
      }
    }
    return message;
  },

  fromJSON(object: any): License_KeyContainer_OperatorSessionKeyPermissions {
    return {
      allowEncrypt: isSet(object.allowEncrypt) ? Boolean(object.allowEncrypt) : false,
      allowDecrypt: isSet(object.allowDecrypt) ? Boolean(object.allowDecrypt) : false,
      allowSign: isSet(object.allowSign) ? Boolean(object.allowSign) : false,
      allowSignatureVerify: isSet(object.allowSignatureVerify) ? Boolean(object.allowSignatureVerify) : false
    };
  },

  toJSON(message: License_KeyContainer_OperatorSessionKeyPermissions): unknown {
    const obj: any = {};
    message.allowEncrypt !== undefined && (obj.allowEncrypt = message.allowEncrypt);
    message.allowDecrypt !== undefined && (obj.allowDecrypt = message.allowDecrypt);
    message.allowSign !== undefined && (obj.allowSign = message.allowSign);
    message.allowSignatureVerify !== undefined && (obj.allowSignatureVerify = message.allowSignatureVerify);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<License_KeyContainer_OperatorSessionKeyPermissions>, I>>(
    object: I
  ): License_KeyContainer_OperatorSessionKeyPermissions {
    const message = createBaseLicense_KeyContainer_OperatorSessionKeyPermissions();
    message.allowEncrypt = object.allowEncrypt ?? false;
    message.allowDecrypt = object.allowDecrypt ?? false;
    message.allowSign = object.allowSign ?? false;
    message.allowSignatureVerify = object.allowSignatureVerify ?? false;
    return message;
  }
};

function createBaseLicenseRequest(): LicenseRequest {
  return {
    clientId: undefined,
    contentId: undefined,
    type: 1,
    requestTime: Long.ZERO,
    keyControlNonceDeprecated: Buffer.alloc(0),
    protocolVersion: 20,
    keyControlNonce: 0,
    encryptedClientId: undefined
  };
}

export const LicenseRequest = {
  encode(message: LicenseRequest, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.clientId !== undefined) {
      ClientIdentification.encode(message.clientId, writer.uint32(10).fork()).ldelim();
    }
    if (message.contentId !== undefined) {
      LicenseRequest_ContentIdentification.encode(message.contentId, writer.uint32(18).fork()).ldelim();
    }
    if (message.type !== 1) {
      writer.uint32(24).int32(message.type);
    }
    if (!message.requestTime.isZero()) {
      writer.uint32(32).int64(message.requestTime);
    }
    if (message.keyControlNonceDeprecated.length !== 0) {
      writer.uint32(42).bytes(message.keyControlNonceDeprecated);
    }
    if (message.protocolVersion !== 20) {
      writer.uint32(48).int32(message.protocolVersion);
    }
    if (message.keyControlNonce !== 0) {
      writer.uint32(56).uint32(message.keyControlNonce);
    }
    if (message.encryptedClientId !== undefined) {
      EncryptedClientIdentification.encode(message.encryptedClientId, writer.uint32(66).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): LicenseRequest {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    const end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLicenseRequest();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      case 1:
        message.clientId = ClientIdentification.decode(reader, reader.uint32());
        break;
      case 2:
        message.contentId = LicenseRequest_ContentIdentification.decode(reader, reader.uint32());
        break;
      case 3:
        message.type = reader.int32() as any;
        break;
      case 4:
        message.requestTime = reader.int64() as Long;
        break;
      case 5:
        message.keyControlNonceDeprecated = reader.bytes() as Buffer;
        break;
      case 6:
        message.protocolVersion = reader.int32() as any;
        break;
      case 7:
        message.keyControlNonce = reader.uint32();
        break;
      case 8:
        message.encryptedClientId = EncryptedClientIdentification.decode(reader, reader.uint32());
        break;
      default:
        reader.skipType(tag & 7);
        break;
      }
    }
    return message;
  },

  fromJSON(object: any): LicenseRequest {
    return {
      clientId: isSet(object.clientId) ? ClientIdentification.fromJSON(object.clientId) : undefined,
      contentId: isSet(object.contentId) ? LicenseRequest_ContentIdentification.fromJSON(object.contentId) : undefined,
      type: isSet(object.type) ? licenseRequest_RequestTypeFromJSON(object.type) : 1,
      requestTime: isSet(object.requestTime) ? Long.fromValue(object.requestTime) : Long.ZERO,
      keyControlNonceDeprecated: isSet(object.keyControlNonceDeprecated)
        ? Buffer.from(bytesFromBase64(object.keyControlNonceDeprecated))
        : Buffer.alloc(0),
      protocolVersion: isSet(object.protocolVersion) ? protocolVersionFromJSON(object.protocolVersion) : 20,
      keyControlNonce: isSet(object.keyControlNonce) ? Number(object.keyControlNonce) : 0,
      encryptedClientId: isSet(object.encryptedClientId) ? EncryptedClientIdentification.fromJSON(object.encryptedClientId) : undefined
    };
  },

  toJSON(message: LicenseRequest): unknown {
    const obj: any = {};
    message.clientId !== undefined && (obj.clientId = message.clientId ? ClientIdentification.toJSON(message.clientId) : undefined);
    message.contentId !== undefined &&
      (obj.contentId = message.contentId ? LicenseRequest_ContentIdentification.toJSON(message.contentId) : undefined);
    message.type !== undefined && (obj.type = licenseRequest_RequestTypeToJSON(message.type));
    message.requestTime !== undefined && (obj.requestTime = (message.requestTime || Long.ZERO).toString());
    message.keyControlNonceDeprecated !== undefined &&
      (obj.keyControlNonceDeprecated = base64FromBytes(
        message.keyControlNonceDeprecated !== undefined ? message.keyControlNonceDeprecated : Buffer.alloc(0)
      ));
    message.protocolVersion !== undefined && (obj.protocolVersion = protocolVersionToJSON(message.protocolVersion));
    message.keyControlNonce !== undefined && (obj.keyControlNonce = Math.round(message.keyControlNonce));
    message.encryptedClientId !== undefined &&
      (obj.encryptedClientId = message.encryptedClientId ? EncryptedClientIdentification.toJSON(message.encryptedClientId) : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<LicenseRequest>, I>>(object: I): LicenseRequest {
    const message = createBaseLicenseRequest();
    message.clientId = object.clientId !== undefined && object.clientId !== null ? ClientIdentification.fromPartial(object.clientId) : undefined;
    message.contentId =
      object.contentId !== undefined && object.contentId !== null ? LicenseRequest_ContentIdentification.fromPartial(object.contentId) : undefined;
    message.type = object.type ?? 1;
    message.requestTime = object.requestTime !== undefined && object.requestTime !== null ? Long.fromValue(object.requestTime) : Long.ZERO;
    message.keyControlNonceDeprecated = object.keyControlNonceDeprecated ?? Buffer.alloc(0);
    message.protocolVersion = object.protocolVersion ?? 20;
    message.keyControlNonce = object.keyControlNonce ?? 0;
    message.encryptedClientId =
      object.encryptedClientId !== undefined && object.encryptedClientId !== null
        ? EncryptedClientIdentification.fromPartial(object.encryptedClientId)
        : undefined;
    return message;
  }
};

function createBaseLicenseRequest_ContentIdentification(): LicenseRequest_ContentIdentification {
  return { widevinePsshData: undefined, webmKeyId: undefined, existingLicense: undefined, initData: undefined };
}

export const LicenseRequest_ContentIdentification = {
  encode(message: LicenseRequest_ContentIdentification, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.widevinePsshData !== undefined) {
      LicenseRequest_ContentIdentification_WidevinePsshData.encode(message.widevinePsshData, writer.uint32(10).fork()).ldelim();
    }
    if (message.webmKeyId !== undefined) {
      LicenseRequest_ContentIdentification_WebmKeyId.encode(message.webmKeyId, writer.uint32(18).fork()).ldelim();
    }
    if (message.existingLicense !== undefined) {
      LicenseRequest_ContentIdentification_ExistingLicense.encode(message.existingLicense, writer.uint32(26).fork()).ldelim();
    }
    if (message.initData !== undefined) {
      LicenseRequest_ContentIdentification_InitData.encode(message.initData, writer.uint32(34).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): LicenseRequest_ContentIdentification {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    const end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLicenseRequest_ContentIdentification();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      case 1:
        message.widevinePsshData = LicenseRequest_ContentIdentification_WidevinePsshData.decode(reader, reader.uint32());
        break;
      case 2:
        message.webmKeyId = LicenseRequest_ContentIdentification_WebmKeyId.decode(reader, reader.uint32());
        break;
      case 3:
        message.existingLicense = LicenseRequest_ContentIdentification_ExistingLicense.decode(reader, reader.uint32());
        break;
      case 4:
        message.initData = LicenseRequest_ContentIdentification_InitData.decode(reader, reader.uint32());
        break;
      default:
        reader.skipType(tag & 7);
        break;
      }
    }
    return message;
  },

  fromJSON(object: any): LicenseRequest_ContentIdentification {
    return {
      widevinePsshData: isSet(object.widevinePsshData)
        ? LicenseRequest_ContentIdentification_WidevinePsshData.fromJSON(object.widevinePsshData)
        : undefined,
      webmKeyId: isSet(object.webmKeyId) ? LicenseRequest_ContentIdentification_WebmKeyId.fromJSON(object.webmKeyId) : undefined,
      existingLicense: isSet(object.existingLicense)
        ? LicenseRequest_ContentIdentification_ExistingLicense.fromJSON(object.existingLicense)
        : undefined,
      initData: isSet(object.initData) ? LicenseRequest_ContentIdentification_InitData.fromJSON(object.initData) : undefined
    };
  },

  toJSON(message: LicenseRequest_ContentIdentification): unknown {
    const obj: any = {};
    message.widevinePsshData !== undefined &&
      (obj.widevinePsshData = message.widevinePsshData
        ? LicenseRequest_ContentIdentification_WidevinePsshData.toJSON(message.widevinePsshData)
        : undefined);
    message.webmKeyId !== undefined &&
      (obj.webmKeyId = message.webmKeyId ? LicenseRequest_ContentIdentification_WebmKeyId.toJSON(message.webmKeyId) : undefined);
    message.existingLicense !== undefined &&
      (obj.existingLicense = message.existingLicense
        ? LicenseRequest_ContentIdentification_ExistingLicense.toJSON(message.existingLicense)
        : undefined);
    message.initData !== undefined &&
      (obj.initData = message.initData ? LicenseRequest_ContentIdentification_InitData.toJSON(message.initData) : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<LicenseRequest_ContentIdentification>, I>>(object: I): LicenseRequest_ContentIdentification {
    const message = createBaseLicenseRequest_ContentIdentification();
    message.widevinePsshData =
      object.widevinePsshData !== undefined && object.widevinePsshData !== null
        ? LicenseRequest_ContentIdentification_WidevinePsshData.fromPartial(object.widevinePsshData)
        : undefined;
    message.webmKeyId =
      object.webmKeyId !== undefined && object.webmKeyId !== null
        ? LicenseRequest_ContentIdentification_WebmKeyId.fromPartial(object.webmKeyId)
        : undefined;
    message.existingLicense =
      object.existingLicense !== undefined && object.existingLicense !== null
        ? LicenseRequest_ContentIdentification_ExistingLicense.fromPartial(object.existingLicense)
        : undefined;
    message.initData =
      object.initData !== undefined && object.initData !== null
        ? LicenseRequest_ContentIdentification_InitData.fromPartial(object.initData)
        : undefined;
    return message;
  }
};

function createBaseLicenseRequest_ContentIdentification_WidevinePsshData(): LicenseRequest_ContentIdentification_WidevinePsshData {
  return { psshData: [], licenseType: 1, requestId: Buffer.alloc(0) };
}

export const LicenseRequest_ContentIdentification_WidevinePsshData = {
  encode(message: LicenseRequest_ContentIdentification_WidevinePsshData, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.psshData) {
      writer.uint32(10).bytes(v!);
    }
    if (message.licenseType !== 1) {
      writer.uint32(16).int32(message.licenseType);
    }
    if (message.requestId.length !== 0) {
      writer.uint32(26).bytes(message.requestId);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): LicenseRequest_ContentIdentification_WidevinePsshData {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    const end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLicenseRequest_ContentIdentification_WidevinePsshData();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      case 1:
        message.psshData.push(reader.bytes() as Buffer);
        break;
      case 2:
        message.licenseType = reader.int32() as any;
        break;
      case 3:
        message.requestId = reader.bytes() as Buffer;
        break;
      default:
        reader.skipType(tag & 7);
        break;
      }
    }
    return message;
  },

  fromJSON(object: any): LicenseRequest_ContentIdentification_WidevinePsshData {
    return {
      psshData: Array.isArray(object?.psshData) ? object.psshData.map((e: any) => Buffer.from(bytesFromBase64(e))) : [],
      licenseType: isSet(object.licenseType) ? licenseTypeFromJSON(object.licenseType) : 1,
      requestId: isSet(object.requestId) ? Buffer.from(bytesFromBase64(object.requestId)) : Buffer.alloc(0)
    };
  },

  toJSON(message: LicenseRequest_ContentIdentification_WidevinePsshData): unknown {
    const obj: any = {};
    if (message.psshData) {
      obj.psshData = message.psshData.map((e) => base64FromBytes(e !== undefined ? e : Buffer.alloc(0)));
    } else {
      obj.psshData = [];
    }
    message.licenseType !== undefined && (obj.licenseType = licenseTypeToJSON(message.licenseType));
    message.requestId !== undefined && (obj.requestId = base64FromBytes(message.requestId !== undefined ? message.requestId : Buffer.alloc(0)));
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<LicenseRequest_ContentIdentification_WidevinePsshData>, I>>(
    object: I
  ): LicenseRequest_ContentIdentification_WidevinePsshData {
    const message = createBaseLicenseRequest_ContentIdentification_WidevinePsshData();
    message.psshData = object.psshData?.map((e) => e) || [];
    message.licenseType = object.licenseType ?? 1;
    message.requestId = object.requestId ?? Buffer.alloc(0);
    return message;
  }
};

function createBaseLicenseRequest_ContentIdentification_WebmKeyId(): LicenseRequest_ContentIdentification_WebmKeyId {
  return { header: Buffer.alloc(0), licenseType: 1, requestId: Buffer.alloc(0) };
}

export const LicenseRequest_ContentIdentification_WebmKeyId = {
  encode(message: LicenseRequest_ContentIdentification_WebmKeyId, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.header.length !== 0) {
      writer.uint32(10).bytes(message.header);
    }
    if (message.licenseType !== 1) {
      writer.uint32(16).int32(message.licenseType);
    }
    if (message.requestId.length !== 0) {
      writer.uint32(26).bytes(message.requestId);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): LicenseRequest_ContentIdentification_WebmKeyId {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    const end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLicenseRequest_ContentIdentification_WebmKeyId();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      case 1:
        message.header = reader.bytes() as Buffer;
        break;
      case 2:
        message.licenseType = reader.int32() as any;
        break;
      case 3:
        message.requestId = reader.bytes() as Buffer;
        break;
      default:
        reader.skipType(tag & 7);
        break;
      }
    }
    return message;
  },

  fromJSON(object: any): LicenseRequest_ContentIdentification_WebmKeyId {
    return {
      header: isSet(object.header) ? Buffer.from(bytesFromBase64(object.header)) : Buffer.alloc(0),
      licenseType: isSet(object.licenseType) ? licenseTypeFromJSON(object.licenseType) : 1,
      requestId: isSet(object.requestId) ? Buffer.from(bytesFromBase64(object.requestId)) : Buffer.alloc(0)
    };
  },

  toJSON(message: LicenseRequest_ContentIdentification_WebmKeyId): unknown {
    const obj: any = {};
    message.header !== undefined && (obj.header = base64FromBytes(message.header !== undefined ? message.header : Buffer.alloc(0)));
    message.licenseType !== undefined && (obj.licenseType = licenseTypeToJSON(message.licenseType));
    message.requestId !== undefined && (obj.requestId = base64FromBytes(message.requestId !== undefined ? message.requestId : Buffer.alloc(0)));
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<LicenseRequest_ContentIdentification_WebmKeyId>, I>>(
    object: I
  ): LicenseRequest_ContentIdentification_WebmKeyId {
    const message = createBaseLicenseRequest_ContentIdentification_WebmKeyId();
    message.header = object.header ?? Buffer.alloc(0);
    message.licenseType = object.licenseType ?? 1;
    message.requestId = object.requestId ?? Buffer.alloc(0);
    return message;
  }
};

function createBaseLicenseRequest_ContentIdentification_ExistingLicense(): LicenseRequest_ContentIdentification_ExistingLicense {
  return {
    licenseId: undefined,
    secondsSinceStarted: Long.ZERO,
    secondsSinceLastPlayed: Long.ZERO,
    sessionUsageTableEntry: Buffer.alloc(0)
  };
}

export const LicenseRequest_ContentIdentification_ExistingLicense = {
  encode(message: LicenseRequest_ContentIdentification_ExistingLicense, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.licenseId !== undefined) {
      LicenseIdentification.encode(message.licenseId, writer.uint32(10).fork()).ldelim();
    }
    if (!message.secondsSinceStarted.isZero()) {
      writer.uint32(16).int64(message.secondsSinceStarted);
    }
    if (!message.secondsSinceLastPlayed.isZero()) {
      writer.uint32(24).int64(message.secondsSinceLastPlayed);
    }
    if (message.sessionUsageTableEntry.length !== 0) {
      writer.uint32(34).bytes(message.sessionUsageTableEntry);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): LicenseRequest_ContentIdentification_ExistingLicense {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    const end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLicenseRequest_ContentIdentification_ExistingLicense();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      case 1:
        message.licenseId = LicenseIdentification.decode(reader, reader.uint32());
        break;
      case 2:
        message.secondsSinceStarted = reader.int64() as Long;
        break;
      case 3:
        message.secondsSinceLastPlayed = reader.int64() as Long;
        break;
      case 4:
        message.sessionUsageTableEntry = reader.bytes() as Buffer;
        break;
      default:
        reader.skipType(tag & 7);
        break;
      }
    }
    return message;
  },

  fromJSON(object: any): LicenseRequest_ContentIdentification_ExistingLicense {
    return {
      licenseId: isSet(object.licenseId) ? LicenseIdentification.fromJSON(object.licenseId) : undefined,
      secondsSinceStarted: isSet(object.secondsSinceStarted) ? Long.fromValue(object.secondsSinceStarted) : Long.ZERO,
      secondsSinceLastPlayed: isSet(object.secondsSinceLastPlayed) ? Long.fromValue(object.secondsSinceLastPlayed) : Long.ZERO,
      sessionUsageTableEntry: isSet(object.sessionUsageTableEntry) ? Buffer.from(bytesFromBase64(object.sessionUsageTableEntry)) : Buffer.alloc(0)
    };
  },

  toJSON(message: LicenseRequest_ContentIdentification_ExistingLicense): unknown {
    const obj: any = {};
    message.licenseId !== undefined && (obj.licenseId = message.licenseId ? LicenseIdentification.toJSON(message.licenseId) : undefined);
    message.secondsSinceStarted !== undefined && (obj.secondsSinceStarted = (message.secondsSinceStarted || Long.ZERO).toString());
    message.secondsSinceLastPlayed !== undefined && (obj.secondsSinceLastPlayed = (message.secondsSinceLastPlayed || Long.ZERO).toString());
    message.sessionUsageTableEntry !== undefined &&
      (obj.sessionUsageTableEntry = base64FromBytes(message.sessionUsageTableEntry !== undefined ? message.sessionUsageTableEntry : Buffer.alloc(0)));
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<LicenseRequest_ContentIdentification_ExistingLicense>, I>>(
    object: I
  ): LicenseRequest_ContentIdentification_ExistingLicense {
    const message = createBaseLicenseRequest_ContentIdentification_ExistingLicense();
    message.licenseId = object.licenseId !== undefined && object.licenseId !== null ? LicenseIdentification.fromPartial(object.licenseId) : undefined;
    message.secondsSinceStarted =
      object.secondsSinceStarted !== undefined && object.secondsSinceStarted !== null ? Long.fromValue(object.secondsSinceStarted) : Long.ZERO;
    message.secondsSinceLastPlayed =
      object.secondsSinceLastPlayed !== undefined && object.secondsSinceLastPlayed !== null
        ? Long.fromValue(object.secondsSinceLastPlayed)
        : Long.ZERO;
    message.sessionUsageTableEntry = object.sessionUsageTableEntry ?? Buffer.alloc(0);
    return message;
  }
};

function createBaseLicenseRequest_ContentIdentification_InitData(): LicenseRequest_ContentIdentification_InitData {
  return { initDataType: 1, initData: Buffer.alloc(0), licenseType: 1, requestId: Buffer.alloc(0) };
}

export const LicenseRequest_ContentIdentification_InitData = {
  encode(message: LicenseRequest_ContentIdentification_InitData, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.initDataType !== 1) {
      writer.uint32(8).int32(message.initDataType);
    }
    if (message.initData.length !== 0) {
      writer.uint32(18).bytes(message.initData);
    }
    if (message.licenseType !== 1) {
      writer.uint32(24).int32(message.licenseType);
    }
    if (message.requestId.length !== 0) {
      writer.uint32(34).bytes(message.requestId);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): LicenseRequest_ContentIdentification_InitData {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    const end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseLicenseRequest_ContentIdentification_InitData();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      case 1:
        message.initDataType = reader.int32() as any;
        break;
      case 2:
        message.initData = reader.bytes() as Buffer;
        break;
      case 3:
        message.licenseType = reader.int32() as any;
        break;
      case 4:
        message.requestId = reader.bytes() as Buffer;
        break;
      default:
        reader.skipType(tag & 7);
        break;
      }
    }
    return message;
  },

  fromJSON(object: any): LicenseRequest_ContentIdentification_InitData {
    return {
      initDataType: isSet(object.initDataType) ? licenseRequest_ContentIdentification_InitData_InitDataTypeFromJSON(object.initDataType) : 1,
      initData: isSet(object.initData) ? Buffer.from(bytesFromBase64(object.initData)) : Buffer.alloc(0),
      licenseType: isSet(object.licenseType) ? licenseTypeFromJSON(object.licenseType) : 1,
      requestId: isSet(object.requestId) ? Buffer.from(bytesFromBase64(object.requestId)) : Buffer.alloc(0)
    };
  },

  toJSON(message: LicenseRequest_ContentIdentification_InitData): unknown {
    const obj: any = {};
    message.initDataType !== undefined && (obj.initDataType = licenseRequest_ContentIdentification_InitData_InitDataTypeToJSON(message.initDataType));
    message.initData !== undefined && (obj.initData = base64FromBytes(message.initData !== undefined ? message.initData : Buffer.alloc(0)));
    message.licenseType !== undefined && (obj.licenseType = licenseTypeToJSON(message.licenseType));
    message.requestId !== undefined && (obj.requestId = base64FromBytes(message.requestId !== undefined ? message.requestId : Buffer.alloc(0)));
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<LicenseRequest_ContentIdentification_InitData>, I>>(
    object: I
  ): LicenseRequest_ContentIdentification_InitData {
    const message = createBaseLicenseRequest_ContentIdentification_InitData();
    message.initDataType = object.initDataType ?? 1;
    message.initData = object.initData ?? Buffer.alloc(0);
    message.licenseType = object.licenseType ?? 1;
    message.requestId = object.requestId ?? Buffer.alloc(0);
    return message;
  }
};

function createBaseMetricData(): MetricData {
  return { stageName: '', metricData: [] };
}

export const MetricData = {
  encode(message: MetricData, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.stageName !== '') {
      writer.uint32(10).string(message.stageName);
    }
    for (const v of message.metricData) {
      MetricData_TypeValue.encode(v!, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): MetricData {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    const end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMetricData();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      case 1:
        message.stageName = reader.string();
        break;
      case 2:
        message.metricData.push(MetricData_TypeValue.decode(reader, reader.uint32()));
        break;
      default:
        reader.skipType(tag & 7);
        break;
      }
    }
    return message;
  },

  fromJSON(object: any): MetricData {
    return {
      stageName: isSet(object.stageName) ? String(object.stageName) : '',
      metricData: Array.isArray(object?.metricData) ? object.metricData.map((e: any) => MetricData_TypeValue.fromJSON(e)) : []
    };
  },

  toJSON(message: MetricData): unknown {
    const obj: any = {};
    message.stageName !== undefined && (obj.stageName = message.stageName);
    if (message.metricData) {
      obj.metricData = message.metricData.map((e) => (e ? MetricData_TypeValue.toJSON(e) : undefined));
    } else {
      obj.metricData = [];
    }
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<MetricData>, I>>(object: I): MetricData {
    const message = createBaseMetricData();
    message.stageName = object.stageName ?? '';
    message.metricData = object.metricData?.map((e) => MetricData_TypeValue.fromPartial(e)) || [];
    return message;
  }
};

function createBaseMetricData_TypeValue(): MetricData_TypeValue {
  return { type: 1, value: Long.ZERO };
}

export const MetricData_TypeValue = {
  encode(message: MetricData_TypeValue, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.type !== 1) {
      writer.uint32(8).int32(message.type);
    }
    if (!message.value.isZero()) {
      writer.uint32(16).int64(message.value);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): MetricData_TypeValue {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    const end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseMetricData_TypeValue();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      case 1:
        message.type = reader.int32() as any;
        break;
      case 2:
        message.value = reader.int64() as Long;
        break;
      default:
        reader.skipType(tag & 7);
        break;
      }
    }
    return message;
  },

  fromJSON(object: any): MetricData_TypeValue {
    return {
      type: isSet(object.type) ? metricData_MetricTypeFromJSON(object.type) : 1,
      value: isSet(object.value) ? Long.fromValue(object.value) : Long.ZERO
    };
  },

  toJSON(message: MetricData_TypeValue): unknown {
    const obj: any = {};
    message.type !== undefined && (obj.type = metricData_MetricTypeToJSON(message.type));
    message.value !== undefined && (obj.value = (message.value || Long.ZERO).toString());
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<MetricData_TypeValue>, I>>(object: I): MetricData_TypeValue {
    const message = createBaseMetricData_TypeValue();
    message.type = object.type ?? 1;
    message.value = object.value !== undefined && object.value !== null ? Long.fromValue(object.value) : Long.ZERO;
    return message;
  }
};

function createBaseVersionInfo(): VersionInfo {
  return { licenseSdkVersion: '', licenseServiceVersion: '' };
}

export const VersionInfo = {
  encode(message: VersionInfo, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.licenseSdkVersion !== '') {
      writer.uint32(10).string(message.licenseSdkVersion);
    }
    if (message.licenseServiceVersion !== '') {
      writer.uint32(18).string(message.licenseServiceVersion);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): VersionInfo {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    const end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseVersionInfo();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      case 1:
        message.licenseSdkVersion = reader.string();
        break;
      case 2:
        message.licenseServiceVersion = reader.string();
        break;
      default:
        reader.skipType(tag & 7);
        break;
      }
    }
    return message;
  },

  fromJSON(object: any): VersionInfo {
    return {
      licenseSdkVersion: isSet(object.licenseSdkVersion) ? String(object.licenseSdkVersion) : '',
      licenseServiceVersion: isSet(object.licenseServiceVersion) ? String(object.licenseServiceVersion) : ''
    };
  },

  toJSON(message: VersionInfo): unknown {
    const obj: any = {};
    message.licenseSdkVersion !== undefined && (obj.licenseSdkVersion = message.licenseSdkVersion);
    message.licenseServiceVersion !== undefined && (obj.licenseServiceVersion = message.licenseServiceVersion);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<VersionInfo>, I>>(object: I): VersionInfo {
    const message = createBaseVersionInfo();
    message.licenseSdkVersion = object.licenseSdkVersion ?? '';
    message.licenseServiceVersion = object.licenseServiceVersion ?? '';
    return message;
  }
};

function createBaseSignedMessage(): SignedMessage {
  return {
    type: 1,
    msg: Buffer.alloc(0),
    signature: Buffer.alloc(0),
    sessionKey: Buffer.alloc(0),
    remoteAttestation: Buffer.alloc(0),
    metricData: [],
    serviceVersionInfo: undefined,
    sessionKeyType: 0,
    oemcryptoCoreMessage: Buffer.alloc(0)
  };
}

export const SignedMessage = {
  encode(message: SignedMessage, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.type !== 1) {
      writer.uint32(8).int32(message.type);
    }
    if (message.msg.length !== 0) {
      writer.uint32(18).bytes(message.msg);
    }
    if (message.signature.length !== 0) {
      writer.uint32(26).bytes(message.signature);
    }
    if (message.sessionKey.length !== 0) {
      writer.uint32(34).bytes(message.sessionKey);
    }
    if (message.remoteAttestation.length !== 0) {
      writer.uint32(42).bytes(message.remoteAttestation);
    }
    for (const v of message.metricData) {
      MetricData.encode(v!, writer.uint32(50).fork()).ldelim();
    }
    if (message.serviceVersionInfo !== undefined) {
      VersionInfo.encode(message.serviceVersionInfo, writer.uint32(58).fork()).ldelim();
    }
    if (message.sessionKeyType !== 0) {
      writer.uint32(64).int32(message.sessionKeyType);
    }
    if (message.oemcryptoCoreMessage.length !== 0) {
      writer.uint32(74).bytes(message.oemcryptoCoreMessage);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SignedMessage {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    const end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSignedMessage();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      case 1:
        message.type = reader.int32() as any;
        break;
      case 2:
        message.msg = reader.bytes() as Buffer;
        break;
      case 3:
        message.signature = reader.bytes() as Buffer;
        break;
      case 4:
        message.sessionKey = reader.bytes() as Buffer;
        break;
      case 5:
        message.remoteAttestation = reader.bytes() as Buffer;
        break;
      case 6:
        message.metricData.push(MetricData.decode(reader, reader.uint32()));
        break;
      case 7:
        message.serviceVersionInfo = VersionInfo.decode(reader, reader.uint32());
        break;
      case 8:
        message.sessionKeyType = reader.int32() as any;
        break;
      case 9:
        message.oemcryptoCoreMessage = reader.bytes() as Buffer;
        break;
      default:
        reader.skipType(tag & 7);
        break;
      }
    }
    return message;
  },

  fromJSON(object: any): SignedMessage {
    return {
      type: isSet(object.type) ? signedMessage_MessageTypeFromJSON(object.type) : 1,
      msg: isSet(object.msg) ? Buffer.from(bytesFromBase64(object.msg)) : Buffer.alloc(0),
      signature: isSet(object.signature) ? Buffer.from(bytesFromBase64(object.signature)) : Buffer.alloc(0),
      sessionKey: isSet(object.sessionKey) ? Buffer.from(bytesFromBase64(object.sessionKey)) : Buffer.alloc(0),
      remoteAttestation: isSet(object.remoteAttestation) ? Buffer.from(bytesFromBase64(object.remoteAttestation)) : Buffer.alloc(0),
      metricData: Array.isArray(object?.metricData) ? object.metricData.map((e: any) => MetricData.fromJSON(e)) : [],
      serviceVersionInfo: isSet(object.serviceVersionInfo) ? VersionInfo.fromJSON(object.serviceVersionInfo) : undefined,
      sessionKeyType: isSet(object.sessionKeyType) ? signedMessage_SessionKeyTypeFromJSON(object.sessionKeyType) : 0,
      oemcryptoCoreMessage: isSet(object.oemcryptoCoreMessage) ? Buffer.from(bytesFromBase64(object.oemcryptoCoreMessage)) : Buffer.alloc(0)
    };
  },

  toJSON(message: SignedMessage): unknown {
    const obj: any = {};
    message.type !== undefined && (obj.type = signedMessage_MessageTypeToJSON(message.type));
    message.msg !== undefined && (obj.msg = base64FromBytes(message.msg !== undefined ? message.msg : Buffer.alloc(0)));
    message.signature !== undefined && (obj.signature = base64FromBytes(message.signature !== undefined ? message.signature : Buffer.alloc(0)));
    message.sessionKey !== undefined && (obj.sessionKey = base64FromBytes(message.sessionKey !== undefined ? message.sessionKey : Buffer.alloc(0)));
    message.remoteAttestation !== undefined &&
      (obj.remoteAttestation = base64FromBytes(message.remoteAttestation !== undefined ? message.remoteAttestation : Buffer.alloc(0)));
    if (message.metricData) {
      obj.metricData = message.metricData.map((e) => (e ? MetricData.toJSON(e) : undefined));
    } else {
      obj.metricData = [];
    }
    message.serviceVersionInfo !== undefined &&
      (obj.serviceVersionInfo = message.serviceVersionInfo ? VersionInfo.toJSON(message.serviceVersionInfo) : undefined);
    message.sessionKeyType !== undefined && (obj.sessionKeyType = signedMessage_SessionKeyTypeToJSON(message.sessionKeyType));
    message.oemcryptoCoreMessage !== undefined &&
      (obj.oemcryptoCoreMessage = base64FromBytes(message.oemcryptoCoreMessage !== undefined ? message.oemcryptoCoreMessage : Buffer.alloc(0)));
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<SignedMessage>, I>>(object: I): SignedMessage {
    const message = createBaseSignedMessage();
    message.type = object.type ?? 1;
    message.msg = object.msg ?? Buffer.alloc(0);
    message.signature = object.signature ?? Buffer.alloc(0);
    message.sessionKey = object.sessionKey ?? Buffer.alloc(0);
    message.remoteAttestation = object.remoteAttestation ?? Buffer.alloc(0);
    message.metricData = object.metricData?.map((e) => MetricData.fromPartial(e)) || [];
    message.serviceVersionInfo =
      object.serviceVersionInfo !== undefined && object.serviceVersionInfo !== null ? VersionInfo.fromPartial(object.serviceVersionInfo) : undefined;
    message.sessionKeyType = object.sessionKeyType ?? 0;
    message.oemcryptoCoreMessage = object.oemcryptoCoreMessage ?? Buffer.alloc(0);
    return message;
  }
};

function createBaseClientIdentification(): ClientIdentification {
  return {
    type: 0,
    token: Buffer.alloc(0),
    clientInfo: [],
    providerClientToken: Buffer.alloc(0),
    licenseCounter: 0,
    clientCapabilities: undefined,
    vmpData: Buffer.alloc(0),
    deviceCredentials: []
  };
}

export const ClientIdentification = {
  encode(message: ClientIdentification, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.type !== 0) {
      writer.uint32(8).int32(message.type);
    }
    if (message.token.length !== 0) {
      writer.uint32(18).bytes(message.token);
    }
    for (const v of message.clientInfo) {
      ClientIdentification_NameValue.encode(v!, writer.uint32(26).fork()).ldelim();
    }
    if (message.providerClientToken.length !== 0) {
      writer.uint32(34).bytes(message.providerClientToken);
    }
    if (message.licenseCounter !== 0) {
      writer.uint32(40).uint32(message.licenseCounter);
    }
    if (message.clientCapabilities !== undefined) {
      ClientIdentification_ClientCapabilities.encode(message.clientCapabilities, writer.uint32(50).fork()).ldelim();
    }
    if (message.vmpData.length !== 0) {
      writer.uint32(58).bytes(message.vmpData);
    }
    for (const v of message.deviceCredentials) {
      ClientIdentification_ClientCredentials.encode(v!, writer.uint32(66).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ClientIdentification {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    const end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseClientIdentification();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      case 1:
        message.type = reader.int32() as any;
        break;
      case 2:
        message.token = reader.bytes() as Buffer;
        break;
      case 3:
        message.clientInfo.push(ClientIdentification_NameValue.decode(reader, reader.uint32()));
        break;
      case 4:
        message.providerClientToken = reader.bytes() as Buffer;
        break;
      case 5:
        message.licenseCounter = reader.uint32();
        break;
      case 6:
        message.clientCapabilities = ClientIdentification_ClientCapabilities.decode(reader, reader.uint32());
        break;
      case 7:
        message.vmpData = reader.bytes() as Buffer;
        break;
      case 8:
        message.deviceCredentials.push(ClientIdentification_ClientCredentials.decode(reader, reader.uint32()));
        break;
      default:
        reader.skipType(tag & 7);
        break;
      }
    }
    return message;
  },

  fromJSON(object: any): ClientIdentification {
    return {
      type: isSet(object.type) ? clientIdentification_TokenTypeFromJSON(object.type) : 0,
      token: isSet(object.token) ? Buffer.from(bytesFromBase64(object.token)) : Buffer.alloc(0),
      clientInfo: Array.isArray(object?.clientInfo) ? object.clientInfo.map((e: any) => ClientIdentification_NameValue.fromJSON(e)) : [],
      providerClientToken: isSet(object.providerClientToken) ? Buffer.from(bytesFromBase64(object.providerClientToken)) : Buffer.alloc(0),
      licenseCounter: isSet(object.licenseCounter) ? Number(object.licenseCounter) : 0,
      clientCapabilities: isSet(object.clientCapabilities) ? ClientIdentification_ClientCapabilities.fromJSON(object.clientCapabilities) : undefined,
      vmpData: isSet(object.vmpData) ? Buffer.from(bytesFromBase64(object.vmpData)) : Buffer.alloc(0),
      deviceCredentials: Array.isArray(object?.deviceCredentials)
        ? object.deviceCredentials.map((e: any) => ClientIdentification_ClientCredentials.fromJSON(e))
        : []
    };
  },

  toJSON(message: ClientIdentification): unknown {
    const obj: any = {};
    message.type !== undefined && (obj.type = clientIdentification_TokenTypeToJSON(message.type));
    message.token !== undefined && (obj.token = base64FromBytes(message.token !== undefined ? message.token : Buffer.alloc(0)));
    if (message.clientInfo) {
      obj.clientInfo = message.clientInfo.map((e) => (e ? ClientIdentification_NameValue.toJSON(e) : undefined));
    } else {
      obj.clientInfo = [];
    }
    message.providerClientToken !== undefined &&
      (obj.providerClientToken = base64FromBytes(message.providerClientToken !== undefined ? message.providerClientToken : Buffer.alloc(0)));
    message.licenseCounter !== undefined && (obj.licenseCounter = Math.round(message.licenseCounter));
    message.clientCapabilities !== undefined &&
      (obj.clientCapabilities = message.clientCapabilities ? ClientIdentification_ClientCapabilities.toJSON(message.clientCapabilities) : undefined);
    message.vmpData !== undefined && (obj.vmpData = base64FromBytes(message.vmpData !== undefined ? message.vmpData : Buffer.alloc(0)));
    if (message.deviceCredentials) {
      obj.deviceCredentials = message.deviceCredentials.map((e) => (e ? ClientIdentification_ClientCredentials.toJSON(e) : undefined));
    } else {
      obj.deviceCredentials = [];
    }
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<ClientIdentification>, I>>(object: I): ClientIdentification {
    const message = createBaseClientIdentification();
    message.type = object.type ?? 0;
    message.token = object.token ?? Buffer.alloc(0);
    message.clientInfo = object.clientInfo?.map((e) => ClientIdentification_NameValue.fromPartial(e)) || [];
    message.providerClientToken = object.providerClientToken ?? Buffer.alloc(0);
    message.licenseCounter = object.licenseCounter ?? 0;
    message.clientCapabilities =
      object.clientCapabilities !== undefined && object.clientCapabilities !== null
        ? ClientIdentification_ClientCapabilities.fromPartial(object.clientCapabilities)
        : undefined;
    message.vmpData = object.vmpData ?? Buffer.alloc(0);
    message.deviceCredentials = object.deviceCredentials?.map((e) => ClientIdentification_ClientCredentials.fromPartial(e)) || [];
    return message;
  }
};

function createBaseClientIdentification_NameValue(): ClientIdentification_NameValue {
  return { name: '', value: '' };
}

export const ClientIdentification_NameValue = {
  encode(message: ClientIdentification_NameValue, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.name !== '') {
      writer.uint32(10).string(message.name);
    }
    if (message.value !== '') {
      writer.uint32(18).string(message.value);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ClientIdentification_NameValue {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    const end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseClientIdentification_NameValue();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      case 1:
        message.name = reader.string();
        break;
      case 2:
        message.value = reader.string();
        break;
      default:
        reader.skipType(tag & 7);
        break;
      }
    }
    return message;
  },

  fromJSON(object: any): ClientIdentification_NameValue {
    return {
      name: isSet(object.name) ? String(object.name) : '',
      value: isSet(object.value) ? String(object.value) : ''
    };
  },

  toJSON(message: ClientIdentification_NameValue): unknown {
    const obj: any = {};
    message.name !== undefined && (obj.name = message.name);
    message.value !== undefined && (obj.value = message.value);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<ClientIdentification_NameValue>, I>>(object: I): ClientIdentification_NameValue {
    const message = createBaseClientIdentification_NameValue();
    message.name = object.name ?? '';
    message.value = object.value ?? '';
    return message;
  }
};

function createBaseClientIdentification_ClientCapabilities(): ClientIdentification_ClientCapabilities {
  return {
    clientToken: false,
    sessionToken: false,
    videoResolutionConstraints: false,
    maxHdcpVersion: 0,
    oemCryptoApiVersion: 0,
    antiRollbackUsageTable: false,
    srmVersion: 0,
    canUpdateSrm: false,
    supportedCertificateKeyType: [],
    analogOutputCapabilities: 0,
    canDisableAnalogOutput: false,
    resourceRatingTier: 0
  };
}

export const ClientIdentification_ClientCapabilities = {
  encode(message: ClientIdentification_ClientCapabilities, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.clientToken === true) {
      writer.uint32(8).bool(message.clientToken);
    }
    if (message.sessionToken === true) {
      writer.uint32(16).bool(message.sessionToken);
    }
    if (message.videoResolutionConstraints === true) {
      writer.uint32(24).bool(message.videoResolutionConstraints);
    }
    if (message.maxHdcpVersion !== 0) {
      writer.uint32(32).int32(message.maxHdcpVersion);
    }
    if (message.oemCryptoApiVersion !== 0) {
      writer.uint32(40).uint32(message.oemCryptoApiVersion);
    }
    if (message.antiRollbackUsageTable === true) {
      writer.uint32(48).bool(message.antiRollbackUsageTable);
    }
    if (message.srmVersion !== 0) {
      writer.uint32(56).uint32(message.srmVersion);
    }
    if (message.canUpdateSrm === true) {
      writer.uint32(64).bool(message.canUpdateSrm);
    }
    writer.uint32(74).fork();
    for (const v of message.supportedCertificateKeyType) {
      writer.int32(v);
    }
    writer.ldelim();
    if (message.analogOutputCapabilities !== 0) {
      writer.uint32(80).int32(message.analogOutputCapabilities);
    }
    if (message.canDisableAnalogOutput === true) {
      writer.uint32(88).bool(message.canDisableAnalogOutput);
    }
    if (message.resourceRatingTier !== 0) {
      writer.uint32(96).uint32(message.resourceRatingTier);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ClientIdentification_ClientCapabilities {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    const end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseClientIdentification_ClientCapabilities();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      case 1:
        message.clientToken = reader.bool();
        break;
      case 2:
        message.sessionToken = reader.bool();
        break;
      case 3:
        message.videoResolutionConstraints = reader.bool();
        break;
      case 4:
        message.maxHdcpVersion = reader.int32() as any;
        break;
      case 5:
        message.oemCryptoApiVersion = reader.uint32();
        break;
      case 6:
        message.antiRollbackUsageTable = reader.bool();
        break;
      case 7:
        message.srmVersion = reader.uint32();
        break;
      case 8:
        message.canUpdateSrm = reader.bool();
        break;
      case 9:
        if ((tag & 7) === 2) {
          const end2 = reader.uint32() + reader.pos;
          while (reader.pos < end2) {
            message.supportedCertificateKeyType.push(reader.int32() as any);
          }
        } else {
          message.supportedCertificateKeyType.push(reader.int32() as any);
        }
        break;
      case 10:
        message.analogOutputCapabilities = reader.int32() as any;
        break;
      case 11:
        message.canDisableAnalogOutput = reader.bool();
        break;
      case 12:
        message.resourceRatingTier = reader.uint32();
        break;
      default:
        reader.skipType(tag & 7);
        break;
      }
    }
    return message;
  },

  fromJSON(object: any): ClientIdentification_ClientCapabilities {
    return {
      clientToken: isSet(object.clientToken) ? Boolean(object.clientToken) : false,
      sessionToken: isSet(object.sessionToken) ? Boolean(object.sessionToken) : false,
      videoResolutionConstraints: isSet(object.videoResolutionConstraints) ? Boolean(object.videoResolutionConstraints) : false,
      maxHdcpVersion: isSet(object.maxHdcpVersion) ? clientIdentification_ClientCapabilities_HdcpVersionFromJSON(object.maxHdcpVersion) : 0,
      oemCryptoApiVersion: isSet(object.oemCryptoApiVersion) ? Number(object.oemCryptoApiVersion) : 0,
      antiRollbackUsageTable: isSet(object.antiRollbackUsageTable) ? Boolean(object.antiRollbackUsageTable) : false,
      srmVersion: isSet(object.srmVersion) ? Number(object.srmVersion) : 0,
      canUpdateSrm: isSet(object.canUpdateSrm) ? Boolean(object.canUpdateSrm) : false,
      supportedCertificateKeyType: Array.isArray(object?.supportedCertificateKeyType)
        ? object.supportedCertificateKeyType.map((e: any) => clientIdentification_ClientCapabilities_CertificateKeyTypeFromJSON(e))
        : [],
      analogOutputCapabilities: isSet(object.analogOutputCapabilities)
        ? clientIdentification_ClientCapabilities_AnalogOutputCapabilitiesFromJSON(object.analogOutputCapabilities)
        : 0,
      canDisableAnalogOutput: isSet(object.canDisableAnalogOutput) ? Boolean(object.canDisableAnalogOutput) : false,
      resourceRatingTier: isSet(object.resourceRatingTier) ? Number(object.resourceRatingTier) : 0
    };
  },

  toJSON(message: ClientIdentification_ClientCapabilities): unknown {
    const obj: any = {};
    message.clientToken !== undefined && (obj.clientToken = message.clientToken);
    message.sessionToken !== undefined && (obj.sessionToken = message.sessionToken);
    message.videoResolutionConstraints !== undefined && (obj.videoResolutionConstraints = message.videoResolutionConstraints);
    message.maxHdcpVersion !== undefined && (obj.maxHdcpVersion = clientIdentification_ClientCapabilities_HdcpVersionToJSON(message.maxHdcpVersion));
    message.oemCryptoApiVersion !== undefined && (obj.oemCryptoApiVersion = Math.round(message.oemCryptoApiVersion));
    message.antiRollbackUsageTable !== undefined && (obj.antiRollbackUsageTable = message.antiRollbackUsageTable);
    message.srmVersion !== undefined && (obj.srmVersion = Math.round(message.srmVersion));
    message.canUpdateSrm !== undefined && (obj.canUpdateSrm = message.canUpdateSrm);
    if (message.supportedCertificateKeyType) {
      obj.supportedCertificateKeyType = message.supportedCertificateKeyType.map((e) =>
        clientIdentification_ClientCapabilities_CertificateKeyTypeToJSON(e)
      );
    } else {
      obj.supportedCertificateKeyType = [];
    }
    message.analogOutputCapabilities !== undefined &&
      (obj.analogOutputCapabilities = clientIdentification_ClientCapabilities_AnalogOutputCapabilitiesToJSON(message.analogOutputCapabilities));
    message.canDisableAnalogOutput !== undefined && (obj.canDisableAnalogOutput = message.canDisableAnalogOutput);
    message.resourceRatingTier !== undefined && (obj.resourceRatingTier = Math.round(message.resourceRatingTier));
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<ClientIdentification_ClientCapabilities>, I>>(object: I): ClientIdentification_ClientCapabilities {
    const message = createBaseClientIdentification_ClientCapabilities();
    message.clientToken = object.clientToken ?? false;
    message.sessionToken = object.sessionToken ?? false;
    message.videoResolutionConstraints = object.videoResolutionConstraints ?? false;
    message.maxHdcpVersion = object.maxHdcpVersion ?? 0;
    message.oemCryptoApiVersion = object.oemCryptoApiVersion ?? 0;
    message.antiRollbackUsageTable = object.antiRollbackUsageTable ?? false;
    message.srmVersion = object.srmVersion ?? 0;
    message.canUpdateSrm = object.canUpdateSrm ?? false;
    message.supportedCertificateKeyType = object.supportedCertificateKeyType?.map((e) => e) || [];
    message.analogOutputCapabilities = object.analogOutputCapabilities ?? 0;
    message.canDisableAnalogOutput = object.canDisableAnalogOutput ?? false;
    message.resourceRatingTier = object.resourceRatingTier ?? 0;
    return message;
  }
};

function createBaseClientIdentification_ClientCredentials(): ClientIdentification_ClientCredentials {
  return { type: 0, token: Buffer.alloc(0) };
}

export const ClientIdentification_ClientCredentials = {
  encode(message: ClientIdentification_ClientCredentials, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.type !== 0) {
      writer.uint32(8).int32(message.type);
    }
    if (message.token.length !== 0) {
      writer.uint32(18).bytes(message.token);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): ClientIdentification_ClientCredentials {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    const end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseClientIdentification_ClientCredentials();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      case 1:
        message.type = reader.int32() as any;
        break;
      case 2:
        message.token = reader.bytes() as Buffer;
        break;
      default:
        reader.skipType(tag & 7);
        break;
      }
    }
    return message;
  },

  fromJSON(object: any): ClientIdentification_ClientCredentials {
    return {
      type: isSet(object.type) ? clientIdentification_TokenTypeFromJSON(object.type) : 0,
      token: isSet(object.token) ? Buffer.from(bytesFromBase64(object.token)) : Buffer.alloc(0)
    };
  },

  toJSON(message: ClientIdentification_ClientCredentials): unknown {
    const obj: any = {};
    message.type !== undefined && (obj.type = clientIdentification_TokenTypeToJSON(message.type));
    message.token !== undefined && (obj.token = base64FromBytes(message.token !== undefined ? message.token : Buffer.alloc(0)));
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<ClientIdentification_ClientCredentials>, I>>(object: I): ClientIdentification_ClientCredentials {
    const message = createBaseClientIdentification_ClientCredentials();
    message.type = object.type ?? 0;
    message.token = object.token ?? Buffer.alloc(0);
    return message;
  }
};

function createBaseEncryptedClientIdentification(): EncryptedClientIdentification {
  return {
    providerId: '',
    serviceCertificateSerialNumber: Buffer.alloc(0),
    encryptedClientId: Buffer.alloc(0),
    encryptedClientIdIv: Buffer.alloc(0),
    encryptedPrivacyKey: Buffer.alloc(0)
  };
}

export const EncryptedClientIdentification = {
  encode(message: EncryptedClientIdentification, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.providerId !== '') {
      writer.uint32(10).string(message.providerId);
    }
    if (message.serviceCertificateSerialNumber.length !== 0) {
      writer.uint32(18).bytes(message.serviceCertificateSerialNumber);
    }
    if (message.encryptedClientId.length !== 0) {
      writer.uint32(26).bytes(message.encryptedClientId);
    }
    if (message.encryptedClientIdIv.length !== 0) {
      writer.uint32(34).bytes(message.encryptedClientIdIv);
    }
    if (message.encryptedPrivacyKey.length !== 0) {
      writer.uint32(42).bytes(message.encryptedPrivacyKey);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): EncryptedClientIdentification {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    const end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseEncryptedClientIdentification();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      case 1:
        message.providerId = reader.string();
        break;
      case 2:
        message.serviceCertificateSerialNumber = reader.bytes() as Buffer;
        break;
      case 3:
        message.encryptedClientId = reader.bytes() as Buffer;
        break;
      case 4:
        message.encryptedClientIdIv = reader.bytes() as Buffer;
        break;
      case 5:
        message.encryptedPrivacyKey = reader.bytes() as Buffer;
        break;
      default:
        reader.skipType(tag & 7);
        break;
      }
    }
    return message;
  },

  fromJSON(object: any): EncryptedClientIdentification {
    return {
      providerId: isSet(object.providerId) ? String(object.providerId) : '',
      serviceCertificateSerialNumber: isSet(object.serviceCertificateSerialNumber)
        ? Buffer.from(bytesFromBase64(object.serviceCertificateSerialNumber))
        : Buffer.alloc(0),
      encryptedClientId: isSet(object.encryptedClientId) ? Buffer.from(bytesFromBase64(object.encryptedClientId)) : Buffer.alloc(0),
      encryptedClientIdIv: isSet(object.encryptedClientIdIv) ? Buffer.from(bytesFromBase64(object.encryptedClientIdIv)) : Buffer.alloc(0),
      encryptedPrivacyKey: isSet(object.encryptedPrivacyKey) ? Buffer.from(bytesFromBase64(object.encryptedPrivacyKey)) : Buffer.alloc(0)
    };
  },

  toJSON(message: EncryptedClientIdentification): unknown {
    const obj: any = {};
    message.providerId !== undefined && (obj.providerId = message.providerId);
    message.serviceCertificateSerialNumber !== undefined &&
      (obj.serviceCertificateSerialNumber = base64FromBytes(
        message.serviceCertificateSerialNumber !== undefined ? message.serviceCertificateSerialNumber : Buffer.alloc(0)
      ));
    message.encryptedClientId !== undefined &&
      (obj.encryptedClientId = base64FromBytes(message.encryptedClientId !== undefined ? message.encryptedClientId : Buffer.alloc(0)));
    message.encryptedClientIdIv !== undefined &&
      (obj.encryptedClientIdIv = base64FromBytes(message.encryptedClientIdIv !== undefined ? message.encryptedClientIdIv : Buffer.alloc(0)));
    message.encryptedPrivacyKey !== undefined &&
      (obj.encryptedPrivacyKey = base64FromBytes(message.encryptedPrivacyKey !== undefined ? message.encryptedPrivacyKey : Buffer.alloc(0)));
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<EncryptedClientIdentification>, I>>(object: I): EncryptedClientIdentification {
    const message = createBaseEncryptedClientIdentification();
    message.providerId = object.providerId ?? '';
    message.serviceCertificateSerialNumber = object.serviceCertificateSerialNumber ?? Buffer.alloc(0);
    message.encryptedClientId = object.encryptedClientId ?? Buffer.alloc(0);
    message.encryptedClientIdIv = object.encryptedClientIdIv ?? Buffer.alloc(0);
    message.encryptedPrivacyKey = object.encryptedPrivacyKey ?? Buffer.alloc(0);
    return message;
  }
};

function createBaseDrmCertificate(): DrmCertificate {
  return {
    type: 0,
    serialNumber: Buffer.alloc(0),
    creationTimeSeconds: 0,
    expirationTimeSeconds: 0,
    publicKey: Buffer.alloc(0),
    systemId: 0,
    testDeviceDeprecated: false,
    providerId: '',
    serviceTypes: [],
    algorithm: 0,
    rotId: Buffer.alloc(0),
    encryptionKey: undefined
  };
}

export const DrmCertificate = {
  encode(message: DrmCertificate, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.type !== 0) {
      writer.uint32(8).int32(message.type);
    }
    if (message.serialNumber.length !== 0) {
      writer.uint32(18).bytes(message.serialNumber);
    }
    if (message.creationTimeSeconds !== 0) {
      writer.uint32(24).uint32(message.creationTimeSeconds);
    }
    if (message.expirationTimeSeconds !== 0) {
      writer.uint32(96).uint32(message.expirationTimeSeconds);
    }
    if (message.publicKey.length !== 0) {
      writer.uint32(34).bytes(message.publicKey);
    }
    if (message.systemId !== 0) {
      writer.uint32(40).uint32(message.systemId);
    }
    if (message.testDeviceDeprecated === true) {
      writer.uint32(48).bool(message.testDeviceDeprecated);
    }
    if (message.providerId !== '') {
      writer.uint32(58).string(message.providerId);
    }
    writer.uint32(66).fork();
    for (const v of message.serviceTypes) {
      writer.int32(v);
    }
    writer.ldelim();
    if (message.algorithm !== 0) {
      writer.uint32(72).int32(message.algorithm);
    }
    if (message.rotId.length !== 0) {
      writer.uint32(82).bytes(message.rotId);
    }
    if (message.encryptionKey !== undefined) {
      DrmCertificate_EncryptionKey.encode(message.encryptionKey, writer.uint32(90).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DrmCertificate {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    const end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDrmCertificate();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      case 1:
        message.type = reader.int32() as any;
        break;
      case 2:
        message.serialNumber = reader.bytes() as Buffer;
        break;
      case 3:
        message.creationTimeSeconds = reader.uint32();
        break;
      case 12:
        message.expirationTimeSeconds = reader.uint32();
        break;
      case 4:
        message.publicKey = reader.bytes() as Buffer;
        break;
      case 5:
        message.systemId = reader.uint32();
        break;
      case 6:
        message.testDeviceDeprecated = reader.bool();
        break;
      case 7:
        message.providerId = reader.string();
        break;
      case 8:
        if ((tag & 7) === 2) {
          const end2 = reader.uint32() + reader.pos;
          while (reader.pos < end2) {
            message.serviceTypes.push(reader.int32() as any);
          }
        } else {
          message.serviceTypes.push(reader.int32() as any);
        }
        break;
      case 9:
        message.algorithm = reader.int32() as any;
        break;
      case 10:
        message.rotId = reader.bytes() as Buffer;
        break;
      case 11:
        message.encryptionKey = DrmCertificate_EncryptionKey.decode(reader, reader.uint32());
        break;
      default:
        reader.skipType(tag & 7);
        break;
      }
    }
    return message;
  },

  fromJSON(object: any): DrmCertificate {
    return {
      type: isSet(object.type) ? drmCertificate_TypeFromJSON(object.type) : 0,
      serialNumber: isSet(object.serialNumber) ? Buffer.from(bytesFromBase64(object.serialNumber)) : Buffer.alloc(0),
      creationTimeSeconds: isSet(object.creationTimeSeconds) ? Number(object.creationTimeSeconds) : 0,
      expirationTimeSeconds: isSet(object.expirationTimeSeconds) ? Number(object.expirationTimeSeconds) : 0,
      publicKey: isSet(object.publicKey) ? Buffer.from(bytesFromBase64(object.publicKey)) : Buffer.alloc(0),
      systemId: isSet(object.systemId) ? Number(object.systemId) : 0,
      testDeviceDeprecated: isSet(object.testDeviceDeprecated) ? Boolean(object.testDeviceDeprecated) : false,
      providerId: isSet(object.providerId) ? String(object.providerId) : '',
      serviceTypes: Array.isArray(object?.serviceTypes) ? object.serviceTypes.map((e: any) => drmCertificate_ServiceTypeFromJSON(e)) : [],
      algorithm: isSet(object.algorithm) ? drmCertificate_AlgorithmFromJSON(object.algorithm) : 0,
      rotId: isSet(object.rotId) ? Buffer.from(bytesFromBase64(object.rotId)) : Buffer.alloc(0),
      encryptionKey: isSet(object.encryptionKey) ? DrmCertificate_EncryptionKey.fromJSON(object.encryptionKey) : undefined
    };
  },

  toJSON(message: DrmCertificate): unknown {
    const obj: any = {};
    message.type !== undefined && (obj.type = drmCertificate_TypeToJSON(message.type));
    message.serialNumber !== undefined &&
      (obj.serialNumber = base64FromBytes(message.serialNumber !== undefined ? message.serialNumber : Buffer.alloc(0)));
    message.creationTimeSeconds !== undefined && (obj.creationTimeSeconds = Math.round(message.creationTimeSeconds));
    message.expirationTimeSeconds !== undefined && (obj.expirationTimeSeconds = Math.round(message.expirationTimeSeconds));
    message.publicKey !== undefined && (obj.publicKey = base64FromBytes(message.publicKey !== undefined ? message.publicKey : Buffer.alloc(0)));
    message.systemId !== undefined && (obj.systemId = Math.round(message.systemId));
    message.testDeviceDeprecated !== undefined && (obj.testDeviceDeprecated = message.testDeviceDeprecated);
    message.providerId !== undefined && (obj.providerId = message.providerId);
    if (message.serviceTypes) {
      obj.serviceTypes = message.serviceTypes.map((e) => drmCertificate_ServiceTypeToJSON(e));
    } else {
      obj.serviceTypes = [];
    }
    message.algorithm !== undefined && (obj.algorithm = drmCertificate_AlgorithmToJSON(message.algorithm));
    message.rotId !== undefined && (obj.rotId = base64FromBytes(message.rotId !== undefined ? message.rotId : Buffer.alloc(0)));
    message.encryptionKey !== undefined &&
      (obj.encryptionKey = message.encryptionKey ? DrmCertificate_EncryptionKey.toJSON(message.encryptionKey) : undefined);
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<DrmCertificate>, I>>(object: I): DrmCertificate {
    const message = createBaseDrmCertificate();
    message.type = object.type ?? 0;
    message.serialNumber = object.serialNumber ?? Buffer.alloc(0);
    message.creationTimeSeconds = object.creationTimeSeconds ?? 0;
    message.expirationTimeSeconds = object.expirationTimeSeconds ?? 0;
    message.publicKey = object.publicKey ?? Buffer.alloc(0);
    message.systemId = object.systemId ?? 0;
    message.testDeviceDeprecated = object.testDeviceDeprecated ?? false;
    message.providerId = object.providerId ?? '';
    message.serviceTypes = object.serviceTypes?.map((e) => e) || [];
    message.algorithm = object.algorithm ?? 0;
    message.rotId = object.rotId ?? Buffer.alloc(0);
    message.encryptionKey =
      object.encryptionKey !== undefined && object.encryptionKey !== null
        ? DrmCertificate_EncryptionKey.fromPartial(object.encryptionKey)
        : undefined;
    return message;
  }
};

function createBaseDrmCertificate_EncryptionKey(): DrmCertificate_EncryptionKey {
  return { publicKey: Buffer.alloc(0), algorithm: 0 };
}

export const DrmCertificate_EncryptionKey = {
  encode(message: DrmCertificate_EncryptionKey, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.publicKey.length !== 0) {
      writer.uint32(10).bytes(message.publicKey);
    }
    if (message.algorithm !== 0) {
      writer.uint32(16).int32(message.algorithm);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): DrmCertificate_EncryptionKey {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    const end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseDrmCertificate_EncryptionKey();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      case 1:
        message.publicKey = reader.bytes() as Buffer;
        break;
      case 2:
        message.algorithm = reader.int32() as any;
        break;
      default:
        reader.skipType(tag & 7);
        break;
      }
    }
    return message;
  },

  fromJSON(object: any): DrmCertificate_EncryptionKey {
    return {
      publicKey: isSet(object.publicKey) ? Buffer.from(bytesFromBase64(object.publicKey)) : Buffer.alloc(0),
      algorithm: isSet(object.algorithm) ? drmCertificate_AlgorithmFromJSON(object.algorithm) : 0
    };
  },

  toJSON(message: DrmCertificate_EncryptionKey): unknown {
    const obj: any = {};
    message.publicKey !== undefined && (obj.publicKey = base64FromBytes(message.publicKey !== undefined ? message.publicKey : Buffer.alloc(0)));
    message.algorithm !== undefined && (obj.algorithm = drmCertificate_AlgorithmToJSON(message.algorithm));
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<DrmCertificate_EncryptionKey>, I>>(object: I): DrmCertificate_EncryptionKey {
    const message = createBaseDrmCertificate_EncryptionKey();
    message.publicKey = object.publicKey ?? Buffer.alloc(0);
    message.algorithm = object.algorithm ?? 0;
    return message;
  }
};

function createBaseSignedDrmCertificate(): SignedDrmCertificate {
  return { drmCertificate: Buffer.alloc(0), signature: Buffer.alloc(0), signer: undefined, hashAlgorithm: 0 };
}

export const SignedDrmCertificate = {
  encode(message: SignedDrmCertificate, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.drmCertificate.length !== 0) {
      writer.uint32(10).bytes(message.drmCertificate);
    }
    if (message.signature.length !== 0) {
      writer.uint32(18).bytes(message.signature);
    }
    if (message.signer !== undefined) {
      SignedDrmCertificate.encode(message.signer, writer.uint32(26).fork()).ldelim();
    }
    if (message.hashAlgorithm !== 0) {
      writer.uint32(32).int32(message.hashAlgorithm);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): SignedDrmCertificate {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    const end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseSignedDrmCertificate();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      case 1:
        message.drmCertificate = reader.bytes() as Buffer;
        break;
      case 2:
        message.signature = reader.bytes() as Buffer;
        break;
      case 3:
        message.signer = SignedDrmCertificate.decode(reader, reader.uint32());
        break;
      case 4:
        message.hashAlgorithm = reader.int32() as any;
        break;
      default:
        reader.skipType(tag & 7);
        break;
      }
    }
    return message;
  },

  fromJSON(object: any): SignedDrmCertificate {
    return {
      drmCertificate: isSet(object.drmCertificate) ? Buffer.from(bytesFromBase64(object.drmCertificate)) : Buffer.alloc(0),
      signature: isSet(object.signature) ? Buffer.from(bytesFromBase64(object.signature)) : Buffer.alloc(0),
      signer: isSet(object.signer) ? SignedDrmCertificate.fromJSON(object.signer) : undefined,
      hashAlgorithm: isSet(object.hashAlgorithm) ? hashAlgorithmProtoFromJSON(object.hashAlgorithm) : 0
    };
  },

  toJSON(message: SignedDrmCertificate): unknown {
    const obj: any = {};
    message.drmCertificate !== undefined &&
      (obj.drmCertificate = base64FromBytes(message.drmCertificate !== undefined ? message.drmCertificate : Buffer.alloc(0)));
    message.signature !== undefined && (obj.signature = base64FromBytes(message.signature !== undefined ? message.signature : Buffer.alloc(0)));
    message.signer !== undefined && (obj.signer = message.signer ? SignedDrmCertificate.toJSON(message.signer) : undefined);
    message.hashAlgorithm !== undefined && (obj.hashAlgorithm = hashAlgorithmProtoToJSON(message.hashAlgorithm));
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<SignedDrmCertificate>, I>>(object: I): SignedDrmCertificate {
    const message = createBaseSignedDrmCertificate();
    message.drmCertificate = object.drmCertificate ?? Buffer.alloc(0);
    message.signature = object.signature ?? Buffer.alloc(0);
    message.signer = object.signer !== undefined && object.signer !== null ? SignedDrmCertificate.fromPartial(object.signer) : undefined;
    message.hashAlgorithm = object.hashAlgorithm ?? 0;
    return message;
  }
};

function createBaseWidevinePsshData(): WidevinePsshData {
  return {
    keyIds: [],
    contentId: Buffer.alloc(0),
    cryptoPeriodIndex: 0,
    protectionScheme: 0,
    cryptoPeriodSeconds: 0,
    type: 0,
    keySequence: 0,
    groupIds: [],
    entitledKeys: [],
    videoFeature: '',
    algorithm: 0,
    provider: '',
    trackType: '',
    policy: '',
    groupedLicense: Buffer.alloc(0)
  };
}

export const WidevinePsshData = {
  encode(message: WidevinePsshData, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    for (const v of message.keyIds) {
      writer.uint32(18).bytes(v!);
    }
    if (message.contentId.length !== 0) {
      writer.uint32(34).bytes(message.contentId);
    }
    if (message.cryptoPeriodIndex !== 0) {
      writer.uint32(56).uint32(message.cryptoPeriodIndex);
    }
    if (message.protectionScheme !== 0) {
      writer.uint32(72).uint32(message.protectionScheme);
    }
    if (message.cryptoPeriodSeconds !== 0) {
      writer.uint32(80).uint32(message.cryptoPeriodSeconds);
    }
    if (message.type !== 0) {
      writer.uint32(88).int32(message.type);
    }
    if (message.keySequence !== 0) {
      writer.uint32(96).uint32(message.keySequence);
    }
    for (const v of message.groupIds) {
      writer.uint32(106).bytes(v!);
    }
    for (const v of message.entitledKeys) {
      WidevinePsshData_EntitledKey.encode(v!, writer.uint32(114).fork()).ldelim();
    }
    if (message.videoFeature !== '') {
      writer.uint32(122).string(message.videoFeature);
    }
    if (message.algorithm !== 0) {
      writer.uint32(8).int32(message.algorithm);
    }
    if (message.provider !== '') {
      writer.uint32(26).string(message.provider);
    }
    if (message.trackType !== '') {
      writer.uint32(42).string(message.trackType);
    }
    if (message.policy !== '') {
      writer.uint32(50).string(message.policy);
    }
    if (message.groupedLicense.length !== 0) {
      writer.uint32(66).bytes(message.groupedLicense);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): WidevinePsshData {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    const end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseWidevinePsshData();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      case 2:
        message.keyIds.push(reader.bytes() as Buffer);
        break;
      case 4:
        message.contentId = reader.bytes() as Buffer;
        break;
      case 7:
        message.cryptoPeriodIndex = reader.uint32();
        break;
      case 9:
        message.protectionScheme = reader.uint32();
        break;
      case 10:
        message.cryptoPeriodSeconds = reader.uint32();
        break;
      case 11:
        message.type = reader.int32() as any;
        break;
      case 12:
        message.keySequence = reader.uint32();
        break;
      case 13:
        message.groupIds.push(reader.bytes() as Buffer);
        break;
      case 14:
        message.entitledKeys.push(WidevinePsshData_EntitledKey.decode(reader, reader.uint32()));
        break;
      case 15:
        message.videoFeature = reader.string();
        break;
      case 1:
        message.algorithm = reader.int32() as any;
        break;
      case 3:
        message.provider = reader.string();
        break;
      case 5:
        message.trackType = reader.string();
        break;
      case 6:
        message.policy = reader.string();
        break;
      case 8:
        message.groupedLicense = reader.bytes() as Buffer;
        break;
      default:
        reader.skipType(tag & 7);
        break;
      }
    }
    return message;
  },

  fromJSON(object: any): WidevinePsshData {
    return {
      keyIds: Array.isArray(object?.keyIds) ? object.keyIds.map((e: any) => Buffer.from(bytesFromBase64(e))) : [],
      contentId: isSet(object.contentId) ? Buffer.from(bytesFromBase64(object.contentId)) : Buffer.alloc(0),
      cryptoPeriodIndex: isSet(object.cryptoPeriodIndex) ? Number(object.cryptoPeriodIndex) : 0,
      protectionScheme: isSet(object.protectionScheme) ? Number(object.protectionScheme) : 0,
      cryptoPeriodSeconds: isSet(object.cryptoPeriodSeconds) ? Number(object.cryptoPeriodSeconds) : 0,
      type: isSet(object.type) ? widevinePsshData_TypeFromJSON(object.type) : 0,
      keySequence: isSet(object.keySequence) ? Number(object.keySequence) : 0,
      groupIds: Array.isArray(object?.groupIds) ? object.groupIds.map((e: any) => Buffer.from(bytesFromBase64(e))) : [],
      entitledKeys: Array.isArray(object?.entitledKeys) ? object.entitledKeys.map((e: any) => WidevinePsshData_EntitledKey.fromJSON(e)) : [],
      videoFeature: isSet(object.videoFeature) ? String(object.videoFeature) : '',
      algorithm: isSet(object.algorithm) ? widevinePsshData_AlgorithmFromJSON(object.algorithm) : 0,
      provider: isSet(object.provider) ? String(object.provider) : '',
      trackType: isSet(object.trackType) ? String(object.trackType) : '',
      policy: isSet(object.policy) ? String(object.policy) : '',
      groupedLicense: isSet(object.groupedLicense) ? Buffer.from(bytesFromBase64(object.groupedLicense)) : Buffer.alloc(0)
    };
  },

  toJSON(message: WidevinePsshData): unknown {
    const obj: any = {};
    if (message.keyIds) {
      obj.keyIds = message.keyIds.map((e) => base64FromBytes(e !== undefined ? e : Buffer.alloc(0)));
    } else {
      obj.keyIds = [];
    }
    message.contentId !== undefined && (obj.contentId = base64FromBytes(message.contentId !== undefined ? message.contentId : Buffer.alloc(0)));
    message.cryptoPeriodIndex !== undefined && (obj.cryptoPeriodIndex = Math.round(message.cryptoPeriodIndex));
    message.protectionScheme !== undefined && (obj.protectionScheme = Math.round(message.protectionScheme));
    message.cryptoPeriodSeconds !== undefined && (obj.cryptoPeriodSeconds = Math.round(message.cryptoPeriodSeconds));
    message.type !== undefined && (obj.type = widevinePsshData_TypeToJSON(message.type));
    message.keySequence !== undefined && (obj.keySequence = Math.round(message.keySequence));
    if (message.groupIds) {
      obj.groupIds = message.groupIds.map((e) => base64FromBytes(e !== undefined ? e : Buffer.alloc(0)));
    } else {
      obj.groupIds = [];
    }
    if (message.entitledKeys) {
      obj.entitledKeys = message.entitledKeys.map((e) => (e ? WidevinePsshData_EntitledKey.toJSON(e) : undefined));
    } else {
      obj.entitledKeys = [];
    }
    message.videoFeature !== undefined && (obj.videoFeature = message.videoFeature);
    message.algorithm !== undefined && (obj.algorithm = widevinePsshData_AlgorithmToJSON(message.algorithm));
    message.provider !== undefined && (obj.provider = message.provider);
    message.trackType !== undefined && (obj.trackType = message.trackType);
    message.policy !== undefined && (obj.policy = message.policy);
    message.groupedLicense !== undefined &&
      (obj.groupedLicense = base64FromBytes(message.groupedLicense !== undefined ? message.groupedLicense : Buffer.alloc(0)));
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<WidevinePsshData>, I>>(object: I): WidevinePsshData {
    const message = createBaseWidevinePsshData();
    message.keyIds = object.keyIds?.map((e) => e) || [];
    message.contentId = object.contentId ?? Buffer.alloc(0);
    message.cryptoPeriodIndex = object.cryptoPeriodIndex ?? 0;
    message.protectionScheme = object.protectionScheme ?? 0;
    message.cryptoPeriodSeconds = object.cryptoPeriodSeconds ?? 0;
    message.type = object.type ?? 0;
    message.keySequence = object.keySequence ?? 0;
    message.groupIds = object.groupIds?.map((e) => e) || [];
    message.entitledKeys = object.entitledKeys?.map((e) => WidevinePsshData_EntitledKey.fromPartial(e)) || [];
    message.videoFeature = object.videoFeature ?? '';
    message.algorithm = object.algorithm ?? 0;
    message.provider = object.provider ?? '';
    message.trackType = object.trackType ?? '';
    message.policy = object.policy ?? '';
    message.groupedLicense = object.groupedLicense ?? Buffer.alloc(0);
    return message;
  }
};

function createBaseWidevinePsshData_EntitledKey(): WidevinePsshData_EntitledKey {
  return {
    entitlementKeyId: Buffer.alloc(0),
    keyId: Buffer.alloc(0),
    key: Buffer.alloc(0),
    iv: Buffer.alloc(0),
    entitlementKeySizeBytes: 0
  };
}

export const WidevinePsshData_EntitledKey = {
  encode(message: WidevinePsshData_EntitledKey, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.entitlementKeyId.length !== 0) {
      writer.uint32(10).bytes(message.entitlementKeyId);
    }
    if (message.keyId.length !== 0) {
      writer.uint32(18).bytes(message.keyId);
    }
    if (message.key.length !== 0) {
      writer.uint32(26).bytes(message.key);
    }
    if (message.iv.length !== 0) {
      writer.uint32(34).bytes(message.iv);
    }
    if (message.entitlementKeySizeBytes !== 0) {
      writer.uint32(40).uint32(message.entitlementKeySizeBytes);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): WidevinePsshData_EntitledKey {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    const end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseWidevinePsshData_EntitledKey();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      case 1:
        message.entitlementKeyId = reader.bytes() as Buffer;
        break;
      case 2:
        message.keyId = reader.bytes() as Buffer;
        break;
      case 3:
        message.key = reader.bytes() as Buffer;
        break;
      case 4:
        message.iv = reader.bytes() as Buffer;
        break;
      case 5:
        message.entitlementKeySizeBytes = reader.uint32();
        break;
      default:
        reader.skipType(tag & 7);
        break;
      }
    }
    return message;
  },

  fromJSON(object: any): WidevinePsshData_EntitledKey {
    return {
      entitlementKeyId: isSet(object.entitlementKeyId) ? Buffer.from(bytesFromBase64(object.entitlementKeyId)) : Buffer.alloc(0),
      keyId: isSet(object.keyId) ? Buffer.from(bytesFromBase64(object.keyId)) : Buffer.alloc(0),
      key: isSet(object.key) ? Buffer.from(bytesFromBase64(object.key)) : Buffer.alloc(0),
      iv: isSet(object.iv) ? Buffer.from(bytesFromBase64(object.iv)) : Buffer.alloc(0),
      entitlementKeySizeBytes: isSet(object.entitlementKeySizeBytes) ? Number(object.entitlementKeySizeBytes) : 0
    };
  },

  toJSON(message: WidevinePsshData_EntitledKey): unknown {
    const obj: any = {};
    message.entitlementKeyId !== undefined &&
      (obj.entitlementKeyId = base64FromBytes(message.entitlementKeyId !== undefined ? message.entitlementKeyId : Buffer.alloc(0)));
    message.keyId !== undefined && (obj.keyId = base64FromBytes(message.keyId !== undefined ? message.keyId : Buffer.alloc(0)));
    message.key !== undefined && (obj.key = base64FromBytes(message.key !== undefined ? message.key : Buffer.alloc(0)));
    message.iv !== undefined && (obj.iv = base64FromBytes(message.iv !== undefined ? message.iv : Buffer.alloc(0)));
    message.entitlementKeySizeBytes !== undefined && (obj.entitlementKeySizeBytes = Math.round(message.entitlementKeySizeBytes));
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<WidevinePsshData_EntitledKey>, I>>(object: I): WidevinePsshData_EntitledKey {
    const message = createBaseWidevinePsshData_EntitledKey();
    message.entitlementKeyId = object.entitlementKeyId ?? Buffer.alloc(0);
    message.keyId = object.keyId ?? Buffer.alloc(0);
    message.key = object.key ?? Buffer.alloc(0);
    message.iv = object.iv ?? Buffer.alloc(0);
    message.entitlementKeySizeBytes = object.entitlementKeySizeBytes ?? 0;
    return message;
  }
};

function createBaseFileHashes(): FileHashes {
  return { signer: Buffer.alloc(0), signatures: [] };
}

export const FileHashes = {
  encode(message: FileHashes, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.signer.length !== 0) {
      writer.uint32(10).bytes(message.signer);
    }
    for (const v of message.signatures) {
      FileHashes_Signature.encode(v!, writer.uint32(18).fork()).ldelim();
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): FileHashes {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    const end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFileHashes();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      case 1:
        message.signer = reader.bytes() as Buffer;
        break;
      case 2:
        message.signatures.push(FileHashes_Signature.decode(reader, reader.uint32()));
        break;
      default:
        reader.skipType(tag & 7);
        break;
      }
    }
    return message;
  },

  fromJSON(object: any): FileHashes {
    return {
      signer: isSet(object.signer) ? Buffer.from(bytesFromBase64(object.signer)) : Buffer.alloc(0),
      signatures: Array.isArray(object?.signatures) ? object.signatures.map((e: any) => FileHashes_Signature.fromJSON(e)) : []
    };
  },

  toJSON(message: FileHashes): unknown {
    const obj: any = {};
    message.signer !== undefined && (obj.signer = base64FromBytes(message.signer !== undefined ? message.signer : Buffer.alloc(0)));
    if (message.signatures) {
      obj.signatures = message.signatures.map((e) => (e ? FileHashes_Signature.toJSON(e) : undefined));
    } else {
      obj.signatures = [];
    }
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<FileHashes>, I>>(object: I): FileHashes {
    const message = createBaseFileHashes();
    message.signer = object.signer ?? Buffer.alloc(0);
    message.signatures = object.signatures?.map((e) => FileHashes_Signature.fromPartial(e)) || [];
    return message;
  }
};

function createBaseFileHashes_Signature(): FileHashes_Signature {
  return { filename: '', testSigning: false, SHA512Hash: Buffer.alloc(0), mainExe: false, signature: Buffer.alloc(0) };
}

export const FileHashes_Signature = {
  encode(message: FileHashes_Signature, writer: _m0.Writer = _m0.Writer.create()): _m0.Writer {
    if (message.filename !== '') {
      writer.uint32(10).string(message.filename);
    }
    if (message.testSigning === true) {
      writer.uint32(16).bool(message.testSigning);
    }
    if (message.SHA512Hash.length !== 0) {
      writer.uint32(26).bytes(message.SHA512Hash);
    }
    if (message.mainExe === true) {
      writer.uint32(32).bool(message.mainExe);
    }
    if (message.signature.length !== 0) {
      writer.uint32(42).bytes(message.signature);
    }
    return writer;
  },

  decode(input: _m0.Reader | Uint8Array, length?: number): FileHashes_Signature {
    const reader = input instanceof _m0.Reader ? input : new _m0.Reader(input);
    const end = length === undefined ? reader.len : reader.pos + length;
    const message = createBaseFileHashes_Signature();
    while (reader.pos < end) {
      const tag = reader.uint32();
      switch (tag >>> 3) {
      case 1:
        message.filename = reader.string();
        break;
      case 2:
        message.testSigning = reader.bool();
        break;
      case 3:
        message.SHA512Hash = reader.bytes() as Buffer;
        break;
      case 4:
        message.mainExe = reader.bool();
        break;
      case 5:
        message.signature = reader.bytes() as Buffer;
        break;
      default:
        reader.skipType(tag & 7);
        break;
      }
    }
    return message;
  },

  fromJSON(object: any): FileHashes_Signature {
    return {
      filename: isSet(object.filename) ? String(object.filename) : '',
      testSigning: isSet(object.testSigning) ? Boolean(object.testSigning) : false,
      SHA512Hash: isSet(object.SHA512Hash) ? Buffer.from(bytesFromBase64(object.SHA512Hash)) : Buffer.alloc(0),
      mainExe: isSet(object.mainExe) ? Boolean(object.mainExe) : false,
      signature: isSet(object.signature) ? Buffer.from(bytesFromBase64(object.signature)) : Buffer.alloc(0)
    };
  },

  toJSON(message: FileHashes_Signature): unknown {
    const obj: any = {};
    message.filename !== undefined && (obj.filename = message.filename);
    message.testSigning !== undefined && (obj.testSigning = message.testSigning);
    message.SHA512Hash !== undefined && (obj.SHA512Hash = base64FromBytes(message.SHA512Hash !== undefined ? message.SHA512Hash : Buffer.alloc(0)));
    message.mainExe !== undefined && (obj.mainExe = message.mainExe);
    message.signature !== undefined && (obj.signature = base64FromBytes(message.signature !== undefined ? message.signature : Buffer.alloc(0)));
    return obj;
  },

  fromPartial<I extends Exact<DeepPartial<FileHashes_Signature>, I>>(object: I): FileHashes_Signature {
    const message = createBaseFileHashes_Signature();
    message.filename = object.filename ?? '';
    message.testSigning = object.testSigning ?? false;
    message.SHA512Hash = object.SHA512Hash ?? Buffer.alloc(0);
    message.mainExe = object.mainExe ?? false;
    message.signature = object.signature ?? Buffer.alloc(0);
    return message;
  }
};

declare let self: any | undefined;
declare let window: any | undefined;
declare let global: any | undefined;
const tsProtoGlobalThis: any = (() => {
  if (typeof globalThis !== 'undefined') {
    return globalThis;
  }
  if (typeof self !== 'undefined') {
    return self;
  }
  if (typeof window !== 'undefined') {
    return window;
  }
  if (typeof global !== 'undefined') {
    return global;
  }
  throw 'Unable to locate global object';
})();

function bytesFromBase64(b64: string): Uint8Array {
  if (tsProtoGlobalThis.Buffer) {
    return Uint8Array.from(tsProtoGlobalThis.Buffer.from(b64, 'base64'));
  } else {
    const bin = tsProtoGlobalThis.atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; ++i) {
      arr[i] = bin.charCodeAt(i);
    }
    return arr;
  }
}

function base64FromBytes(arr: Uint8Array): string {
  if (tsProtoGlobalThis.Buffer) {
    return tsProtoGlobalThis.Buffer.from(arr).toString('base64');
  } else {
    const bin: string[] = [];
    arr.forEach((byte) => {
      bin.push(String.fromCharCode(byte));
    });
    return tsProtoGlobalThis.btoa(bin.join(''));
  }
}

type Builtin = Date | Function | Uint8Array | string | number | boolean | undefined; //eslint-disable-line

export type DeepPartial<T> = T extends Builtin
  ? T
  : T extends Long
  ? string | number | Long
  : T extends Array<infer U>
  ? Array<DeepPartial<U>>
  : T extends ReadonlyArray<infer U>
  ? ReadonlyArray<DeepPartial<U>>
  : T extends {} //eslint-disable-line
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : Partial<T>;

type KeysOfUnion<T> = T extends T ? keyof T : never;
export type Exact<P, I extends P> = P extends Builtin
  ? P
  : P & { [K in keyof P]: Exact<P[K], I[K]> } & { [K in Exclude<keyof I, KeysOfUnion<P>>]: never };

if (_m0.util.Long !== Long) {
  _m0.util.Long = Long as any;
  _m0.configure();
}

function isSet(value: any): boolean {
  return value !== null && value !== undefined;
}