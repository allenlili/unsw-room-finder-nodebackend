// @flow
import type { PostbackType, SendMessage, Location } from '~/service/facebook/types';


////////////////////////////////////////////////////

type LocationConfig = {
    +latitude: number,
    +longitude: number,
};


/**
 * Construct the map links for various devices, based on provided co-ordinates.
 * @param {string} lat provided latitude
 * @param {string} long provided longitude
 * @returns {Object} completed map data
 */
function makeMapLinks (lat, long) {
    const googlePrefiex = `https://maps.googleapis.com/maps/api/staticmap?size=764x400`;
    const googleImage = `${googlePrefiex}&center=${lat},${long}&zoom=17&markers=${lat},${long}`;

    const google = `https://www.google.com/maps/search/?api=1&query=${lat},${long}`;
    const apple = `http://maps.apple.com/maps?q=${lat},${long}&z=16`;
    return { apple, google, googleImage };
}

////////////////////////////////////////////////////

type TemplateConfig
    = { type: 'location', location: Location, title?: string, subtitle?: string }
    | { type: 'text', text: string }

type ButtonType
    = { type: 'postback', label: string, payload: string }
    | { type: 'url', label: string, url: string }

class TemplateBuilder {
    _config: TemplateConfig;
    _buttons: Array<ButtonType>;

    constructor (config: TemplateConfig) {
        this._config = config;
        this._buttons = [];
    }

    /**
     * Add a button to the message.
     * @param {string} label label on the button
     * @param {PostbackType} payload data to be appended to the button
     * @returns {TemplateBuilder} builder that can be built or added to
     */
    addButton (label: string, payload: PostbackType): TemplateBuilder {
        this._buttons.push({
            type: 'postback',
            label,
            payload: JSON.stringify(payload),
        });
        return this;
    }

    /**
     * Add a link button to the message.
     * @param {string} label label on the link button
     * @param {string} url url to be appended to the link button
     * @returns {TemplateBuilder} builder that can be built or added to
     */
    addLinkButton (label: string, url: string) {
        this._buttons.push({ type: 'url', label, url });
        return this;
    }

    _payloadBody (): Object {
        switch (this._config.type) {
            case 'text':
                return { text: this._config.text };

            case 'location': {
                const { title, subtitle, location: { lat, long } } = this._config;
                const { google, googleImage } = makeMapLinks(lat, long);

                return {
                    title,
                    subtitle,
                    image_url: googleImage,
                    default_action: {
                        type: 'web_url',
                        url: google,
                        webview_height_ratio: 'TALL',
                    },
                };
            }
            default: throw new TypeError('now implemented');
        }
    }

    /**
     * Build the complete payload.
     * @returns {Object} built payload that contains all the added data
     */
    buildPayload (): Object {
        return {
            ...this._payloadBody(),
            buttons: this._buttons.map(btn => {
                switch (btn.type) {
                    case 'postback': return ({ title: btn.label, type: 'postback', payload: btn.payload });
                    case 'url': return ({ title: btn.label, type: 'web_url', url: btn.url });
                    default: throw new TypeError('unimplemented');
                }
            }),
        };
    }
}


//////////////////////////////////////////////////

/*
 * Builds a bvutton template.
 */
class ButtonsTemplateBuilder {
    _builder: TemplateBuilder;

    constructor (config: TemplateConfig) {
        this._builder = new TemplateBuilder(config);
    }

    /**
     * Add a link button to the button template.
     * @param {string} label label on the link button
     * @param {string} url url to be appended to the link button
     * @returns {ButtonsTemplateBuilder} builder that can be built or added to
     */
    addLinkButton (label: string, url: string): ButtonsTemplateBuilder {
        this._builder.addLinkButton(label, url);
        return this;
    }

    /**
     * Add a button to the button template.
     * @param {string} label label on the button
     * @param {PostbackType} payload data to be appended to the button
     * @returns {ButtonsTemplateBuilder} builder that can be built or added to
     */
    addButton (label: string, payload: PostbackType): ButtonsTemplateBuilder {
        this._builder.addButton(label, payload);
        return this;
    }

    /**
     * Build the complete payload.
     * @returns {Object} built payload that contains all the added data
     */
    build (): Object {
        return {
            message: {
                attachment: {
                    type: 'template',
                    payload: {
                        template_type: 'button',
                        ...this._builder.buildPayload(),
                    }
                }
            }
        };
    }
}

///////////////////////////////////////////////////

type QuickReply
    = {| content_type: 'text', title: string, payload: string, image_url?: string |}
    | {| content_type: 'location' |}

class QuickReplyBuilder {
    _message: ?string;
    _options: Array<QuickReply>;

    constructor (message: ?string) {
        this._message = message;
        this._options = [];
    }

    /**
     * Add a text option to the quick reply.
     * @param {string} title label on the quick reply
     * @param {PostbackType} payloadObject data to be appended to the quick reply
     * @param {?string} imageUrl data to be appended to the button
     * @returns {QuickReplyBuilder} builder that can be built or added to
     */
    addTextOption (title: string, payloadObject: PostbackType, imageUrl: ?string): QuickReplyBuilder {
        const payload = JSON.stringify(payloadObject);
        const option: QuickReply = { content_type: 'text', title, payload };
        // $FlowTodo
        if (imageUrl != null) option.image_url = imageUrl;
        this._options.push(option);
        return this;
    }

    /**
     * Add a location option to the quick reply.
     * @returns {QuickReplyBuilder} builder that can be built or added to
     */
    addLocationOption () {
        this._options.push({ content_type: 'location' });
        return this;
    }

    /**
     * Build the complete payload.
     * @returns {Object} built payload that contains all the added data
     */
    build (): Object {
        return {
            message: {
                text: this._message,
                quick_replies: this._options,
            },
        };
    }
}

//////////////////////////////////////////////////

class CarouselBuilder {
    _options: Array<TemplateBuilder>;
    _quickReplies: Array<QuickReply>;

    constructor () {
        this._options = [];
        this._quickReplies = [];
    }

    /**
     * Add an option to the carousel.
     * @param {TemplateConfig} config option template config
     * @param {TemplateBuilder} context template builder that is encapsulated within the carousel
     * @returns {CarouselBuilder} builder that can be built or added to
     */
    addOption (config: TemplateConfig, context: (b: TemplateBuilder) => any): CarouselBuilder {
        const builder = new TemplateBuilder(config);
        context(builder);
        this._options.push(builder);
        return this;
    }

    /**
     * Add a quick reply to the carousel.
     * @param {QuickReplyBuilder} context quick reply builder that is encapsulated within the carousel
     * @returns {CarouselBuilder} builder that can be built or added to
     */
    addQuickReplies (context: (q: QuickReplyBuilder) => any): CarouselBuilder {
        const builder = new QuickReplyBuilder();
        context(builder);
        this._quickReplies.push(...builder._options);
        return this;
    }

    /**
     * Build the complete payload.
     * @returns {Object} built payload that contains all the added data
     */
    build (): Object {
        return {
            message: {
                quick_replies: this._quickReplies,
                attachment: {
                    type: 'template',
                    payload: {
                        template_type: 'generic',
                        elements: this._options.map(o => o.buildPayload()),
                    }
                }
            }
        };
    }
}

//////////////////////////////////////////////////

/**
 * Builds a button message to send to the user.
 * @param {string} message message to display on the button
 * @param {ButtonsTemplateBuilder} context button builder for each button
 * @returns {SendMessage} complete message that is ready to send
 */
export function buttonMessage (message: string, context: (b: ButtonsTemplateBuilder) => any): SendMessage {
    const builder = new ButtonsTemplateBuilder({ type: 'text', text: message });
    context(builder);
    return (builder.build(): any);
}

/**
 * Set the quick replies for the bot.
 * @param {string} message message to display on the quick reply.
 * @param {QuickReplyBuilder} context quick reply builder for each quick reply
 * @returns {SendMessage} complete message that is ready to send
 */
export function setQuickReplies (message: string, context: (q: QuickReplyBuilder) => any): SendMessage {
    const builder = new QuickReplyBuilder(message);
    context(builder);
    return (builder.build(): any);
}

/**
 * Builds an option carousel to send to the user.
 * @param {CarouselBuilder} context carousel builder for each component of the carousel
 * @returns {SendMessage} complete message that is ready to send
 */
export function optionCarousel (context: (b: CarouselBuilder) => any): SendMessage {
    const builder = new CarouselBuilder();
    context(builder);
    return (builder.build(): any);
}

/**
 * Builds a message with attached location to send to the user.
 * @param {string} title title to display on the location message
 * @param {LocationConfig} config location data config
 * @returns {SendMessage} complete message that is ready to send
 */
export function messageWithLocation (title: string, config: LocationConfig): SendMessage {
    const { latitude, longitude } = config;
    const { google, googleImage } = makeMapLinks(latitude, longitude);

    // https://stackoverflow.com/a/38246806/1782119
    return ({
        message: {
            attachment: {
                type: 'template',
                payload: {
                    template_type: 'generic',
                    elements: {
                        element: {
                            title,
                            image_url: googleImage,
                            item_url: google,
                        },
                    },
                },
            },
        }
    }: any);
}

