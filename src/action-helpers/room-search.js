import type { Context } from '~/service/dispatcher/context';

import type { Location } from '~/service/facebook/types';

import type { Availability } from '~/service/database/types';

import { stripPadding } from '~/util/strings';


type Pagination = { offset: number, limit: number };

/*
 * The possible branches for search based on database from step 3
 */
type SearchConstraints
    = {| type: 'with-geo', pagination: Pagination, from: Date, location: Location |}
    | {| type: 'no-geo', pagination: Pagination, from: Date |}

/**
 * Query for available rooms, by using a set of constraints - as well as ranking based on room suitability, etc.
 * @param {Context} context application context
 * @param {SearchConstraints} s search constraints for the query
 * @returns {Promise<Array<Availability>>} promise eventuating to Array<Availability>
 */
export function queryRoom (context: Context, s: SearchConstraints): Promise<Array<Availability>> {
    // modify the stracted hours to test after hours
    const subtractedHours = 0;

    switch (s.type) {
        case 'with-geo':
            return (context.database.query(stripPadding(`
                SELECT a.*
                     , wl.unsw_room_number
                     , wl.unsw_building_name
                     , wl.unsw_map_position
                     , wl.location_lat
                     , wl.location_long
                     , wl.student_vip_room_link
                     , wl.student_vip_building_link
                  FROM room_whitelist as wl
                  LEFT JOIN time_still_open(
                      ((:date) at time zone 'Australia/Sydney') - interval '${subtractedHours} hours'
                    ) AS a
                    ON a.room_id = wl.id
                  LEFT JOIN room_rank(:latitude, :longitude) as r
                    ON r.room_id = a.room_id
                 WHERE a.room_id IS NOT NULL
                 ORDER BY r.rank
                OFFSET :offset ROWS
                 LIMIT :limit
            `), {
                latitude: s.location.lat,
                longitude: s.location.long,
                date: s.from.toISOString(),
                offset: s.pagination.offset * s.pagination.limit,
                limit: s.pagination.limit,
            }): any);
        case 'no-geo':
            return (context.database.query(stripPadding(`
                SELECT a.*
                     , wl.unsw_room_number
                     , wl.unsw_building_name
                     , wl.unsw_map_position
                     , wl.location_lat
                     , wl.location_long
                     , wl.student_vip_room_link
                     , wl.student_vip_building_link
                  FROM room_whitelist as wl
                  LEFT JOIN time_still_open(
                      ((:date) at time zone 'Australia/Sydney') - interval '${subtractedHours} hours'
                    ) AS a
                    ON a.room_id = wl.id
                  LEFT JOIN room_random_rank() as r
                    ON r.room_id = a.room_id
                 WHERE a.room_id IS NOT NULL
                 ORDER BY r.rank
                OFFSET :offset ROWS
                 LIMIT :limit
            `), {
                date: s.from.toISOString(),
                offset: s.pagination.offset * s.pagination.limit,
                limit: s.pagination.limit,
            }): any);
        default:
            return Promise.reject(new TypeError('unimplemented branch'));
    }
}
