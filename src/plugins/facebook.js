// @flow
import crypto from 'crypto';
import type Facebook from '~/service/facebook';
import type {
    NextFn,
    Request,
    Response,
} from '~/util/http';

const instance = Symbol('facebook-helper');

/**
 * Utility to get the Facebook object
 * @param {Request} request request object
 * @returns {Facebook} the requested Facebook object
 */
export function getHelper (request: Request): Facebook {
    return (request: any)[instance];
}

/**
 * Handle the signature verification so that Facebook doesn't complain (ensures verified bot <-> FB comms)
 * @param {string} secrect to be used in SHA-1 crypto
 * @param {Request} request request object
 * @param {Response} response response object
 * @returns {boolean} true if the signature is good, false if not
 */
function handleSignatureVerification (secrect: string, request: Request, response: Response): boolean {
    const signature = request.headers['x-hub-signature'];

    if (signature == null) {
        console.error('Signature is missing');
        response.status(500);
        response.end();
        return false;
    }
    else {
        const hash = crypto.createHmac('sha1', secrect)
            .update(JSON.stringify(request.body))
            .digest('hex');
        if (hash !== signature.split('=')[1]) {
            response.status(500);
            response.end();
            return false;
        }
        return true;
    }
}

type Config = { verifySignature: boolean }

/**
 * Sets the Facebook object to a symbol field so it's only accessible via the function getHelper.
 * @param {Facebook} facebook Facebook object
 */
export default function (facebook: Facebook, { verifySignature = false }: Config = {}) {
    return function (request: Request, response: Response, next: NextFn): any {
        (request: any)[instance] = facebook;

        if (verifySignature && request.method === 'POST') {
            const cont = handleSignatureVerification(facebook.APP_SECRET, request, response);
            if (cont) next();
        }
        else {
            next();
        }
    };
}
