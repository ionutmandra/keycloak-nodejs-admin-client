import { KeycloakAdminClient } from '../client';

export class Executor {
    configs: any;
    connectionConfigs: any;
    client: KeycloakAdminClient;

    constructor(configs, connectionConfigs) {
        this.configs = configs;
        this.connectionConfigs = connectionConfigs;
        this.client = new KeycloakAdminClient({
            baseUrl: connectionConfigs.baseUrl,
            realmName: connectionConfigs.realmName,
        });
    }

    public async Go() {
        await this.client.auth({
            username: this.connectionConfigs.username,
            password: this.connectionConfigs.password,
            grantType: 'password',
            clientId: 'admin-cli',
            // totp: '007880',
        });

        let realm = await this.GetOrCreateRealm();

        this.client.setConfig({
            realmName: this.configs.realmName,
        });

        await this.GetOrCreateClients();

        await this.ConfigureIdps();
    }

    async ConfigureIdps() {

        console.log('-----> configuring IDPS');

        for (const idp of this.configs.idps) {

            var existingIdp = await this.client.identityProviders.findOne({ alias: idp.alias });
            if (existingIdp == null) {
                console.log('creating Idp ' + idp.alias);
                await this.client.identityProviders.create({
                    alias: idp.alias,
                    displayName: idp.displayName,
                    firstBrokerLoginFlowAlias: idp.firstBrokerLoginFlowAlias,
                    providerId: idp.providerId,
                    config: idp.config,
                });
                const subMapper = {
                    name: 'SubMapper',
                    identityProviderAlias: idp.alias,
                    identityProviderMapper: 'oidc-user-attribute-idp-mapper',
                    config: {
                        'user.attribute': 'idpSub',
                        'claim': 'sub',
                    },
                };
                const idpSubMapper = await this.client.identityProviders.createMapper({
                    alias: idp.alias,
                    identityProviderMapper: subMapper,
                });
                // const useNameMapper = {
                //     name: 'UserNameMapper',
                //     identityProviderAlias: idp.alias,
                //     identityProviderMapper: 'oidc-username-idp-mapper',
                //     config: {
                //         'template': '${CLAIM.email}',
                //     },
                // };
                // const idpUsernameMapper = await this.client.identityProviders.createMapper({
                //     alias: idp.alias,
                //     identityProviderMapper: useNameMapper,
                // });
            }
            else{
                console.log('Idp already existing: ' + idp.alias);
            }
        });
    }

    async GetOrCreateClients() {
        console.log('----> Js Client setup');
        let jsClients = await this.client.clients.find();
        
        for (const client of this.configs.clients) {
            let jsClient = jsClients.find(c => c.clientId == client.jsClientId);
            // var jsClient = await kcAdminClient.clients.find({ c=>c.clientId == configs.jsClientId });
            if (jsClient == null) {
                console.log('Creating new client ' + client.jsClientId);
                await this.client.clients.create({
                    clientId: client.jsClientId,
                    redirectUris: client.redirectUris,
                    webOrigins: ['+'],
                    defaultClientScopes: client.defaultClientScopes,
                    optionalClientScopes: client.optionalClientScopes,
                    protocolMappers: this.getClientProtocolMappers(client.jsClientId),
                    publicClient: true,
                });
            }
            else {
                console.log(client.jsClientId + ' already existing');
            }
        });
    }

    async GetOrCreateRealm() {
        let clientRealm = await this.client.realms.findOne({ realm: this.configs.realmName });
        if (clientRealm == null) {
            console.log('Creating new realm');
            await this.client.realms.create({
                realm: this.configs.realmName,
                enabled: true,
                accessTokenLifespan: this.configs.accessTokenLifespan,
                ssoSessionIdleTimeout: this.configs.ssoSessionIdleTimeout,
                internationalizationEnabled: this.configs.internationalizationEnabled,
                supportedLocales: this.configs.supportedLocales,
            });
            clientRealm = await this.client.realms.findOne({ realm: this.configs.realmName });
        }
        else {
            return console.log('Using existing realm');
        }

        return clientRealm;
    }

    getClientProtocolMappers(jsClientId) {
        let IdpSubTokenMapper = {
            name: 'IdpSubTokenMapper',
            protocol: 'openid-connect',
            protocolMapper: 'oidc-usermodel-attribute-mapper',
            config: {
                'user.attribute': 'idpSub',
                'claim.name': 'sub',
                'jsonType.label': 'String',
                'access.token.claim': 'true',
                'id.token.claim': 'true',
                'userinfo.token.claim': 'true',

            },
        };

        let IdpAlias = {
            name: 'IdpAlias',
            protocol: 'openid-connect',
            protocolMapper: 'oidc-usersessionmodel-note-mapper',
            config: {
                'user.session.note': 'identity_provider',
                'claim.name': 'entryname',
                'jsonType.label': 'String',
                'access.token.claim': 'true',
                'id.token.claim': 'true',
            },
        };
        let AudienceTokenMapper = {
            name: 'AudienceTokenMapper',
            protocol: 'openid-connect',
            protocolMapper: 'oidc-audience-mapper',
            config: {
                'user.session.note': 'identity_provider',
                'included.client.audience': jsClientId,
                'id.token.claim': 'true',
            },
        };

        return [IdpSubTokenMapper, AudienceTokenMapper];
    }
}