// @flow

export type TimeOffset
    = {| type: 'now' |}
    | {| type: 'hours-later', amount: number |}
    | {| type: 'minutes-later', amount: number |}

export interface DateDelta {
    year?: number;
    month?: number;
    date?: number;
    hours?: number;
    minutes?: number;
    seconds?: number;
    milliseconds?: number;
}

type DateAttrKey = $Keys<DateDelta>;

const DATE_PROPERTIES: Array<DateAttrKey> = ['milliseconds', 'seconds', 'minutes', 'hours', 'date', 'month', 'year'];

const PG_TIME_REGEX = /^(\d+):(\d+):(\d+)\.(\d+)$/;
const PG_TIME_REGEX_IFNULL = /^(\d+):(\d+):(\d+)$/;

/**
 * Update a date from a time string.
 * @param {string} timeString new time string
 * @param {Date} date PostgreSQL date object
 * @returns {Date} new date
 */
export function fromPGTimeString (timeString: string, date: Date): Date {
    let match = timeString.match(PG_TIME_REGEX);
    if (match == null) {
        // try this...
        match = timeString.match(PG_TIME_REGEX_IFNULL);
        if (match == null) {
            throw new Error('invalid pg time string');
        }
    }

    const [hours, minutes, seconds, milliseconds] =
        Array.from(match).splice(1).map(regexGroup => parseInt(regexGroup, 10));

    return updateDate(date, { hours, minutes, seconds, milliseconds });
}

/**
 * Check if the dates are equal.
 * @param {Array<Date>} dates all the dates to check
 * @returns {boolean} true if all equal, false if not
 */
export function isEqual (...dates: Array<Date>): boolean {
    if (dates.length < 2) return true;

    const [head, ...tail] = dates;
    const headValue = head.valueOf();

    for (const current of tail) {
        if (headValue !== current.valueOf()) return false;
    }

    return true;
}

/**
 * Add a time delta to a provided date.
 * @param {Date} date original date
 * @param {DateDelta} delta delta to increase by
 * @returns {Date} date with delta applied
 */
export function add (date: Date, delta: DateDelta): Date {
    let update = date;

    for (const attrKey of DATE_PROPERTIES) {
        const attrValue = Reflect.get(delta, attrKey);
        if (attrValue == null) continue;

        const originalValue = get(update, attrKey);
        const updateValue = attrValue + originalValue;
        update = updateDate(update, { [attrKey]: updateValue });
    }

    return update;
}


/**
 * Create a new date object as UTC.
 * @param {Date} date original date
 * @returns {Date} date as UTC
 */
export function createDateAsUTC (date: Date): Date {
    return new Date(
        Date.UTC(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            date.getHours(),
            date.getMinutes(),
            date.getSeconds(),
        ),
    );
}

/**
 * Convert a date object to UTC.
 * @param {Date} date original date
 * @returns {Date} date as UTC
 */
export function convertDateToUTC (date: Date): Date {
    return new Date(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate(),
        date.getUTCHours(),
        date.getUTCMinutes(),
        date.getUTCSeconds(),
    );
}

/**
 * Non destructively offset the date.
 * @param {TimeOffset} timeOffset the value which updates the date object
 * @param {Date} date original date
 * @returns {Date} offset date
 */
export function offsetDate (timeOffset: TimeOffset, date: Date) {
    switch (timeOffset.type) {
        case 'now': return date;
        case 'hours-later': return add(date, { hours: timeOffset.amount });
        case 'minutes-later': return add(date, { minutes: timeOffset.amount });
        default: throw new TypeError(`unimplemented type, ${timeOffset.type}`);
    }
}

/**
 * Non destructively update the date.
 * @param {Date} date original date
 * @param {DateDelta} delta delta to increase by
 * @returns {Date} updated date
 */
export function updateDate (date: Date, delta: DateDelta): Date {
    const firstNumber = (...items: Array<any>): number => (items.find(it => typeof it === 'number'): any);

    return new Date(
        firstNumber(delta.year, date.getFullYear()),
        firstNumber(delta.month, date.getMonth()),
        firstNumber(delta.date, date.getDate()),
        firstNumber(delta.hours, date.getHours()),
        firstNumber(delta.minutes, date.getMinutes()),
        firstNumber(delta.seconds, date.getSeconds()),
        firstNumber(delta.milliseconds, date.getMilliseconds()),
    );
}

/**
 * Get a field within a date object.
 * @param {Date} date date object to query
 * @param {DateAttrKey} field field to get
 * @returns {number} field value
 */
export function get (date: Date, field: DateAttrKey): number {
    switch (field) {
        case 'year': return date.getFullYear();
        case 'month': return date.getMonth();
        case 'date': return date.getDate();
        case 'hours': return date.getHours();
        case 'minutes': return date.getMinutes();
        case 'seconds': return date.getSeconds();
        case 'milliseconds': return date.getMilliseconds();
        default: throw new TypeError('invalid key');
    }
}
