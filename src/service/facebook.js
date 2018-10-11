// @flow
import type { SendMessage } from '~/service/facebook/types';
import configPayload from '~/service/facebook/configure';
import { UserError, FailedRequest } from '~/service/facebook/errors';

import axios from 'axios';

const FB_DOMAIN = 'https://graph.facebook.com/v2.6';

interface AxiosResult {
    data: Object;
    status: number;
}

export default class Facebook {
    PAGE_ACCESS_TOKEN: string;
    VERIFY_TOKEN: string;
    APP_SECRET: string;

    constructor (PAGE_ACCESS_TOKEN: string, VERIFY_TOKEN: string, APP_SECRET: string) {
        this.PAGE_ACCESS_TOKEN = PAGE_ACCESS_TOKEN;
        this.VERIFY_TOKEN = VERIFY_TOKEN;
        this.APP_SECRET = APP_SECRET;
    }

    /**
     * Attach a sender ID to the user handler.
     * @param {string} senderId sender ID to attach
     * @returns {UserHandler} Facebook user handler 
     */
    withSender (senderId: string): UserHandler {
        return new UserHandler(this, senderId);
    }

    /**
     * Method for making generic request.
     * @param {string} method http method
     * @param {string} url https url
     * @param {Object} config axios config
     * @returns {Promise<AxiosResult>} promise eventuating to an AxiosResult
     */
    async _request (method: string, url: string, config: Object): Promise<AxiosResult> {
        try {
            return await axios({
                baseURL: FB_DOMAIN,
                responseType: 'json',
                params: {
                    access_token: this.PAGE_ACCESS_TOKEN
                },
                ...config,
                method,
                url,
            });
        }
        catch (error) {
            const { response: { data, status } } = error;
            throw new FailedRequest(data, status, error);
        }
    }

    /**
     * Method for posting a message.
     * @param {Object} payload payload to be contained in the message
     * @returns {Promise<Object>} promise eventuating to an Object
     */
    async _sendMessage (payload: Object): Promise<Object> {
        const config = { data: payload };
        const response = await this._request('POST', '/me/messages', config);
        return response.data;
    }

    /**
     * Method for sending to a recipient.
     * @param {string} id recipient id
     * @param {Object} payload payload to be contained in the message
     * @returns {Promise<Object>} promise eventuating to an Object
     */
    _sendToRecipt (id: string, payload: Object): Promise<Object> {
        const config = { ...payload, recipient: { id } };
        return this._sendMessage(config);
    }

    /**
     * Sends a text message to a recipent.
     * @param {string} id recipient id
     * @param {Object} payload payload to be contained in the message
     * @returns {Promise<Object>} promise eventuating to an Object
     */
    sendText (id: string, text: string): Promise<Object> {
        // calling function should handler errors.
        return this._sendMessage({
            recipient: { id },
            message: { text },
        });
    }

    /**
     * Sends a image to a recipent.
     * @param {string} id recipient id
     * @param {string} url image url to be sent
     * @returns {Promise<Object>} promise eventuating to an Object
     */
    sendImage (id: string, url: string): Promise<Object> {
        const image = { type: 'image', payload: { url } };

        // calling function should handler errors.
        return this._sendMessage({
            recipient: { id },
            message: { attachments: [image] },
        });
    }

    /**
     * Configure the profile after verification.
     * @returns {Promise<any>} promise eventuating to anything
     */
    configureProfile (): Promise<any> {
        return this._request('POST', '/me/messenger_profile', {
            data: configPayload(),
        });
    }

    /**
     * Creates a Facebook messenger client library.
     * @param {Object} config Facebook client config
     * @returns {Facebook} instantiated Facebook object
     */
    static create ({ facebook: config }): Facebook {
        const failureToCreate = new Error('cannot create facebook client');
        if (config == null) throw failureToCreate;
        if (config.PAGE_ACCESS_TOKEN == null) throw failureToCreate;
        if (config.VERIFY_TOKEN == null) throw failureToCreate;
        if (config.APP_SECRET == null) throw failureToCreate;

        return new Facebook(
            config.PAGE_ACCESS_TOKEN,
            config.VERIFY_TOKEN,
            config.APP_SECRET,
        );
    }
}

export { Facebook };


export class UserHandler {
    _senderId: string;
    _facebook: Facebook;

    constructor (facebook: Facebook, senderId: string) {
        this._senderId = senderId;
        this._facebook = facebook;
    }

    /**
     * Sends a message built by a message builder.
     * @param {SendMessage} message message to send
     * @returns {Promise<Object>} promise eventuating to an Object
     */
    sendMessage (message: SendMessage): Promise<Object> {
        return this._facebook._sendToRecipt(this._senderId, message)
            .catch(error => this._toUserError(error));
    }

    /**
     * Sends an image built by a message builder.
     * @param {string} image image to send
     * @returns {Promise<Object>} promise eventuating to an Object
     */
    sendImage (image: string) {
        return this._facebook.sendImage(this._senderId, image)
            .catch(error => this._toUserError(error));
    }

    /**
     * Sends text built by a message builder.
     * @param {string} message message to send
     * @returns {Promise<Object>} promise eventuating to an Object
     */
    sendText (message: string) {
        return this._facebook.sendText(this._senderId, message)
            .catch(error => this._toUserError(error));
    }

    _toUserError (error: Error): Promise<any> {
        const newError = UserError.fromError(this._senderId, error);
        return Promise.reject(newError);
    }
}
