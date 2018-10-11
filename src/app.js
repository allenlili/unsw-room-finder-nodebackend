import 'babel-polyfill';
import restify from 'restify';
import { createLogger } from 'bunyan';
import fs from 'mz/fs';

import setupRoutes from '~/routes';

import setupDatabase from '~/service/database';
import FB from '~/service/facebook';

import configPlugin from '~/plugins/config';
import loggerPlugin from '~/plugins/logger';
import facebookPlugin from '~/plugins/facebook';
import databasePlugin from '~/plugins/database';

import { stripPadding } from '~/util/strings';

// utility function that makes the files equal
// null if they do not exist...
const toNull = () => null;

/**
 * Starts the server on specified port (in config), looks for config file and exposes it to the application, initialises the database/logger, and sets up all the routes/plugins for restify.
 */
(async function () {
    const configLocation = `${process.cwd()}/config/secret.json`;

    if (!await fs.exists(configLocation)) {
        throw new Error(stripPadding(`
             You need to define a file called, config/secret.json
             here you need to define things like your database
             credientials and API keys.
        `));
    }

    const httpsOptions = {};
    const [httpsKey, httpsCert, config] = await Promise.all([
        fs.readFile('/etc/letsencrypt/live/nikleb.ddns.net/privkey.pem').catch(toNull),
        fs.readFile('/etc/letsencrypt/live/nikleb.ddns.net/fullchain.pem').catch(toNull),
        fs.readFile(configLocation).then(::JSON.parse),
    ]);

    if (httpsKey && httpsCert) {
        httpsOptions.key = httpsKey;
        httpsOptions.certificate = httpsCert;
    }

    const logger = createLogger({
        name: 'comp9323s2g2',
        level: config.logLevel || 'info'
    });

    const facebookHelper = FB.create(config);
    const database = setupDatabase(config, logger);

    await database.init();

    const server = restify.createServer({
        name: config.name,
        log: logger,
    });

    server.use(restify.plugins.queryParser());
    server.use(restify.plugins.jsonp());
    server.use(restify.plugins.bodyParser());
    server.use(restify.plugins.requestLogger());
    server.use(loggerPlugin(logger));
    server.use(configPlugin(config));
    server.use(databasePlugin(database));
    server.use(facebookPlugin(facebookHelper, { verifySignature: false }));

    setupRoutes(server);

    const portNumber = config.port || process.env.PORT;
    server.listen(portNumber, async function () {
        logger.info('server is ready');
        try {
            await facebookHelper.configureProfile();
            logger.info('profile reconfigured');
        }
        catch (e) {
            logger.error(e);
        }
    });
})().catch(::console.error);

