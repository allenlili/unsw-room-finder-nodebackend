import { PENDING_BOOKING } from '~/service/database/states';

import type { Context } from '~/service/dispatcher/context';
import type { Availablity } from '~/service/database/types';

import { stripPadding } from '~/util/strings';
import { buttonMessage } from '~/service/facebook/message-builder';

import setState from '~/action-helpers/set-state';


/**
 * If a room is available
 * 1. Update the state to include the time sent & availablity info
 * 2. Send button template with a few postbacks & include the sentDate with the accept.
 * @param {Context} context application context
 * @param {Availablity} availablity object containing availibility data
 * @returns {Promise<void>} promise eventuating to void
 */
export default async function (context: Context, availability: Availablity): Promise<void> {
    const sentDate = new Date();
    const stateData = { searchedAt: sentDate, info: availability };
    await setState(context, { state: PENDING_BOOKING, data: stateData });

    const userClient = context.getFacebookClient();
    const message = `How about this room?\n\n${describeSlot(availability)}`;
    const serialiedDate = sentDate.toISOString();

    await userClient.sendMessage(buttonMessage(message, m => {
        // When they go here they'll use the sentDate to confirm
        // They clicked the right confirmation button & not an old one.
        m.addButton('I want this room 👌', { type: 'CONFIRM/BOOKING', sentDate: serialiedDate });

        // Finding a different room is basically runnig this again, so lets
        // pass a postback that directs the user back here.
        m.addButton('Different room 🤔', { type: 'ROOM/RANDOM' });

        // if the room has a student VIP link
        if (availability.student_vip_room_link != null) {
            m.addLinkButton('More info 👀', availability.student_vip_room_link);
        }
        else if (availability.student_vip_building_link != null) {
            m.addLinkButton('More info 👀', availability.student_vip_building_link);
        }
    }));
}

/**
 * Construct a description about the room slot, containing the name, place, and location - as well as availibility info.
 * @param {Availablity} availablity object containing availibility data
 * @returns {string} description of the room
 */
function describeSlot (availabityInfo: Availablity): string {
    const {
        unsw_room_number: roomName,
        unsw_building_name: place,
        unsw_map_position: mapLoc,
    } = availabityInfo;

    const roomDescription = stripPadding(`
        Room '${roomName}' of '${place}' @ ${mapLoc}
    `);

    const { hours: waitHours, minutes: waitMinutes } = availabityInfo.till_available || {};
    const { hours: freeHours, minutes: freeMinutes } = availabityInfo.availablity || {};

    const availabilityTime = [
        freeHours && `${freeHours} hours`,
        freeMinutes && `${freeMinutes} minutes`,
    ].filter(it => it).join(' & ');

    const availabilityText = `available for "${availabilityTime}"`;

    const currentlyAvailable =
        typeof waitHours === 'number' &&
        typeof waitMinutes === 'number';

    if (currentlyAvailable) {
        const [time] = availabityInfo.room_open_at.split('.');
        const waitInfo = `from '${time}'`;
        return `${roomDescription}, ${availabilityText} ${waitInfo}`;
    }
    else {
        return `${roomDescription}, ${availabilityText} from now`;
    }
}
