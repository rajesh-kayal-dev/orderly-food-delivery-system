import AccountState from './AccountState.js';

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

  async suspend(account) {
    const { default: SuspendedState } = await import('./SuspendedState.js');
    account.user.is_active = false;
    account.setState(new SuspendedState());
    return account;
  }
}
