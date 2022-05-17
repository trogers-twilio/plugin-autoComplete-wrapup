import FlexState from '../states/FlexState';

import { Manager } from "@twilio/flex-ui";

export function getConfiguration() {
    const wrapupConfig = Manager.serviceConfiguration?.ui_attributes?.autoWrapupTimer;
    return wrapupConfig;
}

export function checkExistingReservation() {    

    // let wrapping = false;
    // let existing_reservations = []; 
    
    wrapupConfig = getConfiguration();

    if (wrapupConfig){  

        const timers = new Map();

        FlexState.workerTasks.forEach(reservation => {

            const existing_reservation = reservation;
            let reservation_channelName = existing_reservation.taskChannelUniqueName;
            let reservaton_channelWrapUpConfiguration = wrapupConfig[reservation_channelName];

            // set a variable for timeout, this is used for clearing timeouts if the task is completed
            let existingReservation_timer ;

            if(existing_reservation.status === "wrapping"){

                if (reservaton_channelWrapUpConfiguration && reservaton_channelWrapUpConfiguration.enabled){

                    let date_last_updated = existing_reservation.dateUpdated;
                    let age_so_far_ms = (new Date() - new Date(date_last_updated));
                    let reservation_wrapUpTime_seconds = reservaton_channelWrapUpConfiguration.maxSeconds;
                    let remaining_time = (reservation_wrapUpTime_seconds*1000) - age_so_far_ms;
                    remaining_time = remaining_time <= 0 ? 1 : remaining_time;

                    existingReservation_timer = setTimeout(()=> {
                    flex.Actions.invokeAction('CompleteTask', { sid: existing_reservation.sid });
                    }, remaining_time);

                    timers.set(existing_reservation.sid, existingReservation_timer);
                }
           }
        });
    
    }
  
}
