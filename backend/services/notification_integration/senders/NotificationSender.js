export default class NotificationSender {
  async send(message) {
    throw new Error('send(message) must be implemented by concrete sender');
  }
}
