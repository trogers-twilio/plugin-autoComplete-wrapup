import React from 'react';
import { VERSION } from '@twilio/flex-ui';
import { FlexPlugin } from '@twilio/flex-plugin';
import ConfigureFlexStrings from './flex-hooks/strings';
import RegisterFlexNotifications from './flex-hooks/notifications';
// import {checkExistingReservation} from './helper/existingReservation';
import FlexState from './states/FlexState';

const PLUGIN_NAME = 'AutoCompleteWrapupPlugin';

export default class AutoCompleteWrapupPlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  /**
  * This code is run when your plugin is being started
  * Use this to modify any UI components or attach to the actions framework
  *
  * @param flex { typeof import('@twilio/flex-ui') }
  * @param manager { import('@twilio/flex-ui').Manager }
  */
  async init(flex, manager) {
    ConfigureFlexStrings(flex, manager);
    RegisterFlexNotifications(flex, manager);

    manager.events.addListener('pluginsLoaded', () => {
      // get the wrapupConfig config from ui_attributes
      const wrapupConfig = manager.serviceConfiguration?.ui_attributes?.autoWrapupTimer;

      if (wrapupConfig) {
        // declare a map to store the timers
        // this map will be passed to clearTimeout in case the agent finishes the task before autoComplete executes
        const timers = new Map();

        FlexState.workerTasks.forEach(reservation => {

          const existing_reservation = reservation;
          let reservation_channelName = existing_reservation.taskChannelUniqueName;
          let reservation_channelWrapUpConfiguration = wrapupConfig[reservation_channelName];

          // set a variable for timeout, this is used for clearing timeouts if the task is completed
          let existingReservation_timer;

          if (existing_reservation.status === "wrapping") {

            if (reservation_channelWrapUpConfiguration && reservation_channelWrapUpConfiguration.enabled) {
              let date_last_updated = existing_reservation.dateUpdated;
              let age_so_far_ms = (new Date() - new Date(date_last_updated));
              let reservation_wrapUpTime_seconds = reservation_channelWrapUpConfiguration.maxSeconds;
              let remaining_time = (reservation_wrapUpTime_seconds * 1000) - age_so_far_ms;
              remaining_time = remaining_time <= 0 ? 1 : remaining_time;

              existingReservation_timer = setTimeout(() => {
                flex.Actions.invokeAction('CompleteTask', { sid: existing_reservation.sid });
              }, remaining_time);
              timers.set(existing_reservation.sid, existingReservation_timer);
            }
          }

          else if (existing_reservation.status === "pending" || existing_reservation.status === "assigned" || existing_reservation.status === "accepted") {

            let existing_reservation_completeTimer;
            let trueExistingReservation = existing_reservation.addListener ? existing_reservation : existing_reservation.source;

            trueExistingReservation.addListener('wrapup', payload => {

              if (reservation_channelWrapUpConfiguration && reservation_channelWrapUpConfiguration.enabled) {
                existing_reservation_completeTimer = setTimeout(() => {
                  flex.Actions.invokeAction('CompleteTask', { sid: existing_reservation.sid });
                }, reservation_channelWrapUpConfiguration.maxSeconds * 1000);
                timers.set(existing_reservation.sid, existing_reservation_completeTimer);
              }
            });



          }
        });

        manager.workerClient.on('reservationCreated', reservation => {

          let trueReservation = reservation.addListener ? reservation : reservation.source;

          // get the channel name for the reservation
          let channelName = trueReservation.task.taskChannelUniqueName;

          //get the config time from the ui_attributes for the voice channel
          let channelWrapUpConfiguration = wrapupConfig[channelName];

          // set a variable for timeout, this is used for clearing timeouts if the task is completed
          let reservation_completeTimer;

          // listen to the wrap up event for the reservation
          trueReservation.addListener('wrapup', payload => {

            //if the configuration exist and if the configuration for the channel is enabled
            //then wrapup the task within the time mentioned in the configuration for that channelName
            if (channelWrapUpConfiguration && channelWrapUpConfiguration.enabled) {
              reservation_completeTimer = setTimeout(() => {
                flex.Actions.invokeAction('CompleteTask', { sid: reservation.sid });
              }, channelWrapUpConfiguration.maxSeconds * 1000);

              timers.set(reservation.sid, reservation_completeTimer);
            }
          });
        });

        flex.Actions.addListener("beforeCompleteTask", payload => {
          if (timers.has(payload.sid)) {
            clearTimeout(timers.get(payload.sid));
            timers.delete(payload.sid);
          }
        });

        flex.Actions.addListener("beforeLogout", (payload, abortOriginal) => {
          FlexState.workerTasks.forEach(reservation => {
            console.log('Cheryl is', reservation);
            if (reservation.status === "wrapping") {
              flex.Actions.invokeAction('CompleteTask', { sid: reservation.sid });
            }
            else if (reservation.status === "pending" || reservation.status === "assigned" || reservation.status === "accepted") {
              console.log('Testing Cheryl');

              if (reservation.channelType === 'voice') {
                const notificationVoice = flex.Notifications.registeredNotifications.get("HangUpCall");
                notificationVoice.content = notificationVoice.content.replace("{{channel}}", "voice");
                flex.Notifications.showNotification("HangUpCall");
              }
              else if (reservation.channelType === 'sms') {
                const notificationMessage = flex.Notifications.registeredNotifications.get("HangUpCall");
                notificationMessage.content = notificationMessage.content.replace("{{channel}}", "sms");
                flex.Notifications.showNotification("HangUpCall");
              }

              abortOriginal();
            }
          });
        });
      }

      // else show a notification that the configuration does not exist
      else {
        flex.Notifications.showNotification('UnconfiguredAutoWrapupTimer');
      }

    });

  }
}
