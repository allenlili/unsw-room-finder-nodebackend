// @flow
import type { PostbackType } from '~/service/facebook/types';

type NestedCallback = (menu: NestedCTA) => NestedCTA;
type CTAArgs = ['postback', string, any]
             | ['nested', string, NestedCallback];


/*
 * Super class of the call to actions.
 */
class CTA {
    _title: string;

    constructor (title: string) {
        this._title = title;
    }

    get title (): string {
        return this._title;
    }

    build (): Object {
        throw new Error('not implemented');
    }
}

/*
 * Call to action sub class for a cta with
 * a sub menu.
 */
class NestedCTA extends CTA {
    _nestings: Array<CTA>;

    constructor (title: string) {
        super(title);
        this._nestings = [];
    }

    callToAction (...args: CTAArgs): NestedCTA {
        this._nestings.push(makeCallToAction(...args));
        return this;
    }

    build () {
        return {
            title: this._title,
            type: 'nested',
            call_to_actions: this._nestings.map(cta => cta.build()),
        };
    }
}

/*
 * A call to acion that will perform a postback event
 * when a user clicks on it.
 */
class PostbackCTA extends CTA {
    _payload: PostbackType;

    constructor (title: string, payload: PostbackType) {
        super(title);
        this._payload = payload;
    }

    build () {
        return {
            title: this._title,
            type: 'postback',
            payload: JSON.stringify(this._payload),
        };
    }
}

/**
 * Make a Messenger 'call to action' body object.
 * @param {CTAArgs} args call to action arguments
 * @returns {CTA} complete call to action
 */
function makeCallToAction (...args: CTAArgs): CTA {
    const type = args[0];
    const title = args[1];
    switch (type) {
        case 'postback': {
            const payload: PostbackType = (args[2]: any);
            return new PostbackCTA(title, payload);
        }
        case 'nested': {
            const callback: NestedCallback = (args[2]: any);
            return callback(new NestedCTA(title));
        }
        default:
            throw new Error(`${type}, not implemented`);
    }
}

/*
 * Class for building menus.
 */
export class MenuBuilder {
    _locale: string;
    _disableInput: boolean;
    _callToActions: Array<CTA>;

    constructor (disableInput: boolean, locale: string) {
        this._disableInput = disableInput;
        this._locale = locale;
        this._callToActions = [];
    }

    callToAction (...args: CTAArgs): MenuBuilder {
        this._callToActions.push(makeCallToAction(...args));
        return this;
    }

    build (): Object {
        return {
            locale: this._locale,
            composer_input_disabled: this._disableInput,
            call_to_actions: this._callToActions.map(cta => cta.build()),
        };
    }
}

export default function (disableInput: boolean = false, locale: string = 'default') {
    return new MenuBuilder(disableInput, locale);
}
