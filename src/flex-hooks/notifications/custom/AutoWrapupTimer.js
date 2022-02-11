import * as Flex from '@twilio/flex-ui';
import AutoWrapupTimerStringTemplates from '../../strings/AutoWrapupTimer';

export default (flex, manager) => {
  UnconfiguredAutoWrapupTimer(flex, manager);
}

function UnconfiguredAutoWrapupTimer(flex, manager) {
  flex.Notifications.registerNotification({
    id: 'UnconfiguredAutoWrapupTimer',
    type: Flex.NotificationType.error,
    content: AutoWrapupTimerStringTemplates.UnconfiguredAutoWrapupTimer
  });
}
