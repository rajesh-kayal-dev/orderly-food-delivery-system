import AccountState from './AccountState.js';

class ActiveState extends AccountState {
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
    import SuspendedState from './SuspendedState.js';
    account.user.is_active = false;
    account.setState(new SuspendedState());
    return account;
  }
}

export default ActiveState;
