// @flow
import menu from '~/service/facebook/menu-builder';

const simplePayload = name =>
    JSON.stringify({ type: name });

test('build empty menu', (done) => {
    const m = menu();

    expect(m.build()).toEqual({
        locale: 'default',
        composer_input_disabled: false,
        call_to_actions: [],
    });

    done();
});

test('build menu with postbacks', (done) => {
    const m = menu()
        .callToAction('postback', 'Hello world', { type: 'INIT' })
        .callToAction('postback', 'Help', { type: 'INIT' });

    expect(m.build()).toEqual({
        locale: 'default',
        composer_input_disabled: false,
        call_to_actions: [{
            title: 'Hello world',
            type: 'postback',
            payload: simplePayload('INIT'),
        }, {
            title: 'Help',
            type: 'postback',
            payload: simplePayload('INIT'),
        }],
    });

    done();
});

test('build menu with nestings', (done) => {
    const m = menu()
        .callToAction('nested', '1', s =>
            s.callToAction('postback', 'what', { type: 'INIT' }));

    expect(m.build()).toEqual({
        locale: 'default',
        composer_input_disabled: false,
        call_to_actions: [{
            title: '1',
            type: 'nested',
            call_to_actions: [{
                title: 'what',
                type: 'postback',
                payload: simplePayload('INIT'),
            }],
        }],
    });

    done();
});
