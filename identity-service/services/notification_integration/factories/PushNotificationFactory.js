import NotificationFactory from './NotificationFactory.js';
import PushSender from '../senders/PushSender.js';

class PushNotificationFactory extends NotificationFactory {
  createSender() {
    return new PushSender();
  }
}

export default PushNotificationFactory;