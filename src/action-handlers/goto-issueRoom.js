// @flow

/*
 * @module service/dispatcher/handlers/goto-issueRoom
 */
import type { Action } from '~/service/dispatcher/types';
import type { Context } from '~/service/dispatcher/context';

import { stripPadding } from '~/util/strings';
import setState from '~/action-helpers/set-state';
import getState from '~/action-helpers/get-state';
import getUser from '~/action-helpers/get-user';

/**
 * Sends a response to the user, asking them what the problem with the room is.
 * @param {Context} context application context
 * @param {Action} action user action
 * @returns {Promise<void>} promise eventuating to void
 */
export default async function (context: Context, action: Action): Promise<void> {
    const state = await getState(context);

    const userClient = context.getFacebookClient();

    // specify the follow up for this action handler
    const stateUpdate = { data: { ...state.data, followUp: 'goto/issueRoom/followUp' } };
    await setState(context, stateUpdate);

    await userClient.sendText(stripPadding(`
        Oh no! What's wrong with the room?
    `));
}

/**
 * Sends a response to the user, capturing their issue about the room and thanking them for their feedback.
 * @param {Context} context application context
 * @param {Action} action user action
 * @returns {Promise<void>} promise eventuating to void
 */
export async function followUp (context: Context, action: Action): Promise<void> {
    if (action.type !== 'goto/issueRoom/followUp') throw new TypeError();

    const state = await getState(context);
    const userClient = context.getFacebookClient();

    // erase any kind of follow up.
    const stateUpdate = { data: { ...state.data, followUp: null } };
    await setState(context, stateUpdate);

    const Feedback = context.database.getTable('feedback');
    const user = await getUser(context, action);

    await Feedback.create({
        // room_id: ,
        user_id: user.id,
        start_time: new Date(),
        description: action.message._message.message.text
    });

    await userClient.sendText(stripPadding(`
        Thanks! You can look for another room if you'd like :)
    `));
}
