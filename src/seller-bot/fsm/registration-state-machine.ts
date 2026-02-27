import { Injectable } from '@nestjs/common';

export enum SellerRegistrationState {
  NEW = 'NEW',
  LANG_SELECT = 'LANG_SELECT',
  AWAITING_CONTACT = 'AWAITING_CONTACT',
  REGISTERED = 'REGISTERED',
}

const TRANSITIONS: Readonly<Record<SellerRegistrationState, readonly SellerRegistrationState[]>> = {
  [SellerRegistrationState.NEW]: [SellerRegistrationState.LANG_SELECT],
  [SellerRegistrationState.LANG_SELECT]: [SellerRegistrationState.AWAITING_CONTACT],
  [SellerRegistrationState.AWAITING_CONTACT]: [SellerRegistrationState.REGISTERED],
  [SellerRegistrationState.REGISTERED]: [SellerRegistrationState.REGISTERED],
};

@Injectable()
export class SellerRegistrationStateMachine {
  canTransition(from: SellerRegistrationState, to: SellerRegistrationState): boolean {
    return TRANSITIONS[from]?.includes(to) ?? false;
  }
}
