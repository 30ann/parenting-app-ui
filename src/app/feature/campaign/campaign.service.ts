import { Injectable } from "@angular/core";
import { addDays } from "@fullcalendar/angular";
import { addHours, addMinutes, isAfter, isBefore } from "date-fns";
import { APP_STRINGS } from "packages/data-models/constants";
import { Subscription } from "rxjs";
import { TemplateTranslateService } from "src/app/shared/components/template/services/template-translate.service";
import { TemplateService } from "src/app/shared/components/template/services/template.service";
import { FlowTypes } from "src/app/shared/model";
import { DataEvaluationService } from "src/app/shared/services/data/data-evaluation.service";
import { DATA_LIST } from "src/app/shared/services/data/data.service";
import {
  ILocalNotification,
  LocalNotificationService,
} from "src/app/shared/services/notification/local-notification.service";
import {
  arrayToHashmap,
  mergeArrayOfArrays,
  randomElementFromArray,
  stringToIntegerHash,
} from "src/app/shared/utils";
type ICampaignHashmap = {
  [campaign_id: string]: FlowTypes.Campaign_listRow[];
};
type IScheduledCampaignsHashmap = {
  [schedule_id: string]: FlowTypes.Campaign_Schedule;
};
type IScheduledNotificationsHashmap = {
  [campaign_id: string]: { [row_id: string]: ILocalNotification };
};

@Injectable({ providedIn: "root" })
export class CampaignService {
  allCampaigns: ICampaignHashmap = {};
  scheduledCampaigns: IScheduledCampaignsHashmap = {};
  scheduledNotifications: IScheduledNotificationsHashmap = {};

  private _handledNotifications = {};
  private _notificationUpdates$: Subscription;

  constructor(
    private dataEvaluationService: DataEvaluationService,
    private localNotificationService: LocalNotificationService,
    private translateService: TemplateTranslateService,
    private templateService: TemplateService
  ) {}

  public async init() {
    const schedules = await this.loadCampaignSchedules();

    const { allCampaigns, scheduledCampaigns } = this.loadCampaignRows(schedules);

    this.scheduledCampaigns = scheduledCampaigns;
    this.allCampaigns = allCampaigns;

    console.log("[Scheduled Campaigns]", this.scheduledCampaigns);
    console.log("[All Campaigns]", this.allCampaigns);

    await this.scheduleCampaignNotifications();

    this._subscribeToNotificationUpdates();
  }

  private _subscribeToNotificationUpdates() {
    if (this._notificationUpdates$) {
      this._notificationUpdates$.unsubscribe();
    }
    this._notificationUpdates$ = this.localNotificationService.sessionNotifications$.subscribe(
      async () => {
        await this.handledTriggeredNotifications();
      }
    );
  }

  private async handledTriggeredNotifications() {
    for (const notification of this.localNotificationService.sessionNotifications$.value) {
      if (!this._handledNotifications[notification.id]) {
        this._handledNotifications[notification.id] = true;
        this.triggerRowActions(notification.extra);
        // reschedule if actions handled, allow time for notifications to be loaded
        setTimeout(async () => {
          await this.scheduleCampaignNotifications();
        }, 200);
      }
    }
  }

  /**
   *
   * @param row
   * TODO - find better way to link with template actions
   * TODO - find way to identify any named action list (not just click_action_list)
   */
  public triggerRowActions(row: FlowTypes.Campaign_listRow) {
    if (row.click_action_list) {
      for (const action of row.click_action_list) {
        if (action.action_id === "set_field") {
          const [key, value] = action.args;
          this.templateService.setField(key, value);
        } else {
          console.error("Only set_field actions supported by debugger");
        }
      }
    }
  }

  /**
   * Check all campaigns for those with notification schedules and evaluate
   * any notifications requiring scheduling
   */
  private async scheduleCampaignNotifications() {
    const scheduled: IScheduledNotificationsHashmap = {};
    for (const campaign of Object.values(this.scheduledCampaigns)) {
      scheduled[campaign.id] = {};
      // remove any previous notification
      await this.deactiveCampaignNotifications(campaign.id);
      if (campaign._active) {
        const nextRow = await this.getNextCampaignRow(campaign.id);
        if (nextRow) {
          // add new notification
          const schedule = await this.scheduleCampaignNotification(nextRow, campaign.id);
          scheduled[campaign.id][nextRow.id] = schedule;
        }
      }
    }
    this.scheduledNotifications = scheduled;
    console.log("[Scheduled Notifications]", this.scheduledNotifications);
  }

  /**
   * Select the highest priority row for a given campaign that satisfies all activation/deactivation
   * criteria. In the case of multiple equal priority rows, return at random
   */
  public async getNextCampaignRow(campaign_id: string) {
    // TODO - decide best way to handle keeping data fresh
    await this.dataEvaluationService.refreshDBCache();

    if (!this.allCampaigns[campaign_id]) {
      console.error("no data exists for campaign", campaign_id);
      return null;
    }
    const campaignRows = this.allCampaigns[campaign_id].sort((a, b) => b.priority - a.priority);
    const satisfiedRows: FlowTypes.Campaign_listRow[] = [];
    // Iterate over campaign rows in order of priority. If row satisfies conditions set as new benchmark priority
    let benchmarkRowPriority = -Infinity;
    for (const row of campaignRows) {
      if (!row.hasOwnProperty("priority")) row.priority = -Infinity;
      if (row.priority >= benchmarkRowPriority) {
        const evaluation = await this.evaluateRowActivationConditions(row);
        if (evaluation._active) {
          // set current row as new bar for activation processing
          benchmarkRowPriority = row.priority;
          satisfiedRows.push({ ...row, ...evaluation });
        }
      }
    }
    // return row at random from list of all rows that matched the final benchmark priority
    const highestPriorityRows = satisfiedRows.filter((row) => row.priority >= benchmarkRowPriority);
    const selectedRow = randomElementFromArray(highestPriorityRows);

    // console.log("[Campaign Next]", campaign_id, { campaignRows, selectedRow, satisfiedRows });
    return selectedRow;
  }

  /**
   * Convert PLH notification schedule data and create local notification
   * @returns list of all currently scheduled notifications
   */
  public async scheduleCampaignNotification(row: FlowTypes.Campaign_listRow, campaign_id: string) {
    const schedule = this.scheduledCampaigns[campaign_id];
    if (!schedule) {
      console.error("No notification schedule provided for campaign", campaign_id);
      return;
    }
    const notification_schedule = this.evaluateCampaignNotification(schedule);
    let { title, text } = row;
    let { _schedule_at } = notification_schedule;

    title = this.translateService.translateValue(title || APP_STRINGS.NOTIFICATION_DEFAULT_TITLE);
    text = this.translateService.translateValue(text || APP_STRINGS.NOTIFICATION_DEFAULT_TEXT);
    const notificationSchedule: ILocalNotification = {
      schedule: { at: _schedule_at },
      body: text,
      title,
      extra: { ...row, campaign_id },
      id: stringToIntegerHash(row.id),
    };
    await this.localNotificationService.scheduleNotification(notificationSchedule);
    return notificationSchedule;
  }

  /** Deactivate all notifications for a given campaign */
  private async deactiveCampaignNotifications(campaign_id: string) {
    const pendingNotifications = this.localNotificationService.pendingNotifications$.value;
    const deactivatedNotifications = pendingNotifications.filter(
      (n) => n.extra.campaign_id === campaign_id
    );
    for (const notification of deactivatedNotifications) {
      await this.localNotificationService.removeNotification(notification.id);
    }
  }

  /**
   * Retreive all notification_schedule datalists, filter for satisfied activation conditions
   * and schedule start/end
   */
  private async loadCampaignSchedules() {
    const scheduleRows = DATA_LIST.filter((list) => list.flow_subtype === "campaign_schedule").map(
      (list) => list.rows
    );
    const allCampaignSchedules: FlowTypes.Campaign_Schedule[] = mergeArrayOfArrays(scheduleRows);
    const evaluatedCampaignSchedules = await Promise.all(
      allCampaignSchedules.map(async (scheduleRow) => {
        const activationEvaluation = await this.evaluateRowActivationConditions(scheduleRow);
        const scheduleEvaluation = this.evaluateRowSchedule(scheduleRow);
        scheduleRow._active = activationEvaluation._active && scheduleEvaluation;
        scheduleRow._campaign_rows = [];
        return scheduleRow;
      })
    );
    const campaignSchedulesById = arrayToHashmap(evaluatedCampaignSchedules, "id");
    return campaignSchedulesById;
  }

  /**
   * Get a list of all campaign rows collated by campaign_id, and merge with campaign schedules
   * TODO - most of this logic could be handled in parser instead
   */
  private loadCampaignRows(scheduledCampaigns: IScheduledCampaignsHashmap) {
    // Retrieve and merge list of all campaign rows
    const campaignListRows = DATA_LIST.filter((list) =>
      ["campaign_rows", "campaign_rows_debug"].includes(list.flow_subtype)
    ).map((list) => list.rows);

    const allCampaignRows: FlowTypes.Campaign_listRow[] = mergeArrayOfArrays(campaignListRows);
    const allCampaignRowsByPriority = allCampaignRows.sort(
      (a, b) => (b.priority || 0) - (a.priority || 0)
    );

    // Merge rows with lists of scheduled and all campaigns
    const allCampaigns: ICampaignHashmap = {};

    allCampaignRowsByPriority.forEach((campaignRow) => {
      // add row to relevant campaign list
      const campaign_list = campaignRow.campaign_list || [];
      campaign_list.forEach((campaign_id) => {
        // store scheduled campaign row if relevant
        // TODO - handle campaigns with inline notification schedule
        if (scheduledCampaigns.hasOwnProperty(campaign_id)) {
          scheduledCampaigns[campaign_id]._campaign_rows.push(campaignRow);
        }
        // also store row to all campaign list
        else {
          allCampaigns[campaign_id] = allCampaigns[campaign_id] || [];
          allCampaigns[campaign_id].push(campaignRow);
        }
      });
    });

    // merge any scheduled campaigns to all campaigns list
    Object.values(scheduledCampaigns).forEach(
      (schedule) => (allCampaigns[schedule.id] = schedule._campaign_rows)
    );

    return { allCampaigns, scheduledCampaigns };
  }

  /**
   * Evaluate all statements within row activation_condition_list and deactivation_condition_list
   * Return a summary of whether all activations satisifed, whether any deactivation satisfied,
   * and overall active state based on all activations satisfied and not any deactivations satisfied
   * */
  public async evaluateRowActivationConditions(row: FlowTypes.RowWithActivationConditions) {
    const deactivation_condition_list = row.deactivation_condition_list || [];
    row.deactivation_condition_list = await Promise.all(
      deactivation_condition_list.map(async (condition) => {
        const _satisfied = await this.evaluateCondition(condition);
        return { ...condition, _satisfied };
      })
    );
    const activation_condition_list = row.activation_condition_list || [];
    row.activation_condition_list = await Promise.all(
      activation_condition_list.map(async (condition) => {
        const _satisfied = await this.evaluateCondition(condition);
        return { ...condition, _satisfied };
      })
    );
    const _activated = row.activation_condition_list.every((c) => c._satisfied === true);
    const _deactivated = row.deactivation_condition_list.some((c) => c._satisfied === true);
    const _active = _activated && !_deactivated;
    return { _activated, _deactivated, _active };
  }

  private evaluateCampaignNotification(schedule: FlowTypes.Campaign_Schedule) {
    const { time, delay } = schedule;
    let d = new Date();
    if (time) {
      d.setHours(Number(time.hour || d.getHours()));
      d.setMinutes(Number(time.minute || d.getMinutes()));
    }
    if (delay) {
      d = addDays(d, Number(delay.days || 0));
      d = addHours(d, Number(delay.hours || 0));
      d = addMinutes(d, Number(delay.minutes || 0));
    }
    schedule._schedule_at = d;
    return schedule;
  }

  private evaluateCondition(condition: FlowTypes.DataEvaluationCondition) {
    return this.dataEvaluationService.evaluateReminderCondition(condition);
  }

  private evaluateRowSchedule(scheduleRow: FlowTypes.Campaign_Schedule) {
    if (scheduleRow.schedule) {
      const { start_date, end_date } = scheduleRow.schedule;
      // schedule start date must not be later than current date
      if (start_date && isAfter(new Date(start_date), new Date())) return false;
      // schedule end date must not be before than current date
      if (end_date && isBefore(new Date(end_date), new Date())) return false;
    }
    return true;
  }
}
