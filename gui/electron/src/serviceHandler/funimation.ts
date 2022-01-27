import { AuthData, CheckTokenResponse, MessageHandler, SearchData, SearchResponse } from "../../../../@types/messageHandler";
import Funimation from '../../../../funi';

class FunimationHandler implements MessageHandler {
  private funi: Funimation;
  constructor() {
    this.funi = new Funimation();
  }

  public async search(data: SearchData): Promise<SearchResponse> {
    const funiSearch = await this.funi.searchShow(false, data);
    if (!funiSearch.isOk)
      return funiSearch;
    return { isOk: true, value: funiSearch.value.items.hits.map(a => ({
      image: a.image.showThumbnail,
      name: a.title,
      desc: a.description,
      id: a.id,
      lang: a.languages,
      rating: a.starRating
    })) }
  }

  public async checkToken(): Promise<CheckTokenResponse> {
    return this.funi.checkToken();
  }

  public auth(data: AuthData) {
    return this.funi.auth(data);
  }
}

export default FunimationHandler;