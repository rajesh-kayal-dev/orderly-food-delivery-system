import AccountState from './AccountState.js';

class PendingState extends AccountState {
  constructor() {
    super('PENDING');
  }

  handle() {
    throw new Error('Account is pending admin approval. Please wait for confirmation.');
  }

  activate(account) {
    import ActiveState from './ActiveState.js';
    account.user.is_active = true;
    account.setState(new ActiveState());
    return account;
  }

  suspend(account) {
    import SuspendedState from './SuspendedState.js';
    account.user.is_active = false;
    account.setState(new SuspendedState());
    return account;
  }
}

export default PendingState;
