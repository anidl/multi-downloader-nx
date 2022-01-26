import { AuthData, AuthResponse, CheckTokenResponse, MessageHandler } from "../../../../@types/messageHandler";

import Funimation from '../../../../funi';

class FunimationHandler implements MessageHandler {
  private funi: Funimation;
  constructor() {
    this.funi = new Funimation();
  }

  public async checkToken(): Promise<CheckTokenResponse> {
    return this.funi.checkToken();
  }

  public auth(data: AuthData) {
    return this.funi.auth(data);
  }
}

export default FunimationHandler;