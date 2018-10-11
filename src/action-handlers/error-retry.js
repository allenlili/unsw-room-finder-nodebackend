// @flow
import type {
    Action
} from '~/service/dispatcher/types';

import type {
    Context
} from '~/service/dispatcher/context';

/**
 * Sends a response to the user, informing them that their message cannot be processed.
 * @param {Context} context application context
 * @param {Action} action user action
 * @returns {Promise<void>} promise eventuating to void
 */
export default async function (context: Context, action: Action): Promise <void> {
    const userClient = context.getFacebookClient();
    const message = 'Sorry, I can\'t understand your message';
    await userClient.sendText(message);
};
