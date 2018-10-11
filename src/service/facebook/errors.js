export class BaseError extends Error {
    constructor (...args) {
        super(...args);
        Error.captureStackTrace(this, BaseError);
    }
}

export class FailedRequest extends BaseError {
    constructor (data, status, ...args) {
        super(...args);
        this.status = status;
        this.data = data;
    }

    /**
     * Attach the user to the error
     * @param {string} userId current user ID
     * @param {Object} error error object with data
     * @returns {Object} error with user data attached
     */
    static fromError (userId, error) {
        const o = new UserError(userId);
        Object.assign(o, error);
        return error;
    }
}

export class UserError extends BaseError {
    constructor (userId, ...args) {
        super(...args);
        this.userId = userId;
    }

    /**
     * Attach the user to the error
     * @param {string} userId current user ID
     * @param {Object} error error object with data
     * @returns {Object} error with user data attached
     */
    static fromError (userId, error) {
        const o = new UserError(userId);
        Object.assign(o, error);
        return error;
    }
}
