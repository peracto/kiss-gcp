# KISS-FETCH-RETRY

When fetching resources that require retry on failure ...

```js
import fetchRetryFactory from "kiss-fetch-retry";

const fetchRetry = retryFetchFactory({
  maxRetries: 5,
  fetch: fetch, 
  shouldRetry (response) {
    return [408, 429, 500, 502, 503].indexOf(response.status) === -1
      ? testErrors(getErrorPayload(response))
      : true
  }
})

function testErrors (errors) {
  if (!errors) return false
  for (const e of errors) {
    const reason = e.reason
    if (reason && (reason === 'rateLimitExceeded' || reason === 'userRateLimitExceeded' )) return true
  }
  return false
}

function getErrorPayload (response) {
  try {
    return JSON.parse(response.body).error.errors
  } catch (e) {
  }
}


// We can now use fetchRetry anywhere that we would have used FetchAPI.

const response = await fetchRetry('http://example.com/api/getSomething')
```
