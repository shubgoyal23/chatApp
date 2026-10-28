import conf from "../constance/conf";

export class ApiError extends Error {
   constructor(message, status, errors) {
      super(message);
      this.status = status;
      this.errors = errors;
   }
}

let refreshing = null;

// Exchanges the refresh-token cookie for a new access token. Concurrent
// callers share one request.
export const refreshSession = () => {
   refreshing ??= fetch(`${conf.API_URL}/users/refresh-token`, {
      method: "POST",
      credentials: "include",
   })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
         setTimeout(() => (refreshing = null), 0);
      });
   return refreshing;
};

/**
 * Calls the REST API and returns the response's `data`.
 * Throws ApiError with a user-facing message on failure. For authenticated
 * calls (the default) a 401 triggers one token refresh and a retry; if that
 * fails the app is told the session has expired.
 */
export async function api(path, { method, body, form, auth = true, retry = true } = {}) {
   let res;
   try {
      res = await fetch(`${conf.API_URL}${path}`, {
         method: method ?? (body || form ? "POST" : "GET"),
         credentials: "include",
         headers: body ? { "Content-Type": "application/json" } : undefined,
         body: body ? JSON.stringify(body) : form,
      });
   } catch {
      throw new ApiError("Can't reach the server. Check your connection.", 0);
   }

   let json = null;
   try {
      json = await res.json();
   } catch {
      // non-JSON error page from a proxy
   }

   if (res.status === 401 && auth) {
      if (retry && (await refreshSession())) {
         return api(path, { method, body, form, auth, retry: false });
      }
      window.dispatchEvent(new Event("auth:expired"));
   }

   if (!res.ok || json?.success === false) {
      const fallback =
         res.status === 429
            ? "Too many attempts. Please wait a moment."
            : `Something went wrong (${res.status})`;
      throw new ApiError(json?.message || fallback, res.status, json?.errors);
   }
   return json?.data;
}
