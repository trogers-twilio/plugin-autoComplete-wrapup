import AutoWrapupTimer from './AutoWrapupTimer';

export default (flex, manager) => {
  manager.strings = {
    // -v- Add custom strings here -v-
    ...AutoWrapupTimer,
    // -^---------------------------^-

    ...manager.strings,

    // -v- Modify strings provided by flex here -v-

    // -^----------------------------------------^-
  }
}
