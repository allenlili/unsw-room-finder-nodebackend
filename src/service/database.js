// @flow
import Sequelize from 'sequelize';

import type { ModelName, Model } from '~/service/database/types';
import createModels from '~/service/database/models';


//////////////////////////////////////////////////////////////////////////


type QueryReplacements = Array<string> | Object;
type QueryConfig = {
    type: any,
    replacements?: QueryReplacements,
};

type TransactionFn<T> = (t: Object) => Promise<T>


//////////////////////////////////////////////////////////////////////////


/*
 * Wrapper around sequelize.
 */
export class Database {
    _connection: Sequelize;
    _models: Map<ModelName, Object>;

    constructor (connection: Sequelize, models: Map<ModelName, Object>) {
        this._connection = connection;
        this._models = models;
    }

    /**
     * Just makes sure the database is ready to go.
     */
    async init () {
        await this._connection.authenticate();
    }

    /**
     * Get a database table model.
     * @param {ModelName} name name of the database table
     * @returns {Object} the database table model
     */
    getTable (name: ModelName): Object {
        const model = this._models.get(name);
        if (model == null) throw new TypeError('undefined model');
        return model;
    }

    /**
     * Perform a SELECT query on the database.
     * @param {string} sql sql statement to run the query with
     * @param {?QueryReplacements} replacements replacements for the query string
     * @returns {Promise<Array<Model<any>>>} promise eventuating to Promise<Array<Model<any>>>
     */
    query (sql: string, replacements: ?QueryReplacements = null): Promise<Array<Model<any>>> {
        const config: QueryConfig = { type: Sequelize.QueryTypes.SELECT };
        if (replacements != null) config.replacements = replacements;
        return this._connection.query(sql, config);
    }

    getConnection () {
        return this._connection;
    }

    transaction (f: TransactionFn<any>, t: ?Object): Promise<any> {
        return t ? f(t) : this._connection.transaction(f);
    }
}

/**
 * Create a new database connection, with specific config.
 * @param {Object} config config for the new db connection
 * @param {?Object} logger logger object
 * @returns {Database} promise eventuating to Promise<Array<Model<any>>>
 */
export default function (config: Object, logger: ?Object): Database {
    if (config == null) throw new TypeError('missing config');
    if (config.db == null) throw new TypeError('no database config');

    const database = config.db.DATABASE;
    const username = config.db.USERNAME;
    const password = config.db.PASSWORD;
    const host = config.db.HOST;

    const sequlizeConfig: Object = {
        host,
        dialect: 'postgres',
        pool: { max: 5, min: 0, idle: 10000 },
    };

    if (logger != null) {
        const captured = logger;
        sequlizeConfig.logging = text => captured.debug(text);
    }

    const connection = new Sequelize(database, username, password, sequlizeConfig);

    const models = createModels(connection);

    return new Database(connection, models);
}
