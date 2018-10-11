import { verifyRequest } from '~/routes/register_webhook';


test('correctly registers hook', (done) => {
    const challenge = '🔫';
    const verifyToken = '😂';

    const result = verifyRequest(verifyToken, {
        query: {
            'hub.mode': 'subscribe',
            'hub.challenge': challenge,
            'hub.verify_token': verifyToken,
        },
    });

    // check the state changes.
    expect(result.end).toEqual(challenge);
    expect(result.status).toEqual(200);

    done();
});

test('incorrectly registered hook', (done) => {
    const challenge = '🔫';
    const verifyToken = '😂';

    const result = verifyRequest('???', {
        query: {
            'hub.mode': 'subscribe',
            'hub.challenge': challenge,
            'hub.verify_token': verifyToken,
        },
    });

    // check the state changes.
    expect(result.end).toEqual(null);
    expect(result.status).toEqual(403);

    done();
});

test('missing query body', (done) => {
    const result = verifyRequest('???', {});

    // check the state changes.
    expect(result.end).toEqual(null);
    expect(result.status).toEqual(400);

    done();
});
