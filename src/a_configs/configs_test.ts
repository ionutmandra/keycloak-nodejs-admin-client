export class Configs {


    constructor() {

    }

    public getConfigFor(env: String, market: String) {
        if(env=='sandbox' && market =='mkt'){
            return this.C1;
        }

        throw 'market and env combination does not exist';
    }

    C1 = {
        //REALM
        realmName: 'rname',

        //SESSION
        accessTokenLifespan: 300,
        ssoSessionIdleTimeout: 1800,

        //JS CLIENT
        jsClientId: 'client1',
        redirectUris: ['http://localhost:3001/*'],
        defaultClientScopes: ['email', 'profile'],
        optionalClientScopes: ['microprofile-jwt', 'offline_access'],

        //THEME
        //loginTheme: 'thname'

        //LANGUAGE
        internationalizationEnabled: true,
        supportedLocales: ['en'],

        //IDP
        idps: [
            {
                alias: 'idp1',
                displayName: 'idp1',
                //firstBrokerLoginFlowAlias: 'FirstBrokerLoginAutomaticAccountLink',
                providerId: 'keycloak-oidc',
                config: {
                    'authorizationUrl': '...',
                    'tokenUrl': '...',
                    'userInfoUrl': '...',
                    'loginHint': 'true',
                    //'uiLocales':'true'
                    'defaultScope': 'email',
                    'clientAuthMethod': 'client_secret_post',
                    'clientId': '...',
                    'clientSecret': '...'
                }
            },
            {
                alias: 'idp2',
                displayName: 'idp2',
                //firstBrokerLoginFlowAlias: 'FirstBrokerLoginAutomaticAccountLink',
                providerId: 'keycloak-oidc',
                config: {
                    'authorizationUrl': '...',
                    'tokenUrl': '...',
                    'userInfoUrl': '...',
                    'loginHint': 'true',
                    //'uiLocales':'true'
                    'defaultScope': 'email',
                    'clientAuthMethod': 'client_secret_post',
                    'clientId': '...',
                    'clientSecret': '...'
                }
            }]
    };
}