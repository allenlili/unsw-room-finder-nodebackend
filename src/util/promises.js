// @flow

export type Result<A>
    = { ok: true, value: A }
    | { ok: false, error: Error }

/**
 * Map a promise to it's result.
 * @param {Promise<A>} promise promise eventuating to A
 * @returns {Promise<Result<A>>} promise eventuating to the Result<A>
 */
export function promiseToResult <A> (promise: Promise<A>): Promise<Result<A>> {
    return promise.then(
        value => ({ ok: true, value }),
        error => ({ ok: false, error }),
    );
}
