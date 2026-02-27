import { Injectable } from '@nestjs/common';

export enum CustomerBotState {
  NEW = 'NEW',
  LANG_SELECT = 'LANG_SELECT',
  IDLE = 'IDLE',
  AWAITING_CONTACT = 'AWAITING_CONTACT',
  AWAITING_ADDRESS = 'AWAITING_ADDRESS',
  AWAITING_PAYMENT = 'AWAITING_PAYMENT',
}

const TRANSITIONS: Readonly<Record<CustomerBotState, readonly CustomerBotState[]>> = {
  [CustomerBotState.NEW]: [CustomerBotState.LANG_SELECT],
  [CustomerBotState.LANG_SELECT]: [CustomerBotState.IDLE],
  [CustomerBotState.IDLE]: [CustomerBotState.AWAITING_CONTACT, CustomerBotState.AWAITING_ADDRESS],
  [CustomerBotState.AWAITING_CONTACT]: [CustomerBotState.AWAITING_ADDRESS],
  [CustomerBotState.AWAITING_ADDRESS]: [CustomerBotState.AWAITING_PAYMENT],
  [CustomerBotState.AWAITING_PAYMENT]: [CustomerBotState.IDLE],
};

@Injectable()
export class CustomerRegistrationStateMachine {
  canTransition(from: CustomerBotState, to: CustomerBotState): boolean {
    return TRANSITIONS[from]?.includes(to) ?? false;
  }
}
