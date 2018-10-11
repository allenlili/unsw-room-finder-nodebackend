// @flow
import getLogger from '~/plugins/logger';

export type Exit
    /*
     * This means the response has not been replied to
     * so what this will do is close the request, set
     * the status and optionally write something.
     */
    = { type: 'reply', status: number, end?: string }
    /*
     * A do nothing exit likley means the response was
     * already performed, and so the exit handler just
     * does nothing.
     */
    | { type: 'do-nothing' }

/*
 * Type mapping for the restify response value.
 */
export interface Response {
    status (status: number): void;
    send (content: string): void;
    end (content?: string): void;
}

/*
 * Type mapping for restify requests.
 */
export type Request = {
    body?: Object,
    query?: Object,
    method: string,
    headers: Object,
};

/*
 * Type mapping for the restify next function.
 */
export type NextFn = () => void;

export type AsyncHandler = (request: Request, response: Response) => Promise<Exit>;
export type CallbackHandler = (request: Request, response: Response, next: NextFn) => any;

/*
 * type mapping for the restify server object.
 */
export interface Server {
    use (callback: CallbackHandler): void;
    get (url: string, callback: CallbackHandler): void;
    post (url: string, callback: CallbackHandler): void;
}

/**
 * For async handlers, wrap them with this function to ensure they log on failure if not done properly. Additionally this ensures the async handlers end the request and set a status.
 * @param {AsyncHandler} routeHandler handler that deals with routing
 * @returns {CallbackHandler} handler that deals with callbacks
 */
export function asyncHandler (routeHandler: AsyncHandler): CallbackHandler {
    return function (request: Request, response: Response, next: NextFn): void {
        const onError = error => {
            const logger = getLogger(request);
            logger.error(error);
            response.status(500);
            response.end();
            next();
        };

        const onFinish = (exit) => {
            switch (exit.type) {
                case 'reply':
                    response.status(exit.status);
                    response.end(exit.end);
                    return next();
                case 'do-nothing':
                    return;
                default:
                    throw new Error('Unhandled request');
            }
        };

        routeHandler.call(this, request, response).then(onFinish).catch(onError);
    };
}
