import { RequiredActionAlias } from './defs/requiredActionProviderRepresentation';
import { KeycloakAdminClient } from './client';
import {Configs} from './a_configs/configs';
import {Executor} from './a_setup/executor';
import { exec } from 'child_process';

export const requiredAction = RequiredActionAlias;
export default KeycloakAdminClient;

console.log('---> RUNNING FOR LOGIN URL', process.env.IL_BR_KC_LOGIN_URL);
console.log('---> RUNNING FOR REALM', process.env.IL_BR_KC_LOGIN_REALM);
console.log('---> RUNNING FOR USER', process.env.IL_BR_KC_USR);

const connectionConfigs = {
    baseUrl: process.env.IL_BR_KC_LOGIN_URL,
    realmName: process.env.IL_BR_KC_LOGIN_REALM,
    username: process.env.IL_BR_KC_USR,
    password: process.env.IL_BR_KC_PWD,
};

var configs = new Configs().getConfigFor('sandbox', 'product');

start();

async function start() {

    var executor = new Executor(configs, connectionConfigs);

    var result = await executor.Go();

    console.log('STOP RUNNING: ' + result);
}
