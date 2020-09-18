import { encodeURIComponentEx, encodeURIPath } from './utils'

declare type GcpUrlSignerV4Resolver =  () => PromiseLike<GcpUrlSignV4Key>

export const urlSignV4Factory = (resolver: GcpUrlSignerV4Resolver) => ({
    getSignedUrl: (bucket: string, file: string, config: GcpUrlSignV4Options) => GcpUrlSignerV4(resolver, config, bucket, file)
})

declare type Kvp = [string, string|number]

export interface GcpUrlSignV4Options {
    extensionHeaders?: object,
    contentMd5?: string,
    contentType?: string,
    queryParams: object,
    method: string,
    expiration: number,

}

export interface GcpUrlSignV4Key {
    clientEmail: string,
    digest: (hash:string) => PromiseLike<string>,
    sign: (payload:string) => PromiseLike<string>
}

const algorithm = 'GOOG4-RSA-SHA256'

async function GcpUrlSignerV4 (resolver: GcpUrlSignerV4Resolver, config: GcpUrlSignV4Options, bucket: string, file: string) {
    const host = `${bucket}.storage.googleapis.com`
    const headers: { [s: string]: any } = {
        ...config.extensionHeaders,
        host,
        'content-md5': config.contentMd5,
        'content-type': config.contentType
    }
    const sortedHeaders = getSortedHeaders(headers)
    const signedHeaders = sortedHeaders.map(kvp => kvp[0]).join(';')
    const extensionHeadersString = sortedHeaders.map(([headerName, value]) => `${headerName}:${value}\n`).join('')
    const timestamp = getTimestamp()
    const credentialScope = `${timestamp.substr(0, 8)}/auto/storage/goog4_request`
    const expiration = config.expiration || 604800
    const resourcePath = encodeURIPath(`/${file}`)
    const method = config.method || 'PUT'
    const queryParams = config.queryParams
    const contentSha256 = headers['x-goog-content-sha256'] || 'UNSIGNED-PAYLOAD'

    const resolved = await resolver()

    const queryString = merge(
        [
            ['X-Goog-Algorithm', algorithm],
            ['X-Goog-Credential', encodeURIComponentEx(`${resolved.clientEmail}/${credentialScope}`)],
            ['X-Goog-Date', timestamp],
            ['X-Goog-Expires', expiration],
            ['X-Goog-SignedHeaders', encodeURIComponentEx(signedHeaders)]
        ],
        queryParams
    ).map(([key, value]) => `${key}=${value}`).join('&')

    const hash = await resolved.digest(`${method}\n${resourcePath}\n${queryString}\n${extensionHeadersString}\n${signedHeaders}\n${contentSha256}`)
    const signature = await resolved.sign(`${algorithm}\n${timestamp}\n${credentialScope}\n${hash}`)
    return `https://${host}${resourcePath}?${queryString}&x-goog-signature=${encodeURIComponent(signature)}`
}

const getSortedHeaders = (headers:object) => (<Kvp[]> Object
    .entries<any>(headers)
    .map(kvp => kvp[1] !== undefined ? [kvp[0].toLowerCase(), `${kvp[1]}`.trim().replace(/\s{2,}/g, ' ')] : undefined)
    .filter(v => v!==undefined))
    .sort((a,b) => a[0].localeCompare(b[0]))

const merge = (q1:Kvp[], q2?:object)  => !q2
    ? q1
    : [
        ...q1,
        ...(<Kvp[]>Object.entries(q2).map(kvp => [encodeURIComponentEx(kvp[0]), encodeURIComponentEx(kvp[1])]))
    ].sort((a, b) => (a[0] < b[0] ? -1 : 1))

const getTimestamp = () => new Date().toISOString().replace(/[-:]/g, '').replace(/\.[0-9]*/, '')
