// @flow

/*
 * @module service/dispatcher/handlers/goto-chooseTime
 */
import type { Action } from '~/service/dispatcher/types';
import type { Context } from '~/service/dispatcher/context';

import type { Location } from '~/service/facebook/types';
import {
    setQuickReplies,
    optionCarousel,
} from '~/service/facebook/message-builder';

import type { Model, State } from '~/service/database/types';

import type { TimeOffset } from '~/util/date';
import { offsetDate } from '~/util/date';
import { stripPadding } from '~/util/strings';

import type { SearchConstraints } from '~/action-helpers/room-search';
import prepareForConfirmation from '~/action-helpers/prepare-for-confirmation';
import { queryRoom } from '~/action-helpers/room-search';
import setState from '~/action-helpers/set-state';
import getState from '~/action-helpers/get-state';


/*
 * fields in the data field by the time of step 3
 */
type SearchStateData = {
    pageOffset: number,
    location: ?Location,
    sentDate: string,
    timeOffset: TimeOffset,
}

const PAGE_SIZE = 10;

/**
 * The inital step in the room finding process, we record the time it starts and then move forward by asking what time they prefer their room.
 * @param {Context} context application context
 * @param {Action} action user action
 * @returns {Promise<void>} promise eventuating to void
 */
export async function firstStep (context: Context, action: Action): Promise<void> {
    const userClient = context.getFacebookClient();
    const message = `When would you like your room?`;

    await setState(context, {
        data: {
            pageOffset: 0,
            location: null,
            timeOffset: null,
            sentDate: (new Date()).toISOString(),
            followUp: 'goto/roomChoose/2',
        }
    });

    await userClient.sendMessage(setQuickReplies(message, m => {
        m.addTextOption('Now', {
            type: 'ROOM/CHOOSE/2',
            time: { type: 'now' },
        });

        m.addTextOption('In an hour', {
            type: 'ROOM/CHOOSE/2',
            time: { type: 'hours-later', amount: 1 },
        });

        m.addTextOption('In half an hour', {
            type: 'ROOM/CHOOSE/2',
            time: { type: 'minutes-later', amount: 30 },
        });
    }));
}

/**
 * With a specified time we'll add that to the database state, then we'll request the user to send location data on their where abouts, which they can decline.
 * @param {Context} context application context
 * @param {Action} action user action
 * @returns {Promise<void>} promise eventuating to void
 */
export async function secondStep (context: Context, action: Action): Promise<void> {
    if (action.type !== 'goto/roomChoose/2') throw new TypeError('called with incorrect action');
    const state = await getState(context);

    // lets specify that the third step is a followup
    // as well as record the location the user specified
    await setState(context, {
        data: {
            ...state.data,
            timeOffset: action.time,
            followUp: 'goto/roomChoose/3',
        }
    });

    const userClient = context.getFacebookClient();
    await userClient.sendMessage(setQuickReplies(stripPadding(`
        Nice! If your looking for rooms nearby,
        please send your location, Otherwise hit
        'No Thanks'!
    `), m => {
        m.addLocationOption();

        m.addTextOption('No Thanks', {
            type: 'ROOM/CHOOSE/3/no-location',
        });
    }));
}

/**
 * In this step we might get the location, we might not, but we can start searching for a room based on whatever information the user has given us.
 * @param {Context} context application context
 * @param {Action} action user action
 * @returns {Promise<void>} promise eventuating to void
 */
export async function thirdStep (context: Context, action: Action): Promise<void> {
    if (action.type !== 'goto/roomChoose/3') throw TypeError('called with incorrect action');
    const oldState = await getState(context);

    const state = await setState(context, {
        data: {
            ...oldState.data,
            location: action.location,
            followUp: 'goto/roomChoose/4',
        }
    });

    return withConstraints(context, state);
}

/**
 * The only difference between this and the last step is this step moves pagination forward.
 * @param {Context} context application context
 * @param {Action} action user action
 * @returns {Promise<void>} promise eventuating to void
 */
export async function forthStep (context: Context, action: Action): Promise<void> {
    if (action.type !== 'goto/roomChoose/4') throw TypeError('called with incorrect action');
    const oldState = await getState(context);
    oldState.data.pageOffset += action.offsetChange;

    const state = await setState(context, {
        data: {
            ...oldState.data,
            followUp: 'goto/roomChoose/4',
        }
    });

    return withConstraints(context, state);
}

/**
 * This step prepares the room for conformation.
 * @param {Context} context application context
 * @param {Action} action user action
 * @returns {Promise<void>} promise eventuating to void
 */
export async function fifthStep (context: Context, action: Action): Promise<void> {
    if (action.type !== 'goto/roomChoose/5') throw TypeError('called with incorrect action');

    const state = await getState(context);

    if (action.sentDate.toISOString() !== state.data.sentDate) return;

    const constraints = stateToContraints(state.get('data'));
    constraints.pagination = { offset: action.index, limit: 1 };

    const [availability] = await queryRoom(context, constraints);
    await prepareForConfirmation(context, availability);
}

export default firstStep;

////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Builds data to send to the user, containing room information such as latlong, room number, student VIP links, and options to choose the rooms. If there are no available rooms, it will let the user know this.
 * @param {Context} context application context
 * @param {Model<State>} state user action
 * @returns {Promise<void>} promise eventuating to void
 */
async function withConstraints (context: Context, state: Model<State>) {
    const userClient = context.getFacebookClient();
    const constraints = stateToContraints(state.get('data'));
    const sentDate = state.data.sentDate;
    const results = await queryRoom(context, constraints);

    if (results.length > 0) {
        const indexOffset = constraints.pagination.offset * constraints.pagination.limit;

        await userClient.sendMessage(optionCarousel(carousel => {
            /*
             * We want to add the option to show more
             */
            carousel.addQuickReplies(m => {
                m.addTextOption('Nevermind 😒', { type: 'INIT' });

                m.addTextOption('Show more 👉', {
                    type: 'ROOM/CHOOSE/4',
                    offsetChange: 1,
                });
            });

            /*
             * Iterate over the results to build up the message to send
             * to the client. TODO add pagination quick replies.
             */
            results.forEach((result, index) => {
                const {
                    location_lat: latitude,
                    location_long: longitude,
                    unsw_room_number: roomNumber,
                    unsw_building_name: buildingName,
                    student_vip_room_link: roomInfoLink,
                    student_vip_building_link: buildingInfoLink,
                } = result;

                carousel.addOption({
                    type: 'location',
                    title: `${roomNumber}, ${buildingName}`,
                    location: { lat: latitude, long: longitude },
                }, option => {
                    const itIndex = indexOffset + index;
                    option.addButton('I👏Want👏This👏Room', { type: 'ROOM/CHOOSE/5', index: itIndex, sentDate });

                    // add links for more information if available.
                    if (roomInfoLink) option.addLinkButton('Room Info 🌚', roomInfoLink);
                    if (buildingInfoLink) option.addLinkButton('Building Info 🌝', buildingInfoLink);
                });
            });
        }));
    }
    else if (constraints.pagination.offset > 0) {
        await userClient.sendText(stripPadding(`
            Sorry no more other are available right now 😥
        `));
    }
    else {
        await userClient.sendText(stripPadding(`
            Sorry no rooms are available right now 😥
            As far as we know, at least 🤔
        `));
    }
}

/**
 * Gets the constraint data from the state object.
 * @param {SearchStateData} state searched state data object
 * @returns {SearchConstraints} constraints data object
 */
function stateToContraints (state: SearchStateData): SearchConstraints {
    const pagination = { offset: state.pageOffset, limit: PAGE_SIZE };
    const sentDateParsed = new Date(state.sentDate);
    const from = offsetDate(state.timeOffset, sentDateParsed);
    const location = state.location;

    return (location != null)
        ? { type: 'with-geo', location, from, pagination }
        : { type: 'no-geo', from, pagination };
}
