// @flow
import type { ModelName } from '~/service/database/types';
import type { Database } from '~/service/database';
import type { Facebook, UserHandler } from '~/service/facebook';
import type { Event } from '~/service/facebook/types';
import { getSenderId } from '~/service/facebook/event';

import { getHelper as getFacebook } from '~/plugins/facebook';
import { getDatabase } from '~/plugins/database';
import { getLogger } from '~/plugins/logger';

import type { Request } from '~/util/http';


type LogLevel = 'info' | 'error' | 'debug' | 'warn';

type TransactionFn<T> = (t: Object) => Promise<T>


/*
 * Is the context of globals and datbase connections for
 * the event dispatchers.
 */
export class Context {
    _event: Event;
    _logger: Object | null;
    _database: Database;
    _facebookClient: Facebook;

    constructor (
        e: Event,
        l: Object | null,
        f: Facebook,
        d: Database,
    ) {
        this._event = e;
        this._logger = l;
        this._facebookClient = f;
        this._database = d;
    }

    /**
     * Get the Facebook ID in the current context.
     * @returns {string} the Facebook ID
     */
    get facebookId (): string {
        return getSenderId(this._event);
    }

    /**
     * Get the database in the current context.
     * @returns {Database} the database object
     */
    get database (): Database {
        return this._database;
    }

    /**
     * Get the specified table in the current context.
     * @param {ModelName} modelName name of the model in question
     * @returns {Object} the orm object for the table
     */
    getTable (modelName: ModelName): Object {
        return this._database.getTable(modelName);
    }

    /**
     * Transact the supplied function in the database specified within the context.
     * @param {TransactionFn<any>} f transaction function
     * @param {?Object} t object to be used in transaction
     * @returns {Promise<any>} promise eventuating to any
     */
    transaction (f: TransactionFn<any>, t: ?Object): Promise<any> {
        return this._database.transaction(f);
    }

    /**
     * Get the database connecton in the current context.
     * @returns {Object} the database connecton object
     */
    getDBConnection (): Object {
        return this._database.getConnection();
    }

    /**
     * Get the Facebook client in the current context.
     * @returns {UserHandler} the Facebook client user handler object
     */
    getFacebookClient (): UserHandler {
        return this._facebookClient.withSender(this.facebookId);
    }

    /**
     * Get the Facebook client in the current context.
     * @param {LogLevel} level level to log the message at
     * @param {any} message the log message itself
     * @returns {UserHandler} the Facebook client user handler object
     */
    log (level: LogLevel, message: any): void {
        if (this._logger == null) return;
        this._logger[level](message);
    }
}


/**
 * Create a new context from a request.
 * @param {Event} event event that contains data to be used to create the object
 * @param {Request} request request object
 * @returns {Context} newly created application context
 */
export default function fromRequest (event: Event, request: Request): Context {
    return new Context(
        event,
        getLogger(request),
        getFacebook(request),
        getDatabase(request),
    );
}
