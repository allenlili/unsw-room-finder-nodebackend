// @flow
import type { Server } from '~/util/http';

import { asyncHandler } from '~/util/http';
import webhook from '~/routes/webhook';
import register from '~/routes/register_webhook';

/**
 * Sets up the server routes.
 * @param {Server} server server object data
 * @returns {void} nothing
 */
export default function (server: Server): void {
    server.get('/webhook', asyncHandler(register));
    server.post('/webhook', asyncHandler(webhook));
}
