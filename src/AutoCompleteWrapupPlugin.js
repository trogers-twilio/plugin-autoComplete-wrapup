import React from 'react';
import { VERSION } from '@twilio/flex-ui';
import { FlexPlugin } from 'flex-plugin';
import ConfigureFlexStrings from './flex-hooks/strings';
import RegisterFlexNotifications from './flex-hooks/notifications';



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

    // if the configuration for autoWrapupTimer exits then follow the logic below
    if (wrapupConfig) {
      manager.workerClient.on('reservationCreated', reservation => {
        // get the reservation
        const trueReservation = reservation.addListener?reservation:reservation.source;

        // get the channel name for the reservation
        const channelName = trueReservation.task.taskChannelUniqueName;

        //get the config time from the ui_attributes for the voice channel
        const channelWrapUpConfiguration = wrapupConfig[channelName];

        // listen to the wrap up event for the reservation
        trueReservation.addListener('wrapup', payload => {
          //if the configuration exist and if the configuration for the channel is enabled
          //then wrapup the task within the time mentioned in the configuration for that channelName
          if (channelWrapUpConfiguration && channelWrapUpConfiguration.enabled){
            setTimeout(()=> {
              flex.Actions.invokeAction('CompleteTask', { sid: reservation.sid });

            },channelWrapUpConfiguration.maxSeconds*1000);
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
