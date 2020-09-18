import querystring, {ParsedUrlQueryInput, } from 'querystring'

export const encodeURIComponentEx = ((uriReplace:{[x:string]:string}, regex: RegExp) => (str:string) => encodeURIComponent(str).replace(regex, c => uriReplace[c]))(
    { '!': '%21', '\'': '%27', '(': '%28', ')': '%29', '*': '%2A' },
    /[!'()*]/g
)

export const queryStringify = (options => (qs:ParsedUrlQueryInput) => querystring.stringify(qs, '&', '=', options))(
    { encodeURIComponent: encodeURIComponentEx }
)

export function buildUrl (base:string, path:string, search:ParsedUrlQueryInput) {
    const signedUrl = new URL(path, base)
    signedUrl.search = queryStringify(search)
    return signedUrl.href
}

/**
 * Encodes the URI component but ignores the forward-slash
 * @param path
 * @returns {string}
 */
export const encodeURIPath = (path:string) => encodeURIComponentEx(path).replace(/%2F/, '/')
