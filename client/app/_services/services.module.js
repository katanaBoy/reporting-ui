'use strict';

import appHealthService from './app-health/app-health.service';
import authService from './auth/auth.service';
import toolsService from './tools/tools.service';
import progressbarService from './progressbar/progressbar.service';
import messageService from './messages/message.service';
import mainMenuService from './main-menu/main-menu.service';
import ArtifactService from './artifact.service';
import jsonConfigsService from './json-configs/json-configs.service';
import testsSessionsService from './tests-sessions/tests-sessions.service';
import pageTitleService from './page-title/page-title.service';

angular.module('app.services', [])
    .service({ appHealthService })
    .service({ authService })
    .service({ ArtifactService})
    .service({ toolsService })
    .service({ messageService })
    .service({ mainMenuService })
    .service({ progressbarService })
    .service({ jsonConfigsService })
    .service({ pageTitleService })
    .service({ testsSessionsService });

require('./auth.intercepter');
require('./utils/safari-fixes.util');
require('./utils/HttpMockResolver');
require('./utils/TableExpandUtil');
require('./utils/testrun.storage');
require('./utils/widget.util');
require('./window-width/window-width.service');
require('./certification.service');
require('./config.service');
require('./dashboard.service');
require('./download.service');
require('./filter.service');
require('./group.service');
require('./invitation.service');
require('./job.service');
require('./launcher.service');
require('./modals.service');
require('./permission.service');
require('./project.service');
require('./utils/mapper.util');
require('./scm.service');
require('./setting.provider');
require('./setting.service');
require('./slack.service');
require('./test.service');
require('./testcase.service');
require('./testrun.service');
require('./testsruns.service');
require('./integrations.service');
require('./upload.service');
require('./user.service');
require('./util.service');
require('./view.service');
require('./projects/projects.service');
