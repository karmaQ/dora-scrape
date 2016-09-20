import Scrape from "./src/scrape"
import Picker from "./src/picker"
import * as _ from "lodash"
export default (uri, iterators, opts)=> {
  return new Scrape(uri, iterators, opts)
}
