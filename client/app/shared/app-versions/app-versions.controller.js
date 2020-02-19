export default function appVersionController($rootScope) {
    'ngInject';

    const vm = {
        uiVersion: null,
        serverVersion: null,
        clientVersion: null,

        get versions() { return $rootScope.version; },
    }

    return vm;
}
