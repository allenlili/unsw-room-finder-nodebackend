// @flow

/*
 * @module service/dispatcher/handlers/goto-start
 */
import type { Action } from '~/service/dispatcher/types';
import type { Context } from '~/service/dispatcher/context';

import { stripPadding } from '~/util/strings';
import { INITIAL_STATE } from '~/service/database/states';
import setState from '~/action-helpers/set-state';

/**
 * This dispatcher handler resets the users state in the application, as well wiping any json data stored about the user. After that it shows the user a message about the start of the Application.
 * @param {Context} context application context
 * @param {Action} action user action
 * @returns {Promise<void>} promise eventuating to void
 */
export default async function (context: Context, action: Action): Promise<void> {
    await setState(context, { state: INITIAL_STATE, data: {} });

    const userClient = context.getFacebookClient();
    const message = stripPadding(`
        Welcome, this bot is intended find vacant rooms on
        campus. Select an option to get started ✨
    `);
    await userClient.sendText(message);
};
