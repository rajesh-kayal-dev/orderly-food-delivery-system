import NotificationFactory from './NotificationFactory.js';
import SmsSender from '../senders/SmsSender.js';

export default class SmsNotificationFactory extends NotificationFactory {
  createSender() {
    return new SmsSender();
  }
}
