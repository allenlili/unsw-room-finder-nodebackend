// @flow
import type {
    Action
} from '~/service/dispatcher/types';
import type {
    Context
} from '~/service/dispatcher/context';

import { stripPadding } from '~/util/strings';

/**
 * Sends a response to the user, containing help information.
 * @param {Context} context application context
 * @param {Action} action user action
 * @returns {Promise<void>} promise eventuating to void
 */
export default async function (context: Context, action: Action): Promise <void> {
    const userClient = context.getFacebookClient();
    // await userClient.sendText('I can\'t help you');
    // await userClient.sendText('😂');

    let payload = {
        template_type: 'generic',
        elements: [
            {
                title: 'UNSW Room Finder',
                image_url: 'https://www.ontasklearning.org/wp-content/uploads/logos-13UNSW.png',
                subtitle: 'Hey! I help find empty rooms around campus 🙋🏼'
            },
            {
                title: 'Feeling Lucky?',
                image_url: 'https://ichef-1.bbci.co.uk/news/660/cpsprodpb/37B5/production/_89716241_thinkstockphotos-523060154.jpg',
                subtitle: 'I can quickly find random rooms near you...'
            },
            {
                title: 'Maybe more specific?',
                image_url: 'https://cdn-images-1.medium.com/max/1600/1*z-rK2q2FXKyc7J2ZiXH-fw.jpeg',
                subtitle: 'Or, you can be more picky and choose a time/date'
            },
            {
                title: 'Need more info? Hacking?',
                image_url: 'https://i.github-camo.com/f01f35e97c771ac7bb2e3067cb99fb63c8038a37/68747470733a2f2f662e636c6f75642e6769746875622e636f6d2f6173736574732f3133353937372f323335313230362f38306536366364322d613537392d313165332d396338302d6538336565646637356164632e676966',
                subtitle: 'View our detailed usage wiki or bot docs',
                // default_action: {
                //     type: 'web_url',
                //     url: 'https://google.com',
                //     messenger_extensions: false,
                //     webview_height_ratio: 'tall'
                //     // fallback_url: 'google.com'
                // },
                buttons: [{
                    type: 'web_url',
                    url: 'https://github.com/zakisaad/COMP9323-Group2-NodeBackend/blob/master/README.md',
                    title: 'Detailed README'
                }, {
                    type: 'web_url',
                    url: 'http://z5016959.web.cse.unsw.edu.au/docs/index.html',
                    title: 'Bot Docs'
                }]
            }
        ]
    };

    await userClient.sendText(stripPadding(`
        Sounds like you need some help 😨
    `));

    await userClient.sendMessage(
        { message: { attachment: { type: 'template', payload: payload } } } : any
    );

    await userClient.sendText(stripPadding(`
        Click "Find a room" below to begin 😌
    `));
};
