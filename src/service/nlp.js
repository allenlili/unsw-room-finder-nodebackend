// @flow
import * as events from '~/service/facebook/event';
import type { MessageWithText } from '~/service/facebook/types';

import type { Action } from '~/service/dispatcher/types';
import { extractEntity } from '~/service/nlp/entity';
import bookingIntent from '~/service/nlp/intents/booking';
import directingIntent from '~/service/nlp/intents/directing';

/**
 * Based on an action specified in the webhook, dispatch on a portion of the applications business logic.
 * @param {MessageWithText} eventMessage the event message that comes from the messenger platform, ready to parse
 * @returns {Action} action to do, based on the event
 */
export function process (eventMessage: MessageWithText): Action {
    const data = events.getNLP(eventMessage).entities;
    const intent = extractEntity(data, 'intent');
    if (intent == null) {
        return { type: 'error/retry' };
    }

    switch (intent) {
        case 'init': return { type: 'goto/start' };
        case 'help': return { type: 'goto/help' };
        case 'issue/room': return { type: 'goto/issueRoom' };
        case 'issue/generic': return { type: 'goto/issueOther' };
        case 'booking/random': return { type: 'goto/roomRandom' };
        case 'booking/specific': return { type: 'goto/roomChoose/1' };
        case 'booking': return bookingIntent(eventMessage, data);
        case 'directing': return directingIntent(eventMessage, data);
        default:
            throw new TypeError('unknown intent');
    }
}
