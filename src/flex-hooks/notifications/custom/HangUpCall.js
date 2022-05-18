import * as Flex from '@twilio/flex-ui';
import HangUpCallStringTemplates from '../../strings/HangUpCall';

export default (flex, manager) => {
  HangUpCall(flex, manager);
}

function HangUpCall(flex, manager) {
  flex.Notifications.registerNotification({
    id: 'HangUpCall',
    type: Flex.NotificationType.error,
    content: HangUpCallStringTemplates.HangUpCall
  });
}
