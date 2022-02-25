import React from 'react';
import { VERSION } from '@twilio/flex-ui';
import { FlexPlugin } from 'flex-plugin';
import ConfigureFlexStrings from './flex-hooks/strings';
import RegisterFlexNotifications from './flex-hooks/notifications';
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

    // get the wrapupConfig config from ui_attributes
    const wrapupConfig = manager.serviceConfiguration?.ui_attributes?.autoWrapupTimer;

    // if the configuration for autoWrapupTimer exists then follow the logic below
    if (wrapupConfig) {
      //reservation existing
      FlexState.workerTasks.forEach(reservation => {

        const existing_reservation = reservation;
        let reservation_channelName = existing_reservation.taskChannelUniqueName;
        let reservaton_channelWrapUpConfiguration = wrapupConfig[reservation_channelName];

        if(existing_reservation.status === "wrapping"){

          let date_last_updated = existing_reservation.dateUpdated;
          let age_so_far_ms = (new Date() - new Date(date_last_updated));
          let reservation_wrapUpTime_seconds = reservaton_channelWrapUpConfiguration.maxSeconds;

          let remaining_time = (reservation_wrapUpTime_seconds*1000) - age_so_far_ms;
          remaining_time = remaining_time <= 0 ? 1 : remaining_time;

          if (reservaton_channelWrapUpConfiguration && reservaton_channelWrapUpConfiguration.enabled){
            setTimeout(()=> {
              flex.Actions.invokeAction('CompleteTask', { sid: reservation.sid });
            }, remaining_time);
          }

        }
      });

      manager.workerClient.on('reservationCreated', reservation => {
        // get the channel name for the reservation
        let trueReservation = reservation.addListener?reservation:reservation.source;
        let channelName = trueReservation.task.taskChannelUniqueName;

        //get the config time from the ui_attributes for the voice channel
        let channelWrapUpConfiguration = wrapupConfig[channelName];

        // listen to the wrap up event for the reservation
        trueReservation.addListener('wrapup', payload => {
          //if the configuration exist and if the configuration for the channel is enabled
          //then wrapup the task within the time mentioned in the configuration for that channelName
          if (channelWrapUpConfiguration && channelWrapUpConfiguration.enabled){
            setTimeout(()=> {
              flex.Actions.invokeAction('CompleteTask', { sid: reservation.sid });
            }, channelWrapUpConfiguration.maxSeconds*1000);
          }
        });
      });
    }

    // else show a notification that the configuration does not exist
    else {
      flex.Notifications.showNotification('UnconfiguredAutoWrapupTimer');
    }
  }
}
