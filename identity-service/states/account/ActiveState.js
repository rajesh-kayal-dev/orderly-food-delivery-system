import AccountState from './AccountState.js';
import SuspendedState from './SuspendedState.js';

export default class ActiveState extends AccountState {
  constructor() {
    super('ACTIVE');
  }

  handle() {
    return true;
  }

  activate(account) {
    account.user.is_active = true;
    return account;
  }

  suspend(account) {
    account.user.is_active = false;
    account.setState(new SuspendedState());
    return account;
  }
}
