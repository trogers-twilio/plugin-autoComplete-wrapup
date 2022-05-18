import AutoWrapupTimer from './AutoWrapupTimer';
import HangUpCall from './HangUpCall';

export default (flex, manager) => {
  manager.strings = {
    // -v- Add custom strings here -v-
    ...AutoWrapupTimer,
    ...HangUpCall,
    // -^---------------------------^-

    ...manager.strings,

    // -v- Modify strings provided by flex here -v-

    // -^----------------------------------------^-
  }
}
