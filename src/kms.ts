export interface GcpKmsFactoryOptions<TKeyType> {
    readonly fetch: typeof fetch,
    readonly projectName: number,
    readonly decoder: (body: GcpKmsPublicKeyResponseBody) => PromiseLike<TKeyType>,
}

export interface GcpKmsPublicKeyResponseBody {
    pem: string,
    algorithm: string,
    pemCrc32c: string,
    name: string
}

export function kmsFactory<TKeyType> ({fetch, projectName, decoder} : GcpKmsFactoryOptions<TKeyType>) {
    const base = `https://cloudkms.googleapis.com/v1/${projectName}/cryptoKeyVersions/`
    const getUrl = (path: string) => new URL(path, base).toString()
    return {
        getPublicKey: async (version: string): Promise<TKeyType> => {
            const response = await fetch(getUrl(`${version}/publicKey`), {method: 'GET'})
            if (response.ok) {
                return decoder(await response.json())
            }
            throw new Error(`failed to get public key ${response.status}\n${await response.text()}`)
        }
    }
}
