export class Configs {


    constructor() {

    }

    public getConfigFor(env: String, market: String) {
        if (env == 'sandbox' && market == 'M1') {
            return this.M1;
        }

        throw new Error('market and env combination does not exist');
    }

    M1 = {
        // REALM
        realmName: '',

        // SESSION
        accessTokenLifespan: 300,
        ssoSessionIdleTimeout: 1800,

        // JS CLIENT
        clients: [
        {
            jsClientId: '',
            redirectUris: ['http://localhost:3000/*'],
            defaultClientScopes: ['email', 'profile'],
            optionalClientScopes: ['microprofile-jwt', 'offline_access'],
        }
    ],

        // THEME
        // loginTheme: ''

        // LANGUAGE
        internationalizationEnabled: true,
        supportedLocales: ['en'],

        // IDP
        idps: [
            {
                alias: '',
                displayName: '',
                // firstBrokerLoginFlowAlias: 'FirstBrokerLoginAutomaticAccountLink',
                providerId: 'keycloak-oidc',
                config: {
                    'authorizationUrl': '',
                    'tokenUrl': '',
                    'userInfoUrl': '',
                    'loginHint': 'true',
                    // 'uiLocales':'true'
                    'defaultScope': 'email',
                    'clientAuthMethod': 'client_secret_post',
                    'clientId': '',
                    'clientSecret': '',
                },
            }],
    };
}

