export type ModelName
    = 'room'
    | 'user'
    | 'user_booking'
    | 'class_booking'
    | 'conversation_state'
    | 'feedback'

export interface PGInterval {
    hours?: number;
    minutes?: number;
    seconds?: number;
    milliseconds?: number;
}

export interface Availablity {
    room_id: number;
    room_open_at: string;
    till_available: PGInterval;
    availablity: PGInterval;
    unsw_room_number: string;
    unsw_map_position: string;
    unsw_building_name: string;
    location_lat: number;
    location_long: number;
    student_vip_room_link: string;
    student_vip_building_link: string;
}

export interface State {
    id: number;
    user_id: number;
    created: Date;
    state: number;
    data: Object;
}

export interface BotUser {
    id: number;
    facebook_id: string;
}

export interface Room {
    id: number;

    location_lat: number;
    location_long: number;

    room_name: string;
    capacity: string;
    student_vip_link: string;

    unsw_room_number: string;
    unsw_building_name: string;
    unsw_map_position: string;
}

export interface ClassRoomBooking {
    id: number;
    room_id: number;
    end_time: Date;
    start_time: Date;
}

export interface UserBooking {
    id: number;
    room_id: number;
    user_id: number;
    end_time: Date;
    start_time: Date;
}

export interface FeedbackTable {
    id: number;
    room_id: number;
    user_id: number;
    start_time: Date;
    description: string;
}

/*
 * Internal model type for sequelize result types.
 *
 * @type Model
 */
export interface Model<T> {
    +dataValues: T;
    +_previousDataValues: T;
    +_changed: T;
    +_modelOptions: {
        +timestamps: boolean,
        +name: { plural: string, singular: string },
    };
    +_options: { attributes: Array<string> };
    +isNewRecord: boolean;

    // eslint-disable-next-line no-undef
    get (field: $Keys<T>, options: ?Object): any;
    get (): T;
}
