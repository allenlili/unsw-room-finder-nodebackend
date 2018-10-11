// @flow
import type { Action } from '~/service/dispatcher/types';
import type { Context } from '~/service/dispatcher/context';


import gotoStart from '~/action-handlers/goto-start';
import gotoHelp from '~/action-handlers/goto-help';
import gotoBookingConfirmation from '~/action-handlers/goto-confirmBooking';

import gotoIssueRoom, {
    followUp as roomIssueFollowUp,
} from '~/action-handlers/goto-issueRoom';

import gotoIssueOther, {
    followUp as otherIssueFollowUp,
} from '~/action-handlers/goto-issueOther';

import gotoRoomRandom from '~/action-handlers/goto-roomRandom';
import * as gotoRoomChoose from '~/action-handlers/goto-roomChoose';

import errorRetry from '~/action-handlers/error-retry';

import {
    unknownEvent,
    unknownMessage,
    unknownPostback,
} from '~/action-handlers/error-unknownScenario';


/**
 * Based on an action specified in the webhook, dispatch on a portion of the applications business logic.
 * @param {Context} context an object that represents application state.
 * @param {Action} action used to suggest an intent which updates the application
 * @returns {Promise<void>} promise eventuating to void
 */
export default function (context: Context, action: Action): Promise<void> {
    switch (action.type) {
        case 'ignore': return Promise.resolve();

        case 'error/retry': return errorRetry(context, action);

        case 'unknown/event': return unknownEvent(context, action);
        case 'unknown/message': return unknownMessage(context, action);
        case 'unknown/postback': return unknownPostback(context, action);

        case 'goto/start': return gotoStart(context, action);
        case 'goto/help': return gotoHelp(context, action);

        case 'goto/roomRandom': return gotoRoomRandom(context, action);
        case 'goto/roomChoose/1': return gotoRoomChoose.firstStep(context, action);
        case 'goto/roomChoose/2': return gotoRoomChoose.secondStep(context, action);
        case 'goto/roomChoose/3': return gotoRoomChoose.thirdStep(context, action);
        case 'goto/roomChoose/4': return gotoRoomChoose.forthStep(context, action);
        case 'goto/roomChoose/5': return gotoRoomChoose.fifthStep(context, action);

        case 'goto/bookingConfirmation': return gotoBookingConfirmation(context, action);

        case 'goto/issueRoom': return gotoIssueRoom(context, action);
        case 'goto/issueRoom/followUp': return roomIssueFollowUp(context, action);

        case 'goto/issueOther': return gotoIssueOther(context, action);
        case 'goto/issueOther/followUp': return otherIssueFollowUp(context, action);

        default:
            context.log('error', `unhandled action type, '${action.type}'`);
            context.log('error', action);
            return Promise.reject(new TypeError(`unknown action type, '${action.type}'`));
    }
}

export { default as makeContext } from '~/service/dispatcher/context';
