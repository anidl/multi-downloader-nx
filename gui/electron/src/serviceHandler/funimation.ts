import { AuthData, AuthResponse, MessageHandler } from "../../../../@types/messageHandler";

import Funimation from '../../../../funi';

class FunimationHandler implements MessageHandler {
  private funi: Funimation;
  constructor() {
    this.funi = new Funimation();
  }

  public auth(data: AuthData) {
    return this.funi.auth(data);
  }
}

export default FunimationHandler;