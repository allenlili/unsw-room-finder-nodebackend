const logLocation = Symbol('log location');

/**
 * Utility to get the logger
 * @param {Request} request request object
 * @returns {Logger} the requested logger object
 */
export function getLogger (request) {
    return request[logLocation];
}

/**
 * Sets the logger to a symbol field so it's only accessible via the function getLogger.
 * @param {Logger} logger logger object
 */
export default function (logger) {
    return function (req, res, next) {
        req[logLocation] = logger;
        next();
    };
}
