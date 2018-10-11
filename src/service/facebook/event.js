// @flow
import type {
    Event,
    Message,
    MessageNLP,
    HasSender,
    Postback,
    Location,
    PostbackEvent,
} from '~/service/facebook/types';

/**
 * Get the NLP parser for the specified message type.
 * @param {Message} message message to get NLP for
 * @returns {MessageNLP} NLP for the message type
 */
export function getNLP (message: Message): MessageNLP {
    switch (message.type) {
        case 'text': return message._message.message.nlp;
        default:
            throw new TypeError('NLP not available for message type');
    }
}

/**
 * Get the location for the specified message.
 * @param {Message} message message to get location for
 * @returns {Location} location data
 */
export function getLocation (message: Message): Location {
    switch (message.type) {
        case 'location':
            // { type: 'location', _message: _LocationPayload }
            return message._message
                // { message: { location: LocationAttachment } }
                .message.location
                // { payload: { coordinates: Location } }
                .payload.coordinates;
        default:
            throw new TypeError('needs to be a location message');
    }
}

/**
 * Get the sender ID for the specified event message.
 * @param {HasSender} eventMessage message to get sender ID for
 * @returns {string} sender ID
 */
export function getSenderId (eventMessage: HasSender): string {
    return eventMessage._message.sender.id;
}

/**
 * Produces an iterator of incoming messages to the bot.
 * @param {Object} request request object
 * @returns {Iterator<Event>} event iterator
 */
export function parseEvent (request: Object): Iterator<Event> {
    if (request.body == null) throw new TypeError('missing body');
    if (request.body.object !== 'page') throw new TypeError('expected page event');
    return parseIncomingMessages(request.body);
}

////////////////////////////////////////////////////////////////////////////////////
//                                   PARSING                                      //
////////////////////////////////////////////////////////////////////////////////////

/**
 * Takes an event, and if it's a message it'll refine and extract
 * more information from it.
 *
 * Messages are priorised on this basis
 *
 * 1. text based messages
 * 2. location
 * 3. stickers
 * 4. images
 * 5. audio
 * 6. vague
 *
 * It's worth keeping mind that there are no combinations of these
 * so text with attachments is treated as text. A image that is a
 * sticker is treated as a sticker not an image.
 * @param {Event} event event data object
 * @returns {Message} parsed message
 */
export function parseMessage (event: Event): Message {
    if (event.type !== 'message') {
        throw new Error(`invalid event type, '${event.type}'`);
    }

    const vague = event._message;
    const { recipient, sender, timestamp } = vague;
    const baseMessage = { recipient, sender, timestamp };

    const {
        mid,
        seq,
        text,
        nlp,
        sticker_id,
        quick_reply: quickReply,
        attachments = [],
    } = vague.message;
    const location = attachments.find(a => a.type === 'location');
    const images = attachments.filter(a => a.type === 'image');
    const audio = attachments.find(a => a.type === 'audio');

    if (quickReply != null) {
        const payload = JSON.parse(quickReply.payload);
        const _message = { ...baseMessage, message: { mid, seq } };
        return { type: 'quick-reply', payload, _message };
    }
    else if (text != null && nlp != null) {
        // text based messages
        const _message = { ...baseMessage, message: { mid, seq, text, nlp } };
        return { type: 'text', _message };
    }
    else if (location != null) {
        // location messages
        const _message = { ...baseMessage, message: { mid, seq, location } };
        return (({ type: 'location', _message }: any): Message);
    }
    else if (images.length > 0 && sticker_id != null) { // eslint-disable-line camelcase
        // sticker messages
        const image = images[0];
        const _message = { ...baseMessage, message: { mid, seq, image, sticker_id } };
        return (({ type: 'sticker', _message }: any): Message);
    }
    else if (images.length > 0) {
        // image messages
        const _message = { ...baseMessage, message: { mid, seq, images } };
        return (({ type: 'image', _message }: any): Message);
    }
    else if (audio != null) {
        // audio messages
        const _message = { ...baseMessage, message: { mid, seq, audio } };
        return (({ type: 'audio', _message }: any): Message);
    }
    else {
        return { type: 'vague', _message: vague };
    }
}

/**
 * As parseMessage(), except for PostBacks
 * @param {PostbackEvent} event postback event data object
 * @returns {Postback} parsed postback
 */
export function parsePostBack (event: PostbackEvent): Postback {
    const _message = event._message;
    const payload = JSON.parse(event._message.postback.payload);
    return { payload, _message };
}

/**
 * As parseMessage(), except for EventMessages
 * @param {Object} message message body data object
 * @returns {Event} parsed event
 */
function parseEventMessage (message: Object): Event {
    if (message.postback != null) {
        return { type: 'postback', _message: message };
    }
    if (message.read != null) {
        return { type: 'read', _message: message };
    }
    if (message.delivery != null) {
        return { type: 'delieved', _message: message };
    }
    if (message.message != null) {
        return { type: 'message', _message: message };
    }
    throw new TypeError('unknown message type');
}

/**
 * Produces an iterator of incoming events to the bot.
 * @param {Object} body incoming messages body
 * @returns {Iterator<Event>} event iterator
 */
function * parseIncomingMessages (body): Iterator<Event> {
    for (const page of body.entry) {
        for (const message of page.messaging) {
            yield parseEventMessage(message);
        }
    }
}
