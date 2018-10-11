// @flow
import type {
    Action
} from '~/service/dispatcher/types';

import type {
    Context
} from '~/service/dispatcher/context';

/**
 * Sends a response to the user, informing them that their message cannot be processed.
 * @param {string} type application context
 * @param {string} field user action
 * @returns {Promise<void>} promise eventuating to void
 */
function handler (type: string, field: string) {
    return function (context: Context, action: Action): Promise <void> {
        context.log('warn', `Unknown ${type}`);
        context.log('warn', (action: Object)[field]);
        return Promise.resolve();
    };
}

export const unknownEvent = handler('event', 'event');
export const unknownMessage = handler('message', 'message');
export const unknownPostback = handler('postback', 'postback');
