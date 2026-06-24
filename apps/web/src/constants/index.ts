/**
 * @description The key used to store the session token in the local storage.
 * @constant SESSION_TOKEN_KEY
 * @type {string}
 * @default 'token'
 * */
export const SESSION_TOKEN_KEY: string = 'token';

/**
 * @description The key used to store the last authenticated method in the local storage.
 * @constant LAST_AUTHENTICATED_METHOD
 * @type {string}
 * @default 'last_authenticated_method'
 * */
export const LAST_AUTHENTICATED_METHOD: string = 'last_authenticated_method';

/**
 * @description The key used to store the temporary organization verification flow in session storage.
 * @constant ORG_AUTH_VERIFICATION_FLOW_KEY
 * @type {string}
 * @default 'org_verification_flow_id'
 * */
export const ORG_AUTH_VERIFICATION_FLOW_KEY: string = 'org_verification_flow_id';

/**
 * @description Name of the header for the organization ID
 * @constant ORG_ID_HEADER
 * @type {string}
 * @default 'X-Zentry-Org-ID'
 * */
export const ORG_ID_HEADER: string = 'X-Zentry-Org-ID';
