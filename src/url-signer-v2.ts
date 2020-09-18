/*
    signerV2: signerFactory(async payload => {
      const auth = await credentials()
      return {
        signature: await sign.sign(auth.public, payload),
        clientEmail: auth.clientEmail
      }
    }),
 */

import { encodeURIPath, buildUrl } from './utils'

declare type GcpUrlSignSignerV2 = (payload:string) => PromiseLike<{clientEmail:string, signature: string}>

interface GcpUrlSignSignerV2Options {
    method?: string,
    contentMd5?: string,
    contentType?: string,
    expires: number,
    extensionHeaders: object,
    queryParams: object
}

export default function storageFactory (sign:GcpUrlSignSignerV2) {
    return {
        getSignedUrl: (bucket:string, file:string, config:GcpUrlSignSignerV2Options) => getSignedUrl(sign, config, bucket, encodeURIPath(file))
    }
}

async function getSignedUrl (sign:GcpUrlSignSignerV2, config:GcpUrlSignSignerV2Options, bucket:string, encodedFile:string) {
    const auth = await sign(createPayload(
        config.method || 'PUT',
        config.contentMd5,
        config.contentType,
        config.expires,
        `${getCanonicalHeaders(config.extensionHeaders)}/${bucket}/${encodedFile}`
    ))

    return buildUrl(
        `https://${bucket}.storage.googleapis.com`,
        encodedFile,
        {
            GoogleAccessId: auth.clientEmail,
            Expires: config.expires,
            Signature: auth.signature,
            ...config.queryParams
        }
    )
}

function getCanonicalHeaders (headers:object) {
    return !headers
        ? ''
        : Object.entries(headers)
            .map(([key, value]) => [key.toLowerCase(), value])
            .sort((a, b) => a[0].localeCompare(b[0]))
            .reduce((a, v) => v[1] === undefined ? a : `${a}${v[0]}:${`${v[1]}`.trim().replace(/\s{2,}/g, ' ')}\n`, '')
}

function createPayload (method:string, md5:string|undefined, type:string|undefined, expiration:number, headers:string) {
    return `${method}\n${md5 || ''}\n${type || ''}\n${expiration}\n${headers}`
}
