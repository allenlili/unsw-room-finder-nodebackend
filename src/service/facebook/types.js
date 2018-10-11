// @flow
import type { TimeOffset } from '~/util/date';
export type Location = { lat: number, long: number };

export type MessageNLP = { entities: any }

interface MessageWithSender {
    sender: { id: string };
}

interface MessageWithRecipient {
    recipient: { id: string };
}

interface MessageWithTimestamp {
    timestamp: number
}

type PayloadBase
    = MessageWithSender & MessageWithTimestamp & MessageWithRecipient;

// payload types

export type SendMessage = {};

export type PostbackType
    = {| type: 'INIT' |}
    | {| type: 'HELP' |}

    | {| type: 'ROOM/RANDOM' |}
    | {| type: 'ROOM/CHOOSE/1' |}
    | {| type: 'ROOM/CHOOSE/2', time: TimeOffset |}

    /* We won't get a location via an postback */
    | {| type: 'ROOM/CHOOSE/3/no-location' |}
    | {| type: 'ROOM/CHOOSE/4', offsetChange: 1 | -1 |}
    | {| type: 'ROOM/CHOOSE/5', index: number, sentDate: string |}

    | {| type: 'REPORT/GENERIC' |}
    | {| type: 'REPORT/ROOM_INFO' |}
    | {| type: 'CONFIRM', value: boolean |}

    | {| type: 'CONFIRM/BOOKING', sentDate: string |}

// attachment types

type ImageAttachment = {
    type: 'image',
    payload: { url: string, sticker_id?: number }
}

type AudioAttachment = {
    type: 'audio',
    payload: { url: string }
}

type LocationAttachment = {
    type: 'location',
    title: string,
    url: string,
    payload: { coordinates: Location }
}

export type Attachment
    = ImageAttachment
    | LocationAttachment
    | AudioAttachment

// event & message types

interface _VaguePayload extends PayloadBase {
    message: {
        mid: string,
        seq: number,
        text?: string,
        sticker_id?: number,
        attachments?: Array<Attachment>,
        nlp?: MessageNLP,
        quick_reply?: { payload: string },
    };
}

interface _PostBackPayload extends PayloadBase {
    postback: {
        payload: string,
        title: string,
    };
}

interface _TextPayload extends PayloadBase {
    +message: {
        mid: string,
        seq: number,
        text: string,
        nlp: MessageNLP,
    };
}

interface _QuickReplyMessage extends PayloadBase {
    +message: {
        mid: string,
        seq: number,
    };
}

interface _AudioMessage extends PayloadBase {
    +message: {
        mid: string,
        seq: number,
        audio: AudioAttachment,
    };
}

interface _LocationPayload extends PayloadBase {
    +message: {
        mid: string,
        seq: number,
        location: LocationAttachment,
    };
}

interface _ImagePayload extends PayloadBase {
    +message: {
        mid: string,
        seq: number,
        images: Array<ImageAttachment>,
    };
}

interface _StickerPayload extends PayloadBase {
    +message: {
        mid: string,
        seq: number,
        sticker_id: number,
        image: ImageAttachment,
    };
}


type MessageEvent = { type: 'message', _message: _VaguePayload }
export type PostbackEvent = { type: 'postback', _message: _PostBackPayload }

export type Event
    = MessageEvent
    | PostbackEvent
    | { type: 'read', _message: PayloadBase }
    | { type: 'delieved', _message: PayloadBase }

export type Postback
    = { payload: PostbackType, _message: _PostBackPayload }

export type MessageWithText = { type: 'text', _message: _TextPayload }
export type Message
    = MessageWithText
    | { type: 'quick-reply', payload: PostbackType, _message: _QuickReplyMessage }
    | { type: 'location', _message: _LocationPayload }
    | { type: 'images', _message: _ImagePayload }
    | { type: 'sticker', _message: _StickerPayload }
    | { type: 'audio', _message: _AudioMessage }
    | { type: 'vague', _message: _VaguePayload }

/*
 * Basically any case of EventMessage is compatible
 * with this type.
 */
export interface HasSender {
    +_message: MessageWithSender;
}

