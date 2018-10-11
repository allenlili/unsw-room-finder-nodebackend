// @flow
import type {
    Event,
    Message,
    MessageWithText,
    PostbackType,
    Location,
} from '~/service/facebook/types';

import type { TimeOffset } from '~/util/date';

import type { Context } from '~/service/dispatcher/context';

export type ActionHandler = (context: Context, action: Action) => Promise<void>;

export type Action
    = {| +type: 'ignore' |}
    | {| +type: 'error/retry' |}

    | {| +type: 'unknown/event', event: Event |}
    | {| +type: 'unknown/message', message: Message |}
    | {| +type: 'unknown/postback', postback: PostbackType |}

    | {| +type: 'goto/start' |}
    | {| +type: 'goto/help' |}

    | {| +type: 'goto/issueRoom' |}
    | {| +type: 'goto/issueRoom/followUp', message: MessageWithText |}

    | {| +type: 'goto/issueOther' |}
    | {| +type: 'goto/issueOther/followUp', message: MessageWithText |}

    | {| +type: 'goto/roomRandom' |}
    | {| +type: 'goto/roomChoose/1' |}
    | {| +type: 'goto/roomChoose/2', time: TimeOffset |}
    | {| +type: 'goto/roomChoose/3', location: ?Location |}
    | {| +type: 'goto/roomChoose/4', offsetChange: 1 | -1 |}
    | {| +type: 'goto/roomChoose/5', sentDate: Date, index: number |}

    | {| +type: 'goto/roomChooseArea' |}
    | {| +type: 'goto/roomChooseTime' |}

    | {| +type: 'goto/bookingConfirmation', sentDate: Date |}

