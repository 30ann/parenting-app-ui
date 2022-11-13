import { Component } from "@angular/core";
import { Platform, MenuController } from "@ionic/angular";
import { Router } from "@angular/router";
import { Capacitor } from "@capacitor/core";
import { SplashScreen } from "@capacitor/splash-screen";
import { App } from "@capacitor/app";
import { DbService } from "./shared/services/db/db.service";
import { SkinService } from "./shared/services/skin/skin.service";
import { ThemeService } from "./feature/theme/services/theme.service";
import { environment } from "src/environments/environment";
import { TaskActionService } from "./shared/services/task/task-action.service";
import { UserMetaService } from "./shared/services/userMeta/userMeta.service";
import { AppEventService } from "./shared/services/app-events/app-events.service";
import { TourService } from "./feature/tour/tour.service";
import { TemplateService } from "./shared/components/template/services/template.service";
import { CampaignService } from "./feature/campaign/campaign.service";
import { ServerService } from "./shared/services/server/server.service";
import { DataEvaluationService } from "./shared/services/data/data-evaluation.service";
import { TemplateProcessService } from "./shared/components/template/services/instance/template-process.service";
import { isSameDay } from "date-fns";
import { AnalyticsService } from "./shared/services/analytics/analytics.service";
import { LocalNotificationService } from "./shared/services/notification/local-notification.service";
import { TemplateFieldService } from "./shared/components/template/services/template-field.service";
import { TemplateTranslateService } from "./shared/components/template/services/template-translate.service";
import { LocalNotificationInteractionService } from "./shared/services/notification/local-notification-interaction.service";
import { DBSyncService } from "./shared/services/db/db-sync.service";
import { CrashlyticsService } from "./shared/services/crashlytics/crashlytics.service";
import { AppDataService } from "./shared/services/data/app-data.service";
import { AuthService } from "./shared/services/auth/auth.service";
import { LifecycleActionsService } from "./shared/services/lifecycle-actions/lifecycle-actions.service";
import { AppConfigService } from "./shared/services/app-config/app-config.service";
import { IAppConfig } from "./shared/model";
import { TaskService } from "./shared/services/task/task.service";
import { AsyncServiceBase } from "./shared/services/asyncService.base";
import { SyncServiceBase } from "./shared/services/syncService.base";

@Component({
  selector: "app-root",
  templateUrl: "app.component.html",
  styleUrls: ["app.component.scss"],
})
export class AppComponent {
  APP_VERSION = environment.version;
  DEPLOYMENT_NAME = environment.deploymentName;
  appConfig: IAppConfig;
  appFields: IAppConfig["APP_FIELDS"];
  appAuthenticationDefaults: IAppConfig["APP_AUTHENTICATION_DEFAULTS"];
  sideMenuDefaults: IAppConfig["APP_SIDEMENU_DEFAULTS"];
  footerDefaults: IAppConfig["APP_FOOTER_DEFAULTS"];
  /** Track when app ready to render sidebar and route templates */
  public renderAppTemplates = false;

  constructor(
    // 3rd Party Services
    private platform: Platform,
    private menuController: MenuController,
    private router: Router,

    private skinService: SkinService,
    private appConfigService: AppConfigService,
    private dbService: DbService,
    private dbSyncService: DBSyncService,
    private userMetaService: UserMetaService,
    private themeService: ThemeService,
    private tourService: TourService,
    private templateService: TemplateService,
    private templateFieldService: TemplateFieldService,
    private templateProcessService: TemplateProcessService,
    private appEventService: AppEventService,
    private campaignService: CampaignService,
    private dataEvaluationService: DataEvaluationService,
    private analyticsService: AnalyticsService,
    private localNotificationService: LocalNotificationService,
    private localNotificationInteractionService: LocalNotificationInteractionService,
    private templateTranslateService: TemplateTranslateService,
    private crashlyticsService: CrashlyticsService,
    private appDataService: AppDataService,
    private authService: AuthService,
    private taskService: TaskService,
    /** Inject in the main app component to start tracking actions immediately */
    private taskActions: TaskActionService,
    private lifecycleActionsService: LifecycleActionsService,
    private serverService: ServerService
  ) {
    this.initializeApp();
  }

  private async initializeApp() {
    this.platform.ready().then(async () => {
      this.subscribeToAppConfigChanges();
      // ensure deployment field set correctly for use in any startup services or templates
      localStorage.setItem(this.appFields.DEPLOYMENT_NAME, this.DEPLOYMENT_NAME);
      localStorage.setItem(this.appFields.APP_VERSION, this.APP_VERSION);
      await this.initialiseCoreServices();
      this.hackSetDeveloperOptions();
      const isDeveloperMode = this.templateFieldService.getField("user_mode") === false;
      const user = this.userMetaService.userMeta;
      // Authentication requires verified domain and app ids populated to firebase console
      // Currently only run on native where specified (but can comment out for testing locally)
      if (this.appAuthenticationDefaults.enforceLogin && Capacitor.isNativePlatform()) {
        await this.ensureUserSignedIn();
      }
      if (!user.first_app_open) {
        await this.userMetaService.setUserMeta({ first_app_open: new Date().toISOString() });
      }
      // Run app-specific launch tasks

      // Re-initialise default field and globals on init in case sheets have been updated
      // TODO - ideally this should just be triggered on first launch of new app update
      await this.templateService.initialiseDefaultFieldAndGlobals();
      await this.templateProcessService.initialiseStartupTemplates();
      await this.lifecycleActionsService.handleLaunchActions();

      this.menuController.enable(true, "main-side-menu");
      if (Capacitor.isNativePlatform()) {
        if (!isDeveloperMode) {
          this.removeConsoleLogs();
        }
        await SplashScreen.hide();
      }
      // Show main template
      this.renderAppTemplates = true;
      this.scheduleReinitialisation();
    });
  }

  private async ensureUserSignedIn() {
    const authUser = await this.authService.getCurrentUser();
    if (!authUser) {
      const templatename = this.appAuthenticationDefaults.signInTemplate;
      const { modal } = await this.templateService.runStandaloneTemplate(templatename, {
        showCloseButton: false,
        waitForDismiss: false,
      });
      await this.authService.waitForSignInComplete();
      await modal.dismiss();
    }
  }

  /** Initialise appConfig and set dependent properties */
  private subscribeToAppConfigChanges() {
    this.appConfigService.appConfig$.subscribe((appConfig: IAppConfig) => {
      this.appConfig = appConfig;
      this.sideMenuDefaults = this.appConfig.APP_SIDEMENU_DEFAULTS;
      this.footerDefaults = this.appConfig.APP_FOOTER_DEFAULTS;
      this.appAuthenticationDefaults = this.appConfig.APP_AUTHENTICATION_DEFAULTS;
      this.appFields = this.appConfig.APP_FIELDS;
    });
  }

  /**
   * Various services set core app data which may be used in templates such as current app day,
   * user id etc. Make sure these services have run their initialisation logic before proceeding.
   *
   * Note - For some of these services order will be important
   * (e.g. notifications before campaigns that require notifications)
   **/
  private async initialiseCoreServices() {
    // log all init logs in a group (any logs called outside will be from nonBlocking services)
    // that call blocking in their constructor methods
    console.group("Core Services");
    // use a single async service base to ensure all others created
    this.crashlyticsService.ready(); // Start init but do not need to wait for complete

    const start = performance.now();
    const nonBlockingServices: SyncServiceBase[] = [
      this.skinService,
      this.appConfigService,
      this.themeService,
      this.templateService,
      this.templateProcessService,
      this.analyticsService,
      this.appDataService,
      this.authService,
      this.lifecycleActionsService,
      this.serverService,
    ];
    for (const service of nonBlockingServices) {
      service.ready();
    }

    const blockingServices: AsyncServiceBase[] = [
      this.dbService,
      this.dataEvaluationService,
      this.dbSyncService,
      this.userMetaService,
      this.tourService,
      this.templateFieldService,
      this.appEventService,
      this.localNotificationService,
      this.localNotificationInteractionService,
      this.templateTranslateService,
      this.crashlyticsService,
      this.taskService,
      this.taskActions,
      this.campaignService,
    ];
    await Promise.all(blockingServices.map(async (service) => await service.ready()));
    console.log("Total time:", Math.round(performance.now() - start) + "ms");
    console.groupEnd();
  }

  private clickOnMenuItem(id: string) {
    this.menuController.close("main-side-menu");
    this.router.navigateByUrl("/" + id);
  }

  /** Rewrite default log functions for improved performance when running on device */
  private removeConsoleLogs() {
    if (window && window.console) {
      console.log("Disabling console logs");
      window.console.log = function (...args: any) {};
      window.console.warn = function (...args: any) {};
      window.console.error = function (...args: any) {};
    }
  }

  /**
   * The app might be left running in the background for multiple days
   * Ensure information such as the current app day are kept updated in this case
   *
   * Note - prefer use of listener to app resume instead of specific timer, as these can be paused when app minimised
   * https://stackoverflow.com/questions/6543325/what-happens-to-javascript-execution-settimeout-etc-when-iphone-android-goes
   */
  private async scheduleReinitialisation() {
    App.addListener("appStateChange", async ({ isActive }) => {
      if (isActive) {
        const lastLaunchEntry = await this.dbService
          .table("app_events")
          .orderBy("_created")
          .reverse()
          .first();
        const lastLaunchDay = new Date(lastLaunchEntry._created);
        // reprocess initialisation if the day has changed
        if (!isSameDay(lastLaunchDay, new Date())) {
          await this.initialiseCoreServices();
        } else {
          console.log("welcome back :D");
        }
      }
    });
  }

  /** ensure localhost dev can see all non-user content */
  private hackSetDeveloperOptions() {
    if (location.hostname === "localhost" && !environment.production) {
      const isUserMode = this.templateFieldService.getField("user_mode");
      if (isUserMode !== false) {
        this.templateFieldService.setField("user_mode", "false");
      }
    }
  }
}
