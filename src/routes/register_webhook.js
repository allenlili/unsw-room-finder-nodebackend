// @flow
import type {
    Exit,
    Request,
    Response,
} from '~/util/http';
import { getConfig } from '~/plugins/config';
import { getLogger } from '~/plugins/logger';
import { getHelper as getFacebook } from '~/plugins/facebook';

type VerificationResult = { status: number, end: ?string, continue: boolean };

/**
 * Stateless function that determines if the valid way to respond to the request.
 * @param {string} verifyToken provided verification token
 * @param {Request} request request object
 * @returns {VerificationResult} object containing verification data
 */
export function verifyRequest (verifyToken: string, request: Request): VerificationResult {
    if (request.query == null) {
        return { status: 400, end: null, continue: false };
    }

    // if req.query.hub.mode is 'subscribe'
    // and req.query.hub.verify_token is the same as this.VERIFY_TOKEN
    // then send back an HTTP status 200 and req.query.hub.challenge
    const mode = request.query['hub.mode'];
    const verifyTokenQuery = request.query['hub.verify_token'];
    const challenge = request.query['hub.challenge'];

    if (mode === 'subscribe' && verifyToken === verifyTokenQuery) {
        return { status: 200, end: challenge, continue: true };
    }
    else {
        return { status: 403, end: null, continue: false };
    }
}

/**
 * Check and return the appropriate Exit object.
 * @param {VerificationResult} result result of the verification
 * @returns {Exit} object
 */
function resultToExit (result: VerificationResult): Exit {
    const status = result.status;
    const end = result.end;
    return end != null
        ? { type: 'reply', status, end }
        : { type: 'reply', status };
}

/**
 * Check and return the appropriate Exit object.
 * @param {Request} request request object
 * @param {Response} response response object
 * @returns {Promise<Exit>} promise eventuating to Exit
 */
export default async function (request: Request, response: Response): Promise<Exit> {
    // if unsucessful the request will end here, otherwise it'll
    // perform the postback request.
    const logger = getLogger(request);
    const config = getConfig(request);
    const result = verifyRequest(config.facebook.VERIFY_TOKEN, request);

    logger.info('setup > verifying registration');
    if (!result.continue) return resultToExit(result);

    // sets up the persistent menu at the start & defines
    // postback payloads.
    try {
        const facebook = getFacebook(request);
        await facebook.configureProfile();
        return resultToExit(result);
    }
    catch (e) {
        logger.error(e.data);
        logger.error(e);
        return { type: 'reply', status: 500 };
    }
}
