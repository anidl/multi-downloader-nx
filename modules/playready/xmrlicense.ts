import { Parser } from 'binary-parser'
import * as fs from 'fs'

export class XMRLicenseStructs {
    static PlayEnablerType = new Parser().buffer('player_enabler_type', {
        length: 16
    })

    static DomainRestrictionObject = new Parser()
        .buffer('account_id', { length: 16 })
        .uint32('revision')

    static IssueDateObject = new Parser().uint32('issue_date')

    static RevInfoVersionObject = new Parser().uint32('sequence')

    static SecurityLevelObject = new Parser().uint16('minimum_security_level')

    static EmbeddedLicenseSettingsObject = new Parser().uint16('indicator')

    static ECCKeyObject = new Parser()
        .uint16('curve_type')
        .uint16('key_length')
        .buffer('key', {
            length: function () {
                return (this as any).key_length
            }
        })

    static SignatureObject = new Parser()
        .uint16('signature_type')
        .uint16('signature_data_length')
        .buffer('signature_data', {
            length: function () {
                return (this as any).signature_data_length
            }
        })

    static ContentKeyObject = new Parser()
        .buffer('key_id', { length: 16 })
        .uint16('key_type')
        .uint16('cipher_type')
        .uint16('key_length')
        .buffer('encrypted_key', {
            length: function () {
                return (this as any).key_length
            }
        })

    static RightsSettingsObject = new Parser().uint16('rights')

    static OutputProtectionLevelRestrictionObject = new Parser()
        .uint16('minimum_compressed_digital_video_opl')
        .uint16('minimum_uncompressed_digital_video_opl')
        .uint16('minimum_analog_video_opl')
        .uint16('minimum_digital_compressed_audio_opl')
        .uint16('minimum_digital_uncompressed_audio_opl')

    static ExpirationRestrictionObject = new Parser()
        .uint32('begin_date')
        .uint32('end_date')

    static RemovalDateObject = new Parser().uint32('removal_date')

    static UplinkKIDObject = new Parser()
        .buffer('uplink_kid', { length: 16 })
        .uint16('chained_checksum_type')
        .uint16('chained_checksum_length')
        .buffer('chained_checksum', {
            length: function () {
                return (this as any).chained_checksum_length
            }
        })

    static AnalogVideoOutputConfigurationRestriction = new Parser()
        .buffer('video_output_protection_id', { length: 16 })
        .buffer('binary_configuration_data', {
            length: function () {
                return (this as any).$parent.length - 16
            }
        })

    static DigitalVideoOutputRestrictionObject = new Parser()
        .buffer('video_output_protection_id', { length: 16 })
        .buffer('binary_configuration_data', {
            length: function () {
                return (this as any).$parent.length - 16
            }
        })

    static DigitalAudioOutputRestrictionObject = new Parser()
        .buffer('audio_output_protection_id', { length: 16 })
        .buffer('binary_configuration_data', {
            length: function () {
                return (this as any).$parent.length - 16
            }
        })

    static PolicyMetadataObject = new Parser()
        .buffer('metadata_type', { length: 16 })
        .buffer('policy_data', {
            length: function () {
                return (this as any).$parent.length - 16
            }
        })

    static SecureStopRestrictionObject = new Parser().buffer('metering_id', {
        length: 16
    })

    static MeteringRestrictionObject = new Parser().buffer('metering_id', {
        length: 16
    })

    static ExpirationAfterFirstPlayRestrictionObject = new Parser().uint32(
        'seconds'
    )

    static GracePeriodObject = new Parser().uint32('grace_period')

    static SourceIdObject = new Parser().uint32('source_id')

    static AuxiliaryKey = new Parser()
        .uint32('location')
        .buffer('key', { length: 16 })

    static AuxiliaryKeysObject = new Parser()
        .uint16('count')
        .array('auxiliary_keys', {
            length: 'count',
            type: XMRLicenseStructs.AuxiliaryKey
        })

    static UplinkKeyObject3 = new Parser()
        .buffer('uplink_key_id', { length: 16 })
        .uint16('chained_length')
        .buffer('checksum', {
            length: function () {
                return (this as any).chained_length
            }
        })
        .uint16('count')
        .array('entries', {
            length: 'count',
            type: new Parser().uint32('entry')
        })

    static CopyEnablerObject = new Parser().buffer('copy_enabler_type', {
        length: 16
    })

    static CopyCountRestrictionObject = new Parser().uint32('count')

    static MoveObject = new Parser().uint32('minimum_move_protection_level')

    static XMRObject = (): Parser =>
        new Parser()
            .namely('self')
            .int16('flags')
            .int16('type')
            .int32('length')
            .choice('data', {
                tag: 'type',
                choices: {
                    0x0005: XMRLicenseStructs.OutputProtectionLevelRestrictionObject,
                    0x0008: XMRLicenseStructs.AnalogVideoOutputConfigurationRestriction,
                    0x000a: XMRLicenseStructs.ContentKeyObject,
                    0x000b: XMRLicenseStructs.SignatureObject,
                    0x000d: XMRLicenseStructs.RightsSettingsObject,
                    0x0012: XMRLicenseStructs.ExpirationRestrictionObject,
                    0x0013: XMRLicenseStructs.IssueDateObject,
                    0x0016: XMRLicenseStructs.MeteringRestrictionObject,
                    0x001a: XMRLicenseStructs.GracePeriodObject,
                    0x0022: XMRLicenseStructs.SourceIdObject,
                    0x002a: XMRLicenseStructs.ECCKeyObject,
                    0x002c: XMRLicenseStructs.PolicyMetadataObject,
                    0x0029: XMRLicenseStructs.DomainRestrictionObject,
                    0x0030: XMRLicenseStructs.ExpirationAfterFirstPlayRestrictionObject,
                    0x0031: XMRLicenseStructs.DigitalAudioOutputRestrictionObject,
                    0x0032: XMRLicenseStructs.RevInfoVersionObject,
                    0x0033: XMRLicenseStructs.EmbeddedLicenseSettingsObject,
                    0x0034: XMRLicenseStructs.SecurityLevelObject,
                    0x0037: XMRLicenseStructs.MoveObject,
                    0x0039: XMRLicenseStructs.PlayEnablerType,
                    0x003a: XMRLicenseStructs.CopyEnablerObject,
                    0x003b: XMRLicenseStructs.UplinkKIDObject,
                    0x003d: XMRLicenseStructs.CopyCountRestrictionObject,
                    0x0050: XMRLicenseStructs.RemovalDateObject,
                    0x0051: XMRLicenseStructs.AuxiliaryKeysObject,
                    0x0052: XMRLicenseStructs.UplinkKeyObject3,
                    0x005a: XMRLicenseStructs.SecureStopRestrictionObject,
                    0x0059: XMRLicenseStructs.DigitalVideoOutputRestrictionObject
                },
                defaultChoice: 'self'
            })

    static XmrLicense = new Parser()
        .useContextVars()
        .buffer('signature', { length: 4 })
        .int32('xmr_version')
        .buffer('rights_id', { length: 16 })
        .array('containers', {
            type: XMRLicenseStructs.XMRObject(),
            readUntil: 'eof'
        })
}

export class XMRLicense extends XMRLicenseStructs {
    parsed: any
    _LICENSE: Parser

    constructor(
        parsed_license: any,
        license_obj: Parser = XMRLicenseStructs.XmrLicense
    ) {
        super()
        this.parsed = parsed_license
        this._LICENSE = license_obj
    }

    static loads(data: string | Buffer): XMRLicense {
        if (typeof data === 'string') {
            data = Buffer.from(data, 'base64')
        }
        if (!Buffer.isBuffer(data)) {
            throw new Error(`Expecting Bytes or Base64 input, got ${data}`)
        }

        const licence = XMRLicenseStructs.XmrLicense
        const parsed_license = licence.parse(data)
        return new XMRLicense(parsed_license, licence)
    }

    static load(filePath: string): XMRLicense {
        if (typeof filePath !== 'string') {
            throw new Error(`Expecting path string, got ${filePath}`)
        }
        const data = fs.readFileSync(filePath)
        return XMRLicense.loads(data)
    }

    dumps(): Buffer {
        return this._LICENSE.parse(this.parsed)
    }

    struct(): Parser {
        return this._LICENSE
    }

    private _locate(container: any): any {
        if (container.flags === 2 || container.flags === 3) {
            return this._locate(container.data)
        } else {
            return container
        }
    }

    *get_object(type_: number): Generator<any> {
        for (const obj of this.parsed.containers) {
            const container = this._locate(obj)
            if (container.type === type_) {
                yield container.data
            }
        }
    }

    get_content_keys(): Generator<any> {
        return this.get_object(0x000a)
    }
}
