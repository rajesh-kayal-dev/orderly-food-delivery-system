import AccountState from './AccountState.js';
import ActiveState from './ActiveState.js';
import SuspendedState from './SuspendedState.js';

export default class PendingState extends AccountState {
  constructor() {
    super('PENDING');
  }

  handle() {
    throw new Error('Account is pending admin approval. Please wait for confirmation.');
  }

  activate(account) {
    account.user.is_active = true;
    account.setState(new ActiveState());
    return account;
  }

  suspend(account) {
    account.user.is_active = false;
    account.setState(new SuspendedState());
    return account;
  }
}
