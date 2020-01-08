'use strict'
import SearchModalController from './modal/search-modal.controller';
import modalTemplate from './modal/search-modal.html';

const TestsRunsSearchController = function TestsRunsSearchController(windowWidthService, DEFAULT_SC, testsRunsService, $scope, TestRunService, ProjectService, $q, FilterService, $mdDateRangePicker, $timeout, messageService, $mdDialog) {
    'ngInject';

    const mobileWidth = 600;
    const subjectName = 'TEST_RUN';
    const SELECT_CRITERIAS = ['ENV', 'PLATFORM', 'PROJECT', 'STATUS'];
    const STATUSES = ['PASSED', 'FAILED', 'SKIPPED', 'ABORTED', 'IN_PROGRESS', 'QUEUED', 'UNKNOWN'];
    let scrollTickingTimeout = null;
    const scrollablePerentElement = document.querySelector('.page-wrapper');

    const vm = {
        isMobile: windowWidthService.isMobile,
        isMobileSearchActive: false,
        fastSearchBlockExpand: false,
        isFilterActive: testsRunsService.isFilterActive,
        isSearchActive: testsRunsService.isSearchActive,
        isOnlyAdditionalSearchActive: testsRunsService.isOnlyAdditionalSearchActive,
        fastSearch: {},
        statuses: STATUSES,
        scrollTicking: false,
        selectedRange: {
            selectedTemplate: null,
            selectedTemplateName: null,
            dateStart: null,
            dateEnd: null,
            showTemplate: false,
            fullscreen: false
        },
        getActiveSearchType: testsRunsService.getActiveSearchType,
        searchParams: testsRunsService.getLastSearchParams(),
        isModalSearchActive: testsRunsService.isSearchActive,
        onChangeSearchCriteria: onChangeSearchCriteria,
        openDatePicker: openDatePicker,
        onReset: onReset,
        showSearchFilters: showSearchFilters,
        showAdvancedSearchFilters: false,
        closeModal: closeModal,
        showSearchDialog: showSearchDialog,
        onApply: onApply,
    };

    vm.$onInit = init;

    return vm;

    function init() {
        vm.fastSearchBlockExpand = true;
        loadFilters();
        readStoredParams();
        bindEventListeners();
    }

    function closeModal() {
        $mdDialog.cancel();
    };


    function showSearchDialog(event) {
        $mdDialog.show({
            controller: SearchModalController,
            template: modalTemplate,
            parent: angular.element(document.body),
            targetEvent: event,
            fullscreen: true,
            controllerAs: '$ctrl',
            bindToController: true,
            onComplete: () => {
                $(window).on('resize.searchDialog',() => {
                    if ($(window).width() >= mobileWidth) {
                        vm.closeModal();
                    }
                })
            },
            onRemoving: () => {
                $(window).off('resize.searchDialog');
            },
            locals: {
                onReset: vm.onReset,
                onApply: vm.onApply,
                environments: vm.environments,
                platforms: vm.platforms,
                allProjects: vm.allProjects,
            }
        });
    }

    function readStoredParams() {
        if (vm.isSearchActive()) {
            let fromDate = testsRunsService.getSearchParam('fromDate');
            let toDate = testsRunsService.getSearchParam('toDate');
            const date = testsRunsService.getSearchParam('date');
            const selectedTemplateName = testsRunsService.getSearchParam('selectedTemplateName');

            date && (fromDate = toDate = date);
            fromDate && (vm.selectedRange.dateStart = new Date(fromDate));
            toDate && (vm.selectedRange.dateEnd = new Date(toDate));
            selectedTemplateName && (vm.selectedRange.selectedTemplateName = selectedTemplateName);

            testsRunsService.getSearchTypes().forEach(function(type) {
                const searchValue = testsRunsService.getSearchParam(type);

                searchValue && (vm.fastSearch[type] = searchValue);
            });
        }
    }

    function onReset() {
        vm.selectedRange.dateStart = null;
        vm.selectedRange.dateEnd = null;
        vm.selectedRange.selectedTemplate = null;
        vm.selectedRange.selectedTemplateName = null;
        vm.searchParams = angular.copy(DEFAULT_SC);
        vm.fastSearch = {};
        testsRunsService.resetFilteringState();
        vm.onFilterChange();
        vm.chipsCtrl && (delete vm.chipsCtrl.selectedChip);
    }

    function onApply() {
        $timeout(function() {
            vm.onFilterChange();
        }, 0);
    }

    function loadFilters() {
        const loadFilterDataPromises = [];

        loadFilterDataPromises.push(loadEnvironments());
        loadFilterDataPromises.push(loadPlatforms());
        loadFilterDataPromises.push(loadProjects());

        return $q.all(loadFilterDataPromises).then(function() {
            loadSubjectBuilder();
        });
    }

    function loadEnvironments() {
        return TestRunService.getEnvironments().then(function(rs) {
            if (rs.success) {
                vm.environments = rs.data.filter(function (env) {
                    return !!env;
                });

                return vm.environments;
            } else {
                messageService.error(rs.message);
                $q.reject(rs.message);
            }
        });
    }

    function loadPlatforms() {
        return TestRunService.getPlatforms().then(function (rs) {
            if (rs.success) {
                vm.platforms = rs.data.filter(function (platform) {
                    return platform && platform.length;
                });

                return vm.platforms;
            } else {
                messageService.error(rs.message);

                return $q.reject(rs.message);
            }
        });
    }

    function loadProjects() {
        return ProjectService.getAllProjects().then(function (rs) {
            if (rs.success) {
                vm.allProjects = rs.data.map(function(proj) {
                    return proj.name;
                });

                return rs.data;
            } else {
                $q.reject(rs.message);
            }
        });
    }

    function loadSubjectBuilder() {
        FilterService.getSubjectBuilder(subjectName).then(function (rs) {
            if(rs.success) {
                vm.subjectBuilder = rs.data;
                vm.subjectBuilder.criterias.forEach(function(criteria) {
                    if (isSelectCriteria(criteria)) {
                        switch(criteria.name) {
                            case 'ENV':
                                criteria.values = vm.environments;
                                break;
                            case 'PLATFORM':
                                criteria.values = vm.platforms;
                                break;
                            case 'PROJECT':
                                criteria.values = vm.allProjects;
                                break;
                            case 'STATUS':
                                criteria.values = STATUSES;
                                break;
                        }
                    }
                });
            }
        });
    }

    function isSelectCriteria(criteria) {
        return criteria && SELECT_CRITERIAS.indexOf(criteria.name) >= 0;
    }

    function onChangeSearchCriteria() {
        angular.forEach(vm.searchParams, function (value, name) {
            if (vm.searchParams[name]) {
                testsRunsService.setSearchParam(name, value);
            } else {
                testsRunsService.deleteSearchParam(name);
            }
        });
        vm.onApply();
    }

    function openDatePicker($event, showTemplate) {
        if (vm.isFilterActive()) { return; }

        vm.selectedRange.showTemplate = showTemplate;

        $mdDateRangePicker.show({
            targetEvent: $event,
            model: vm.selectedRange
        })
        .then(function(result) {
            if (result) {
                vm.selectedRange = result;

                if(result.selectedTemplate) {
                    if (vm.selectedRange.dateStart.getMonth() === vm.selectedRange.dateEnd.getMonth()) {
                        if(vm.selectedRange.dateStart.getTime() === vm.selectedRange.dateEnd.getTime()) {
                            vm.selectedRange.selectedTemplateName =  moment(vm.selectedRange.dateStart).format('DD') + ' ' + moment(vm.selectedRange.dateStart).format('MMM');
                        } else {
                            vm.selectedRange.selectedTemplateName = moment(vm.selectedRange.dateStart).format('DD') + ' - ' + moment(vm.selectedRange.dateEnd).format('DD') + ' ' + moment(vm.selectedRange.dateStart).format('MMM');
                        }
                    } else {
                        vm.selectedRange.selectedTemplateName = moment(vm.selectedRange.dateStart).format('DD') + ' ' + moment(vm.selectedRange.dateStart).format('MMM') + ' - ' + moment(vm.selectedRange.dateEnd).format('DD') + ' ' + moment(vm.selectedRange.dateEnd).format('MMM');
                    }
                } else {
                    vm.selectedRange.selectedTemplateName = result.selectedTemplateName.split(' ').slice(0,-1).join(' ');
                    vm.searchParams.selectedTemplateName = vm.selectedRange.selectedTemplateName;
                }

                if (vm.selectedRange.dateStart && vm.selectedRange.dateEnd) {
                    if (vm.selectedRange.dateStart.getTime() !== vm.selectedRange.dateEnd.getTime()) {
                        vm.searchParams.date = null;
                        vm.searchParams.fromDate = vm.selectedRange.dateStart;
                        vm.searchParams.toDate = vm.selectedRange.dateEnd;
                    } else {
                        vm.searchParams.fromDate = null;
                        vm.searchParams.toDate = null;
                        vm.searchParams.date = vm.selectedRange.dateStart;
                    }
                } else {
                    vm.searchParams.fromDate = null;
                    vm.searchParams.toDate = null;
                    vm.searchParams.date = null;
                    vm.searchParams.selectedTemplateName = null;
                }

                onChangeSearchCriteria();
            }
        })
    }

    function showSearchFilters() {
        vm.showAdvancedSearchFilters = ! vm.showAdvancedSearchFilters;
    };

    function bindEventListeners() {
        vm.$onDestroy = () => {
            if (vm.isMobile) {
                angular.element(scrollablePerentElement).off('scroll.hideFilterButton', onScroll);
            }
        }
        if (vm.isMobile) {
            angular.element(scrollablePerentElement).on('scroll.hideFilterButton', onScroll);
        }
    }

    function onScroll() {
        if (!vm.scrollTicking) {
            vm.scrollTicking = true;
            $scope.$apply();
            scrollTickingTimeout = $timeout(() => {
                vm.scrollTicking = false;
            }, 300);
        } else {
            $timeout.cancel(scrollTickingTimeout);
            scrollTickingTimeout = $timeout(() => {
                vm.scrollTicking = false;
            }, 300);
        }
    }
}

export default TestsRunsSearchController;
