import { AuthData, AuthResponse, MessageHandler } from "../../../../@types/messageHandler";

import * as funi from '../../../../funi';

class FunimationHandler implements MessageHandler {
  public auth(data: AuthData) {
    return funi.auth(data.username, data.password);
  }
}

export default FunimationHandler;