// @flow
import type { Database } from '~/service/database';
import type { Request, Response, NextFn } from '~/util/http';

const databaseLocation = Symbol('database location');

/**
 * Utility to get the database
 * @param {Request} request request object
 * @returns {Database} the requested database object
 */
export function getDatabase (request: Request): Database {
    return (request: any)[databaseLocation];
}

/**
 * Sets the db object to a symbol field so it's only accessible via the function getDatabase.
 * @param {Database} database database object
 */
export default function (database: Database) {
    return function (request: Request, response: Response, next: NextFn) {
        (request: any)[databaseLocation] = database;
        next();
    };
}
