import NotificationFactory from './NotificationFactory.js';
import EmailSender from '../senders/EmailSender.js';

class EmailNotificationFactory extends NotificationFactory {
  createSender() {
    return new EmailSender();
  }
}

export default EmailNotificationFactory;