import { Injectable } from '@nestjs/common';

export enum SellerBotState {
  IDLE = 'idle',
  AWAITING_CONTACT = 'awaiting_contact',
  AWAITING_FIRST_NAME = 'awaiting_first_name',
  AWAITING_LAST_NAME = 'awaiting_last_name',
  AWAITING_STORE_NAME = 'awaiting_store_name',
  AWAITING_STORE_SLUG = 'awaiting_store_slug',
  AWAITING_PRODUCT_NAME = 'awaiting_product_name',
  AWAITING_PRODUCT_PRICE = 'awaiting_product_price',
  AWAITING_PRODUCT_DESCRIPTION = 'awaiting_product_description',
  AWAITING_PRODUCT_CATEGORY = 'awaiting_product_category',
  AWAITING_BOT_TOKEN_CONNECT = 'awaiting_bot_token_connect',
  CONFIRM_DESTRUCTIVE_ACTION = 'confirm_destructive_action',
}

const TRANSITIONS: Record<SellerBotState, ReadonlyArray<SellerBotState>> = {
  [SellerBotState.IDLE]: [
    SellerBotState.AWAITING_CONTACT,
    SellerBotState.AWAITING_STORE_NAME,
    SellerBotState.AWAITING_PRODUCT_NAME,
    SellerBotState.AWAITING_BOT_TOKEN_CONNECT,
    SellerBotState.CONFIRM_DESTRUCTIVE_ACTION,
  ],
  [SellerBotState.AWAITING_CONTACT]: [
    SellerBotState.AWAITING_FIRST_NAME,
    SellerBotState.IDLE,
  ],
  [SellerBotState.AWAITING_FIRST_NAME]: [
    SellerBotState.AWAITING_LAST_NAME,
    SellerBotState.IDLE,
  ],
  [SellerBotState.AWAITING_LAST_NAME]: [SellerBotState.IDLE],
  [SellerBotState.AWAITING_STORE_NAME]: [
    SellerBotState.AWAITING_STORE_SLUG,
    SellerBotState.IDLE,
  ],
  [SellerBotState.AWAITING_STORE_SLUG]: [SellerBotState.IDLE],
  [SellerBotState.AWAITING_PRODUCT_NAME]: [
    SellerBotState.AWAITING_PRODUCT_PRICE,
    SellerBotState.IDLE,
  ],
  [SellerBotState.AWAITING_PRODUCT_PRICE]: [
    SellerBotState.AWAITING_PRODUCT_DESCRIPTION,
    SellerBotState.IDLE,
  ],
  [SellerBotState.AWAITING_PRODUCT_DESCRIPTION]: [
    SellerBotState.AWAITING_PRODUCT_CATEGORY,
    SellerBotState.IDLE,
  ],
  [SellerBotState.AWAITING_PRODUCT_CATEGORY]: [SellerBotState.IDLE],
  [SellerBotState.AWAITING_BOT_TOKEN_CONNECT]: [SellerBotState.IDLE],
  [SellerBotState.CONFIRM_DESTRUCTIVE_ACTION]: [SellerBotState.IDLE],
};

@Injectable()
export class SellerBotStateMachine {
  getInitialState(): SellerBotState {
    return SellerBotState.IDLE;
  }

  canTransition(fromState: SellerBotState, toState: SellerBotState): boolean {
    return TRANSITIONS[fromState]?.includes(toState) ?? false;
  }
}

