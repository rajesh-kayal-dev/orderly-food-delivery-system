import NotificationFactory from './NotificationFactory.js';
import SmsSender from '../senders/SmsSender.js';

class SmsNotificationFactory extends NotificationFactory {
  createSender() {
    return new SmsSender();
  }
}

export default SmsNotificationFactory;