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
            realmName: connectionConfigs.realmName
        });;
    }

    public async Go() {
        await this.client.auth({
            username: this.connectionConfigs.username,
            password: this.connectionConfigs.password,
            grantType: 'password',
            clientId: 'admin-cli',
            //totp: '007880', 
        });

        var realm = await this.GetOrCreateRealm();

        this.client.setConfig({
            realmName: this.configs.realmName,
        });

        var client = await this.GetOrCreateClient();

        this.ConfigureIdps();
    }

    ConfigureIdps() {
        this.configs.idps.forEach(async (idp) => {
            await this.client.identityProviders.create({
                alias: idp.alias,
                displayName: idp.displayName,
                //firstBrokerLoginFlowAlias: idp.firstBrokerLoginFlowAlias,
                providerId: idp.providerId,
                config: idp.config
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
        });
    }

    async GetOrCreateClient() {
        console.log('----> Js Client setup');
        var jsClients = await this.client.clients.find();
        var jsClient = jsClients.find(c => c.clientId == this.configs.jsClientId);
        // var jsClient = await kcAdminClient.clients.find({ c=>c.clientId == configs.jsClientId });
        if (jsClient == null) {
            console.log('Creating new client');
            await this.client.clients.create({
                clientId: this.configs.jsClientId,
                redirectUris: this.configs.redirectUris,
                webOrigins: ['+'],
                defaultClientScopes: this.configs.defaultClientScopes,
                optionalClientScopes: this.configs.optionalClientScopes,
                protocolMappers: this.getClientProtocolMappers(),
                publicClient: true
            });
        }
        else {
            console.log('Using existing client');
        }

        return jsClient;
    }

    async GetOrCreateRealm() {
        var clientRealm = await this.client.realms.findOne({ realm: this.configs.realmName });
        if (clientRealm == null) {
            console.log('Creating new realm');
            await this.client.realms.create({
                realm: this.configs.realmName,
                enabled: true,
                accessTokenLifespan: this.configs.accessTokenLifespan,
                ssoSessionIdleTimeout: this.configs.ssoSessionIdleTimeout,
                internationalizationEnabled: this.configs.internationalizationEnabled,
                supportedLocales: this.configs.supportedLocales
            });
            clientRealm = await this.client.realms.findOne({ realm: this.configs.realmName });
        }
        else {
            return console.log('Using existing realm');
        }

        return clientRealm;
    }

    getClientProtocolMappers() {
        var IdpSubTokenMapper = {
            name: 'IdpSubTokenMapper',
            protocol: 'openid-connect',
            protocolMapper: 'oidc-usermodel-attribute-mapper',
            config: {
                'user.attribute': 'idpSub',
                'claim.name': 'sub',
                'jsonType.label': 'String',
                'access.token.claim': 'true',
                'id.token.claim': 'true',
                'userinfo.token.claim': 'true'

            },
        };

        var IdpAlias = {
            name: 'IdpAlias',
            protocol: 'openid-connect',
            protocolMapper: 'oidc-usersessionmodel-note-mapper',
            config: {
                'user.session.note': 'identity_provider',
                'claim.name': 'entryname',
                'jsonType.label': 'String',
                'access.token.claim': 'true',
                'id.token.claim': 'true'
            },
        };
        var AudienceTokenMapper = {
            name: 'AudienceTokenMapper',
            protocol: 'openid-connect',
            protocolMapper: 'oidc-audience-mapper',
            config: {
                'user.session.note': 'identity_provider',
                'included.client.audience': this.configs.jsClientId,
                'id.token.claim': 'true'
            },
        };

        return [IdpSubTokenMapper, IdpAlias, AudienceTokenMapper];
    }
}