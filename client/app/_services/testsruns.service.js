(function () {
    'use strict';

    angular
        .module('app.services')
    .factory('testsRunsService', [
        'TestRunService',
        '$q',
        'DEFAULT_SC',
        'SettingsService',
        'UtilService',
        'ConfigService',
        testsRunsService]);

    function testsRunsService(TestRunService, $q, DEFAULT_SC, SettingsService, UtilService,
                              ConfigService) {
        const searchTypes = ['testSuite', 'executionURL', 'appVersion'];
        let _lastResult = null;
        let _lastParams = null;
        let _lastFilters = null;
        let _activeFilterId = null;
        let _activeSearchType = searchTypes[0];
        let _searchParams = angular.copy(DEFAULT_SC);
        let _activeFilteringTool = null;

        return  {
            getSearchTypes: getSearchTypes,
            fetchTestRuns: fetchTestRuns,
            addBrowserVersion: addBrowserVersion,
            getLastSearchParams: getLastSearchParams,
            getActiveFilter: getActiveFilter,
            setActiveFilter: setActiveFilter,
            resetActiveFilter:resetActiveFilter,
            isFilterActive: isFilterActive,
            isSearchActive: isSearchActive,
            setSearchParam: setSearchParam,
            getSearchParam: getSearchParam,
            deleteSearchParam: deleteSearchParam,
            setActiveFilteringTool: setActiveFilteringTool,
            getActiveFilteringTool: getActiveFilteringTool,
            deleteActiveFilteringTool,
            resetFilteringState: resetFilteringState,
            readStoredParams: readStoredParams,
            deleteStoredParams: deleteStoredParams,
            clearDataCache: clearDataCache,
            addNewTestRun: addNewTestRun,
            updateTestRun: updateTestRun,
        };

        function getSearchTypes() {
            return searchTypes;
        }

        function fetchTestRuns() {
            _activeFilterId && (_searchParams.filterId = _activeFilterId);

            // save search params
            deleteStoredParams();
            storeParams();
            _lastParams = angular.copy(_searchParams);

            return TestRunService.searchTestRuns(_searchParams)
                .then(function(rs) {
                    if (rs.success) {
                        const data = rs.data;

                        data.results = data.results || [];
                        data.results.forEach(function(testRun) {
                            addBrowserVersion(testRun);
                            addJob(testRun);
                            testRun.tests = null;
                        });
                        _lastResult = data;

                        return $q.resolve(_lastResult);
                    } else {
                        console.error(rs.message);
                        return $q.reject(rs);
                    }
                });

        }

        function getLastSearchParams() {
            return _lastParams;
        }

        function addBrowserVersion(testRun) {
            const platform = testRun.platform ? testRun.platform.split(' ') : [];
            let version = null;

            if (platform.length > 1) {
                version = 'v.' + platform[1];
            }

            if (!version && testRun.config && testRun.config.browserVersion !== '*') {
                version = testRun.config.browserVersion;
            }

            testRun.browserVersion = version;
        }

        function addJob(testRun) {
            if (testRun.job && testRun.job.jobURL) {
                testRun.jenkinsURL = testRun.job.jobURL + '/' + testRun.buildNumber;
                testRun.UID = testRun.testSuite.name + ' ' + testRun.jenkinsURL;
            }
        }

        function setActiveFilter(id) {
            _activeFilterId = id;
        }

        function resetActiveFilter() {
            _activeFilterId = null;
        }

        function getActiveFilter() {
            return _activeFilterId;
        }

        function resetSearchParams() {
            _searchParams = angular.copy(DEFAULT_SC);
            _lastParams = null;
        }

        function setSearchParam(name, value) {
            _searchParams[name] = value;
        }

        function getSearchParam(name) {
            return _searchParams[name];
        }

        function deleteSearchParam(name) {
            delete _searchParams[name];
        }

        function setActiveFilteringTool(tool) {
            _activeFilteringTool = tool;
        }

        function getActiveFilteringTool() {
            return _activeFilteringTool;
        }

        function deleteActiveFilteringTool() {
            _activeFilteringTool = null;
        }

        function isFilterActive() {
            return _searchParams.hasOwnProperty('filterId');
        }

        function isSearchActive() {
            return !isFilterActive() && !angular.equals(_searchParams, DEFAULT_SC);
        }

        function resetFilteringState(keepSearchType) {
            !keepSearchType && deleteActiveFilteringTool();
            resetSearchParams();
            resetActiveFilter();
        }
        
        function storeParams() {
            sessionStorage.setItem('searchParams', angular.toJson(_searchParams));
            getActiveFilteringTool() && sessionStorage.setItem('activeFilteringTool', _activeFilteringTool);
            _activeFilterId && sessionStorage.setItem('activeFilterId', _activeFilterId);
        }

        function deleteStoredParams() {
            sessionStorage.removeItem('searchParams');
            sessionStorage.removeItem('activeFilteringTool');
            sessionStorage.removeItem('activeFilterId');
        }

        function readStoredParams() {
            const params = sessionStorage.getItem('searchParams');
            // const filteringTool = sessionStorage.getItem('activeFilteringTool');

            // console.log(filteringTool);

            params && (_searchParams = angular.fromJson(params)) && (_lastParams = _searchParams);

            // if (filteringTool) {
            //     setActiveFilteringTool(filteringTool);
            //     if (filteringTool === 'filter') {
            //         const filterId = sessionStorage.getItem('activeFilterId');
            //
            //         filterId && setActiveFilter(+filterId);
            //     }
            // }
        }

        function addNewTestRun(testRun) {
            addBrowserVersion(testRun);
            addJob(testRun);
            testRun.tests = null;

            if (_lastResult.results.length === _searchParams.pageSize) {
                _lastResult.results.splice(-1);
            }
            _lastResult.results = [testRun].concat(_lastResult.results);

            return _lastResult.results;
        }

        function updateTestRun(index, data) {
            const testRun = _lastResult.results[index];

            data = data || {};
            if (testRun) {
                Object.keys(data).forEach(function(key) {
                    testRun[key] = data[key];
                });
            }

            return _lastResult.results;
        }

        function clearDataCache() {
            _lastResult = null;
        }
    }
})();
