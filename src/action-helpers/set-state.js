// @flow
import type { Context } from '~/service/dispatcher/context';

import getState from '~/action-helpers/get-state';

/**
 * Non destructive update that actually creates a new state for the current user.
 * @param {Context} context application context
 * @param {Object} updateIn updated state object
 * @param {?Object} tIn input table
 * @returns {Promise<Model<T>>} promise eventuating to Model<T>
 */
export default function (context: Context, updateIn: Object, tIn: ?Object) {
    const State = context.getTable('state');

    return context.transaction(async (t) => {
        const state = await getState(context, t);

        return State.create({
            data: state.data,
            state: state.state,
            user_id: state.user_id,
            created: new Date(),
            ...updateIn,
        }, { transaction: t });
    }, tIn);
}
