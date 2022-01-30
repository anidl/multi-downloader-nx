import { AuthData, CheckTokenResponse, MessageHandler, SearchData, SearchResponse } from '../../../../@types/messageHandler';
import Crunchy from '../../../../crunchy';
import Funimation from '../../../../funi';
import { dubLanguageCodes } from '../../../../modules/module.langsData';

class CrunchyHandler implements MessageHandler {
  private crunchy: Crunchy;
  constructor() {
    this.crunchy = new Crunchy();
  }
  
  public async dubLangCodes(): Promise<string[]> {
    return dubLanguageCodes;
  }

  public async search(data: SearchData): Promise<SearchResponse> {
    const funiSearch = await this.crunchy.doSearch(data);
    if (!funiSearch.isOk)
      return funiSearch;
    return { isOk: true, value: funiSearch.value };
  }

  public async checkToken(): Promise<CheckTokenResponse> {
    if (this.crunchy.checkToken()) {
      return { isOk: true, value: undefined };
    } else {
      return { isOk: false, reason: new Error('') };
    }
  }

  public auth(data: AuthData) {
    return this.crunchy.doAuth(data);
  }
}

export default CrunchyHandler;