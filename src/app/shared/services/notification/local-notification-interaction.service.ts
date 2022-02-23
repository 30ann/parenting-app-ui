import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { interval } from "rxjs";
import { debounce, filter } from "rxjs/operators";
import { generateTimestamp } from "../../utils";
import { DbService } from "../db/db.service";
import { ILocalNotification, LocalNotificationService } from "./local-notification.service";

interface ILocalNotificationInteraction {
  sent_recorded_timestamp: string;
  schedule_timestamp: string;
  notification_id: number;
  notification_meta: Partial<ILocalNotification>;
  action_recorded_timestamp?: string;
  action_id?: string;
  action_meta?: any;
  _created: string;
}

@Injectable({
  providedIn: "root",
})
/**
 * Small service that handles tracking local notification interaction history and saving to db
 *
 */
export class LocalNotificationInteractionService {
  /** Typed wrapper around database table used to store local notifications */
  private db: Dexie.Table<ILocalNotificationInteraction, number>;
  private dbLocked$ = new BehaviorSubject(false);

  constructor(
    private dbService: DbService,
    private localNotificationService: LocalNotificationService
  ) {
    this.db = dbService.table<ILocalNotificationInteraction>("local_notifications_interaction");
  }
  public async init() {
    this.subscribeToNotifications();
  }

  private subscribeToNotifications() {
    this.localNotificationService.interactedNotification$
      .pipe(
        debounce(() => interval(1000)), // generally try to ensure action update happen after session update
        filter((v) => !!v)
      )
      .subscribe(async (action) => {
        const { actionId, notification, inputValue } = action;
        const update: Partial<ILocalNotificationInteraction> = {
          action_id: actionId,
          action_recorded_timestamp: generateTimestamp(),
        };
        if (inputValue) {
          update.action_meta = { inputValue };
        }
        await this.recordNotificationInteraction(notification.id, update);
      });
    this.localNotificationService.sessionNotifications$
      .pipe(
        debounce(() => interval(500)), // local notifications can re-evalute in quick succession so debounce
        filter((v) => v.length > 0)
      )
      .subscribe(async (notifications) => {
        const timestamp = generateTimestamp();
        for (const notification of notifications) {
          await this.recordNotificationInteraction(notification.id, {
            notification_meta: notification.extra,
            schedule_timestamp: generateTimestamp(notification.schedule.at),
            sent_recorded_timestamp: timestamp,
          });
        }
      });
  }

  private async recordNotificationInteraction(
    notification_id: number,
    update: Partial<ILocalNotificationInteraction>
  ) {
    this.dbLocked$.next(true);
    let entry: ILocalNotificationInteraction = await this.db.where({ notification_id }).first();

    if (!entry) {
      entry = {
        ...this.dbService.generateDBMeta(),
        notification_id,
      } as any;
    }
    await this.db.put({ ...entry, ...update });
    this.dbLocked$.next(false);
  }
}
