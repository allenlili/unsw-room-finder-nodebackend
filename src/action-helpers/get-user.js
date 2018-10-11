// @flow
import type { Context } from '~/service/dispatcher/context';

/**
 * Utility to retrieve the user of the application.
 * @param {Context} context application context
 * @param {?Object} tIn input table
 * @returns {Promise<Model<T>>} promise eventuating to Model<T>
 */
export default function (context: Context, tIn: ?Object) {
    const UserTable = context.getTable('user');
    const facebookId = context.facebookId;

    return context.transaction(async (t) => {
        const query = { where: { facebook_id: facebookId } };
        const maybeUser: ?Object = await UserTable.findOne(query, { transaction: t });
        if (maybeUser != null) return maybeUser;

        return UserTable.create({
            facebook_id: facebookId,
        }, { transaction: t });
    }, tIn);
}
