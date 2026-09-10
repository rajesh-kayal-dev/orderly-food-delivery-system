import AccountState from './AccountState.js';
import ActiveState from './ActiveState.js';

export default class SuspendedState extends AccountState {
  constructor() {
    super('SUSPENDED');
  }

  handle() {
    throw new Error('Account has been deactivated. Please contact support.');
  }

  activate(account) {
    account.user.is_active = true;
    account.setState(new ActiveState());
    return account;
  }

  suspend(account) {
    account.user.is_active = false;
    return account;
  }
}
