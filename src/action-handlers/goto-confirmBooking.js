// @flow

/*
 * @module service/dispatcher/handlers/goto-randomRoom
 */
import type { Action } from '~/service/dispatcher/types';
import type { Context } from '~/service/dispatcher/context';
import type { Availablity, Model, Room } from '~/service/database/types';
import {
    PENDING_BOOKING,
    INITIAL_STATE,
} from '~/service/database/states';

import { messageWithLocation } from '~/service/facebook/message-builder';
import getState from '~/action-helpers/get-state';
import setState from '~/action-helpers/set-state';

import { stripPadding } from '~/util/strings';
import * as date from '~/util/date';

/* 
 * This is the expected shape of the data field of the
 * state object when this action is performed.
 */
type PendingState = { +searchedAt: string, +info: Availablity };

/**
 * Sends a response to the user, confirming a 'booking' with them and sending data about where to find their room.
 * @param {Context} context application context
 * @param {Action} action user action
 * @returns {Promise<void>} promise eventuating to void
 */
export default async function (context: Context, action: Action): Promise<void> {
    if (action.type !== 'goto/bookingConfirmation') throw new TypeError('illegal action type');

    // record the date this action was sent on.
    const sentDate = action.sentDate;

    const userClient = context.getFacebookClient();

    // create a transaction because if shit fucks
    // up, we don't want anything to save.
    const room: Model<Room> = await context.transaction(async (t) => {
        // ensure the user is in the correct state
        // to handle this event, otherwise something
        // has gone wrong.
        const usersState = await getState(context, t);
        const stateTag: number = usersState.get('state');
        if (stateTag !== PENDING_BOOKING) {
            await userClient.sendText(stripPadding(`
                Can't get this for you right now... have you already asked for this room?
            `));
            throw new TypeError('illegal state');
        }

        // match the states to ensure the user hasn't clicked on
        // older version of a confirm booking button, otherwise
        // they may expect it to be booking that older booking.
        const pending: PendingState = usersState.get('data');
        const pendingDate = new Date(pending.searchedAt);
        if (!date.isEqual(pendingDate, sentDate)) {
            await userClient.sendText(stripPadding(`
                Unsure how to help you with that!
            `));
            throw new TypeError('wrong button clicked');
        }

        // calculate the start & end times for the users booking
        const { startTime, endTime } = getTimesFromAvailability(pending.info, pendingDate);

        // store the booking
        const UserBooking = context.getTable('userBooking');
        await UserBooking.create({
            room_id: pending.info.room_id,
            user_id: usersState.get('user_id'),
            start_time: startTime,
            end_time: endTime,
        }, { transaction: t });

        // reset the users state
        await setState(context, { state: INITIAL_STATE, date: {} }, t);

        // returns the room so they can direct the user there
        const Room = context.getTable('room');
        return Room.findById(pending.info.room_id, { transaction: t });
    });

    const { location_lat: latitude, location_long: longitude } = room.get();

    await userClient.sendText(stripPadding(`
        Perfect ✨  Here's where you'll find your room 🤓
    `));

    await userClient.sendMessage(messageWithLocation(
        room.room_name,
        { latitude, longitude },
    ));
}

/**
 * Gets the start and end time from an Availability object.
 * @param {Availablity} availablity object containing availibility data
 * @param {Date} searchedTime time that has been searched for
 * @returns {startTime, endTime} object containing a start and end time for the availibility
 */
function getTimesFromAvailability (availablity: Availablity, searchedTime: Date) {
    if (availablity.room_open_at == null) throw new TypeError();
    if (availablity.availablity == null) throw new TypeError();

    const { room_open_at: roomOpenAt, availablity: delta } = availablity;
    const startTime = date.fromPGTimeString(roomOpenAt, searchedTime);
    const endTime = date.add(startTime, delta);
    return { startTime, endTime };
}
