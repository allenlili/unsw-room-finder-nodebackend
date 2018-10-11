// @flow
import type { Request, Response, NextFn } from '~/util/http';
import type { Config } from '~/service/config/types';

const configLocation = Symbol('config location');

/**
 * Utility to get the config
 * @param {Request} request request object
 * @returns {Config} the requested config object
 */
export function getConfig (request: Request): Config {
    return (request: any)[configLocation];
}

/**
 * Sets the config to a symbol field so it's only accessible via the function getConfig.
 * @param {Config} config configuration object
 */
export default function (config: Config) {
    return function (request: Request, response: Response, next: NextFn) {
        (request: any)[configLocation] = config;
        next();
    };
}
