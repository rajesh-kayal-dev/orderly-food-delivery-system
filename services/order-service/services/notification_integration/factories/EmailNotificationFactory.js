import NotificationFactory from './NotificationFactory.js';
import EmailSender from '../senders/EmailSender.js';

export default class EmailNotificationFactory extends NotificationFactory {
  createSender() {
    return new EmailSender();
  }
}
