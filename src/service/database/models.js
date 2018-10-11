// @flow
import Sequelize from 'sequelize';
import type { ModelName } from '~/service/database/types';

const makeId = () => ({ type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true });

/**
 * Define all database tables, and export as a map between table names and actionable objects.
 * @param {Sequelize} database orm library object
 * @returns {Map<ModelName, Object>} map between the table names, and the orm objects
 */
export default function (database: Sequelize): Map<ModelName, Object> {
    const RoomTable = database.define('room', {
        id: makeId(),

        location_lat: { type: Sequelize.FLOAT },
        location_long: { type: Sequelize.FLOAT },

        room_name: { type: Sequelize.TEXT },
        capacity: { type: Sequelize.INTEGER },

        student_vip_room_link: { type: Sequelize.TEXT },
        student_vip_building_link: { type: Sequelize.TEXT },

        /*
         * This can be something like G23, 103, etc.
         */
        unsw_room_number: { type: Sequelize.TEXT },

        /*
         * Something like Ainsworth Building, but also Flute lab.
         * I think it's more helpful to refer to this as description.
         */
        unsw_building_name: { type: Sequelize.TEXT },

        /*
         * Things like 'G4', 'K17', etc
         */
        unsw_map_position: { type: Sequelize.TEXT },
    }, {
        freezeTableName: true,
        timestamps: false
    });

    const BotUserTable = database.define('bot_user', {
        id: makeId(),
        facebook_id: { type: Sequelize.TEXT },
    }, {
        freezeTableName: true,
        timestamps: false
    });

    const ConversationState = database.define('conversation_state', {
        id: makeId(),
        user_id: { type: Sequelize.INTEGER },
        created: { type: Sequelize.DATE },
        state: { type: Sequelize.INTEGER },
        data: { type: Sequelize.JSON },
    }, {
        freezeTableName: true,
        timestamps: false
    });

    const ClassBookingTable = database.define('class_booking', {
        id: makeId(),
        room_id: { type: Sequelize.INTEGER },
        start_time: { type: Sequelize.DATE },
        end_time: { type: Sequelize.DATE },
    }, {
        freezeTableName: true,
        timestamps: false
    });

    const UserBookingTable = database.define('user_booking', {
        id: makeId(),
        room_id: { type: Sequelize.INTEGER },
        user_id: { type: Sequelize.INTEGER },
        start_time: { type: Sequelize.DATE },
        end_time: { type: Sequelize.DATE },
    }, {
        freezeTableName: true,
        timestamps: false
    });

    const FeedbackTable = database.define('feedback', {
        id: makeId(),
        room_id: { type: Sequelize.INTEGER },
        user_id: { type: Sequelize.INTEGER },
        start_time: { type: Sequelize.DATE },
        description: { type: Sequelize.TEXT },
    }, {
        freezeTableName: true,
        timestamps: false
    });

    ConversationState.belongsTo(BotUserTable, { foreignKey: 'user_id' });
    ClassBookingTable.belongsTo(RoomTable, { foreignKey: 'room_id' });
    UserBookingTable.belongsTo(RoomTable, { foreignKey: 'room_id' });
    UserBookingTable.belongsTo(BotUserTable, { foreignKey: 'user_id' });
    FeedbackTable.belongsTo(RoomTable, { foreignKey: 'room_id' });
    FeedbackTable.belongsTo(BotUserTable, { foreignKey: 'user_id' });

    return new Map([
        ['room', RoomTable],
        ['user', BotUserTable],
        ['state', ConversationState],
        ['classBooking', ClassBookingTable],
        ['userBooking', UserBookingTable],
        ['feedback', FeedbackTable],
    ]);
}
