// @flow
import type { Context } from '~/service/dispatcher/context';
import type { Model } from '~/service/database/types';
import { INITIAL_STATE } from '~/service/database/states';

import getUser from '~/action-helpers/get-user';

/**
 * Utility to retrieve the state, which can be used to check/store user state data.
 * @param {Context} context application context
 * @param {?Object} tIn input table
 * @returns {Promise<Model<T>>} promise eventuating to Model<T>
 */
export default function self <T> (context: Context, tIn: ?Object): Promise<Model<T>> {
    const State = context.getTable('state');

    return context.transaction(async (t) => {
        const user = await getUser(context, t);
        const state = await State.findOne({
            where: { user_id: user.id },
            order: [['created', 'DESC']],
        }, { transaction: t });

        if (state) return state;

        return State.create({
            user_id: user.id,
            state: INITIAL_STATE,
            created: new Date(),
            data: {},
        }, { transaction: t });
    }, tIn);
}
