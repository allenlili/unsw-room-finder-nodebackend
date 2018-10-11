// @flow
import { getDatabase } from '~/plugins/database';
import { getLogger } from '~/plugins/logger';

import type { Database } from '~/service/database';
import type { Event, Message, PostbackType } from '~/service/facebook/types';
import {
    parseEvent,
    parseMessage,
    parsePostBack,
    getSenderId,
    getLocation,
} from '~/service/facebook/event';

import type { Action } from '~/service/dispatcher/types';
import dispatch, { makeContext } from '~/service/dispatcher';

import { process } from '~/service/nlp';

import type { Exit, Request, Response } from '~/util/http';
import type { Result } from '~/util/promises';
import { promiseToResult } from '~/util/promises';

/**
 * Entry point into the webhook request; an async request handler
 * @param {Request} request request object
 * @param {Request} response response object
 * @returns {Promise<Exit>} promise eventuating to Exit
 */
export default async function (request: Request, response: Response): Promise<Exit> {
    const logger = getLogger(request);
    const events = Array.from(parseEvent(request));
    const database = getDatabase(request);

    // for every event from the messenger API, do the following.
    //
    //   1. Idenfity the Action that responds to the event.
    //   2. Dispatch that action.
    //   3. With the action outcome, result generate a result,
    //      and log any failed requests.
    const results: Array<Result<void>> =
        await Promise.all(events
            .map(e => forEvent(database, e).then(action => [e, action]))
            .map(p => p.then(e => withRequestDispatch(request, ...e)))
            .map(p => promiseToResult(p)));

    // Log any unsucessful event handlers
    results.forEach(msg => forError(logger, msg));

    return { type: 'reply', status: 200 };
}

/**
 * Function to determine the appropriate action to take, based on an event.
 * @param {Database} database database object
 * @param {Event} eventMessage object containing the event message itself
 * @returns {Promise<Action>} promise eventuating to Action
 */
async function forEvent (database: Database, eventMessage: Event): Promise<Action> {
    switch (eventMessage.type) {
        case 'read': return { type: 'ignore' };
        case 'delieved': return { type: 'ignore' };
        case 'postback':
            return forPostback(parsePostBack(eventMessage).payload);
        case 'message':
            return forMessage(database, parseMessage(eventMessage));
        default:
            return { type: 'unknown/event', event: eventMessage };
    }
}

/**
 * Function to determine the appropriate action to take, based on a postback.
 * @param {PostbackType} payload postback payload object
 * @returns {Action} Action object that defines what to do
 */
function forPostback (payload: PostbackType): Action {
    switch (payload.type) {
        case 'INIT':
            return { type: 'goto/start' };

        case 'HELP':
            return { type: 'goto/help' };

        case 'REPORT/GENERIC':
            return { type: 'goto/issueOther' };

        case 'REPORT/ROOM_INFO':
            return { type: 'goto/issueRoom' };

        case 'ROOM/RANDOM':
            return { type: 'goto/roomRandom' };

        case 'ROOM/CHOOSE/1':
            return { type: 'goto/roomChoose/1' };

        case 'ROOM/CHOOSE/2': {
            const { time } = payload;
            return { type: 'goto/roomChoose/2', time };
        }

        case 'ROOM/CHOOSE/4':
            return { type: 'goto/roomChoose/4', offsetChange: payload.offsetChange };

        case 'ROOM/CHOOSE/5': {
            const sentDate = new Date(payload.sentDate);
            const index = payload.index;
            return { type: 'goto/roomChoose/5', sentDate, index };
        }

        /* the location is no specified by postback */
        case 'ROOM/CHOOSE/3/no-location':
            return { type: 'goto/roomChoose/3', location: null };

        case 'CONFIRM/BOOKING': {
            const sentDate = new Date(payload.sentDate);
            return { type: 'goto/bookingConfirmation', sentDate };
        }

        default:
            return { type: 'unknown/postback', postback: payload };
    }
}

/**
 * This is an async function as it checks the database to see if there were any follow ups specified for this function.
 * @param {Database} database database object
 * @param {Message} message original Facebook message
 * @returns {Promise<Action>} promise eventuating to Action
 */
async function forMessage (database: Database, message: Message): Promise<Action> {
    const senderId = getSenderId(message);
    const followUp = await getStateFollowUp(database, senderId);

    /* if there was a follow specified use these branches */
    if (followUp != null) return forMessageFollowup(message, followUp);

    switch (message.type) {
        /* extract the payload from the quick reply */
        case 'quick-reply':
            return forPostback(message.payload);

        /* perform natural language processing */
        case 'text':
            return process(message);

        /* instead of throwing an error, we'll just pass an action to the dispatcher */
        default:
            return { type: 'unknown/message', message: message };
    }
}

/**
 * Follow up logic is for when an action requests input for the user to action upon that cannot be in the form of a postback.
 * @param {Message} message original Facebook message
 * @param {string} followUp state in which the message was left after the last message
 * @returns {Action} Action object that defines what to do
 */
function forMessageFollowup (message: Message, followUp: string): Action {
    console.log(followUp, message.type);
    switch (message.type) {
        /* chances are if a follow up was specified we can ignore it, here
         * as the user clicked a quick reply which has it's own explict meaning */
        case 'quick-reply':
            return forPostback(message.payload);

        /* no break used here, as every branch exits the function */
        case 'location':
            switch (followUp) {
                // picks location for 3rd step of the room finding process
                case 'goto/roomChoose/3': {
                    const location = getLocation(message);
                    return { type: 'goto/roomChoose/3', location };
                }

                // TODO implement an action for this
                default:
                    throw new TypeError(`unknown follow up, '${followUp}`);
            }

        /* look for a free text follow up */
        case 'text':
            switch (followUp) {
                case 'goto/issueRoom/followUp':
                    return { type: 'goto/issueRoom/followUp', message };

                case 'goto/issueOther/followUp':
                    return { type: 'goto/issueRoom/followUp', message };

                // TODO implement an action for this
                default:
                    throw new TypeError(`unknown follow up, '${followUp}`);
            }

        /* ideally every throwing branch would do this too */
        default:
            return { type: 'unknown/message', message: message };
    }
}

/**
 * Function to determine the appropriate action to take, based on an error.
 * @param {Request} request request object
 * @param {Event} event object containing the complete event
 * @param {Action} action user action
 * @returns {Promise<void>} promise eventuating to void
 */
function withRequestDispatch (request: Request, event: Event, action: Action): Promise<void> {
    const context = makeContext(event, request);
    return dispatch(context, action);
}

/**
 * Function to determine the appropriate action to take, based on an error.
 * @param {Logger} logger logger object
 * @param {Result<any>} result object that contains error data, or not
 * @returns {null} empty return if required
 */
function forError (logger, result: Result<any>) {
    if (result.error == null) return;
    console.error(result.error);
}

/**
 * This is an async function as it checks the database to see if there were any follow ups specified for this function.
 * @param {Database} database database object
 * @param {string} senderId sender (Facebook) id
 * @returns {Promise<?string>} promise eventuating to string
 */
function getStateFollowUp (database: Database, senderId: string): Promise<?string> {
    const UserTable = database.getTable('user');
    const StateTable = database.getTable('state');

    return database.transaction(async (t) => {
        const findUser = { where: { facebook_id: senderId } };
        const maybeUser: ?Object = await UserTable.findOne(findUser, { transaction: t });
        if (maybeUser == null) return null;

        const userId = maybeUser.get('id');
        const mostRecentState = {
            where: { user_id: userId },
            order: [['created', 'DESC']],
        };
        const userState = await StateTable.findOne(mostRecentState, { transaction: t });
        if (userState == null) return null;

        return userState.get('data').followUp || null;
    });
}
