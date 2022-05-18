import AutoWrapupTimer from './AutoWrapupTimer';
import HangUpCall from './HangUpCall';

export default (flex, manager) => {
  AutoWrapupTimer(flex, manager);
  HangUpCall(flex, manager);
};

