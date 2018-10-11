// @flow
export type Config = {
    port?: number,
    name: string,
    logLevel: string,
    wit: { ACCESS_TOKEN: string | null },
    db: {
        HOST: string,
        DATABASE: string,
        USERNAME: string,
        PASSWORD: string,
    },
    facebook: {
        PAGE_ACCESS_TOKEN: string,
        VERIFY_TOKEN: string,
        APP_SECRET: string,
        APP_ID: string,
    },
};
