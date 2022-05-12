import FlexState from '../states/FlexState';

export function checkExistingReservation() {    
    let wrapping_reservation = {'wrapping': false, 'existing_reservation': null};
    FlexState.workerTasks.forEach(reservation => {
      let existing_reservation = reservation;
       if(existing_reservation.status === "wrapping"){    
        wrapping_reservation = {'wrapping': true, 'existing_reservation': existing_reservation};
       }       
    });
    return wrapping_reservation;
}
