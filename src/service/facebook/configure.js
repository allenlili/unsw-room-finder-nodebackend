// @flow
import menu from '~/service/facebook/menu-builder';
import { stripPadding } from '~/util/strings';

/**
 * Generates the configure payload, which includes the main menu and greeting.
 * @returns {Object} newly created configure payload
 */
export default function () {
    // it's worth noting that a menu can only have 3 top level fields.
    const mainMenu = menu(false, 'default')
        .callToAction('nested', 'Find a room', m => m
            .callToAction('postback', 'Specify Room Preference', { type: 'ROOM/CHOOSE/1' })
            .callToAction('postback', 'Feeling Lucky', { type: 'ROOM/RANDOM' }))

        .callToAction('nested', 'Report Issue', m => m
            .callToAction('postback', 'Issue with room', { type: 'REPORT/ROOM_INFO' })
            .callToAction('postback', 'Other issue', { type: 'REPORT/GENERIC' }))
        .callToAction('postback', 'Help', { type: 'HELP' });

    return {
        get_started: {
            payload: JSON.stringify({ type: 'INIT' }),
        },
        persistent_menu: [mainMenu.build()],
        greeting: [{
            locale: 'default',
            text: stripPadding(`
                This bot is dedicated to finding rooms on
                UNSW's Kensington Campus. Hit get started
                to start finding rooms!
            `),
        }],
    };
}
