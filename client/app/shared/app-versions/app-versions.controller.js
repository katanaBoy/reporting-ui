export default function appVersionController($rootScope) {
    'ngInject';

    const vm = {
        uiVersion: null,
        serverVersion: null,
        clientVersion: null,

        get versions() { return $rootScope.version; },

        $onInit: init,
    }

    function init() {
        if ($rootScope) {
            const { client, service, ui } = vm.versions;
    
            vm.uiVersion = ui;
            vm.serverVersion = service;
            vm.clientVersion = client;
        }
    }

    return vm;
}

