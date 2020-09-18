import { encodeURIComponentEx, encodeURIPath } from './utils'

export interface GcpStorageFactoryOptions {
    readonly fetch: typeof fetch,
    readonly bucket: string
}

export function storageFactory ({fetch, bucket}: GcpStorageFactoryOptions) {
    const base = `https://storage.googleapis.com/storage/v1/b/${bucket}/o/`
    const getUrl = (path: string) => new URL(path, base).toString()

    return {
        create(file: string, body: BodyInit) {
            // const base = `https://storage.googleapis.com/upload/storage/v1/b/${bucket}/o/`
            return fetch(
                getUrl(`?uploadType=media&name=${file}`),
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'text/json'
                    },
                    body
                })
        },
        put(file: string, content: BodyInit, contentEncoding: string) {
            return fetch(
                getUrl(`https://storage.googleapis.com/upload/storage/v1/b/${bucket}/o/?uploadType=media&name=${encodeURIPath(file)}&contentEncoding=${encodeURIComponentEx(contentEncoding)}&predefinedAcl=publicRead`),
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'text/json'
                    },
                    body: content
                })
        },
        get(file: string) {
            return fetch(getUrl(`${encodeURIComponentEx(file)}?alt=media`), {})
        }
    }
}
