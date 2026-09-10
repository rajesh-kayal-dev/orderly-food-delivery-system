import NotificationFactory from './NotificationFactory.js';
import PushSender from '../senders/PushSender.js';

export default class PushNotificationFactory extends NotificationFactory {
  createSender() {
    return new PushSender();
  }
}
