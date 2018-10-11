// @flow
import type { Action } from '~/service/dispatcher/types';

export default function (eventMessage: Object, data: Object): Action {
    return { type: 'ignore' };
}
