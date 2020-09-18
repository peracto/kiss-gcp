const now = () => Math.floor(Date.now() / 1000)
const GOOGLE_TOKEN_URL = 'https://www.googleapis.com/oauth2/v4/token'

export function gcpAuthFactory (options: GcpAuthFactoryOptions) {
    return _gcpAuthFactory({
        scope: 'https://www.googleapis.com/auth/cloud-platform',
        ttl: 3600, // 1 hour
        renew: 300, // 5 minutes, we will trigger a refresh {renew} seconds before token expiry
        fetch: fetch,
        ...options,
    })
}

export interface GcpAuthFactoryOptions {
    readonly fetch?: typeof fetch,
    readonly renew?: number,
    readonly sign: (cb: (email:string) => GcpAuthResponse) => PromiseLike<GcpAuthResponse>,
    readonly ttl?: number,
    readonly scope?: string
}

export interface GcpAuthResponse {
    readonly iss: string,
    readonly aud: string,
    readonly exp: number,
    readonly iat: number,
    readonly scope: string
}

function _gcpAuthFactory ({fetch, renew, sign, ttl, scope} : Required<GcpAuthFactoryOptions>) {
    let expires = 0
    let promise: PromiseLike<string>
    let loading = false

    return () => {
        if (!loading && now() > expires) {
            loading = true
            promise = getToken()
        }
        return promise
    }

    function createPayload(iss: string) : GcpAuthResponse {
        const iat = now()
        return {iss, aud: GOOGLE_TOKEN_URL, exp: iat + ttl, iat, scope}
    }

    async function getToken() {
        const response = await fetch(
            GOOGLE_TOKEN_URL,
            makeOptions(await sign(createPayload))
        )

        const token = await response.json()

        if (!response.ok) {
            throw new Error(JSON.stringify(token))
        }
        const auth = `${token.token_type} ${token.access_token}`
        expires = now() + (token.expires_in || 0) - renew
        promise = Promise.resolve(auth)
        loading = false
        return auth
    }
}

function makeOptions (assertion: GcpAuthResponse) {
    return {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion })
    }
}
