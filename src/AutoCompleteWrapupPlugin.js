import React from 'react';
import { VERSION } from '@twilio/flex-ui';
import { FlexPlugin } from '@twilio/flex-plugin';
import ConfigureFlexStrings from './flex-hooks/strings';
import RegisterFlexNotifications from './flex-hooks/notifications';
import {checkExistingReservation} from './helper/existingReservation';


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
   

    // This plugin should only load after other plugins have loaded
    manager.events.addListener('pluginsLoaded', () => {

      // get the wrapupConfig config from ui_attributes
      const wrapupConfig = manager.serviceConfiguration?.ui_attributes?.autoWrapupTimer;

      // if the configuration for autoWrapupTimer exists then follow the logic below
      if (wrapupConfig) {

        // declare a map to store the timers
        // this map will be passed to clearTimeout in case the agent finishes the task before autoComplete executes
        const timers = new Map();

        let reservationExists = checkExistingReservation();
        // console.log('testValue',reservationExists);

      
        if (reservationExists.wrapping === true){

          // Get the channel name for existing reservation
          let reservation_channelName = reservationExists.existing_reservation.taskChannelUniqueName;

          // Get the configuration for the channel
          let reservaton_channelWrapUpConfiguration = wrapupConfig[reservation_channelName];
          // console.log('Configuration',reservaton_channelWrapUpConfiguration)

          // set a variable for timeout, this is used for clearing timeouts if the task is completed
          let existingReservation_timer ;

          if (reservaton_channelWrapUpConfiguration && reservaton_channelWrapUpConfiguration.enabled){

            let date_last_updated = reservationExists.existing_reservation.dateUpdated;
            let age_so_far_ms = (new Date() - new Date(date_last_updated));
            let reservation_wrapUpTime_seconds = reservaton_channelWrapUpConfiguration.maxSeconds;
            let remaining_time = (reservation_wrapUpTime_seconds*1000) - age_so_far_ms;
            remaining_time = remaining_time <= 0 ? 1 : remaining_time;

            existingReservation_timer = setTimeout(()=> {
              flex.Actions.invokeAction('CompleteTask', { sid: reservationExists.existing_reservation.sid });
            }, remaining_time);

            timers.set(reservationExists.existing_reservation.sid, existingReservation_timer);
          }
              
        }
      
        manager.workerClient.on('reservationCreated', reservation => {
          // get the channel name for the reservation

          let trueReservation = reservation.addListener?reservation:reservation.source;
          let channelName = trueReservation.task.taskChannelUniqueName;

          //get the config time from the ui_attributes for the voice channel
          let channelWrapUpConfiguration = wrapupConfig[channelName];

          // set a variable for timeout, this is used for clearing timeouts if the task is completed
          let reservation_completeTimer;

          // listen to the wrap up event for the reservation
          trueReservation.addListener('wrapup', payload => {

            //if the configuration exist and if the configuration for the channel is enabled
            //then wrapup the task within the time mentioned in the configuration for that channelName
            if (channelWrapUpConfiguration && channelWrapUpConfiguration.enabled){
              reservation_completeTimer = setTimeout(()=> {
                flex.Actions.invokeAction('CompleteTask', { sid: reservation.sid });
              }, channelWrapUpConfiguration.maxSeconds*1000);

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
        
        // Check if there is any existing reservation that is in wrapping state when the agents LogsOut
        // If there is an activity in wrapping state when the agent is logging out then complete it
        flex.Actions.addListener("beforeLogout", () => {
          let reservationExistsBeforeLogout = checkExistingReservation();
          // console.log('Existing reservation',reservationExistsBeforeLogout)
          if (reservationExistsBeforeLogout.wrapping === true){
            flex.Actions.invokeAction('CompleteTask', { sid: reservationExistsBeforeLogout.existing_reservation.sid });
          }
        });

      }

      // else show a notification that the configuration does not exist
      else {
        flex.Notifications.showNotification('UnconfiguredAutoWrapupTimer');
      }
     
    }); 
  }
}
