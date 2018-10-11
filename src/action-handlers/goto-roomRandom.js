// @flow

/*
 * @module service/dispatcher/handlers/goto-randomRoom
 */
import type { Action } from '~/service/dispatcher/types';
import type { Context } from '~/service/dispatcher/context';

import { stripPadding } from '~/util/strings';

import prepareForConfirmation from '~/action-helpers/prepare-for-confirmation';
import { queryRoom } from '~/action-helpers/room-search';

/**
 * Builds data to send to the user, however does not take any user constraints into account. Chooses random rooms. If nothing is available, it will let the user know.
 * @param {Context} context application context
 * @param {Action} action user action
 * @returns {Promise<void>} promise eventuating to void
 */
export default async function (context: Context, action: Action): Promise<void> {
    const userClient = context.getFacebookClient();
    const [availability] = await queryRoom(context, {
        type: 'no-geo',
        from: new Date(),
        pagination: { offset: 0, limit: 1 },
    });

    if (availability != null) {
        await prepareForConfirmation(context, availability);
    }
    else {
        await userClient.sendText(stripPadding(`
            Sorry no rooms are available right now 😥
            As far as we know at least 🤔
        `));
    }
};
