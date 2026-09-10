import AccountState from './AccountState.js';

export default class PendingState extends AccountState {
  constructor() {
    super('PENDING');
  }

  handle() {
    throw new Error('Account is pending admin approval. Please wait for confirmation.');
  }

  async activate(account) {
    const { default: ActiveState } = await import('./ActiveState.js');
    account.user.is_active = true;
    account.setState(new ActiveState());
    return account;
  }

  async suspend(account) {
    const { default: SuspendedState } = await import('./SuspendedState.js');
    account.user.is_active = false;
    account.setState(new SuspendedState());
    return account;
  }
}
