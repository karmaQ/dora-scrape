import Typheous from "typhoeus"
// import request from "./superagent"
// import request from "./request"

import { 
	defaults,
	castArray
} from "lodash"

class scrape {
	constructor(opts) {
		this.crawledLinks = []
		this.typheous = new Typheous(defaults(opts, {
      concurrency: 10,
      gap: null,
      onDrain: ()=> {
        console.log("resolved & drained")
      }
		}))
	}

	get(url, iterators, recipe) {

	}

	queue(links, opts) {
		links = castArray(links)

	}

	on() {

	}

	includes() {

	}

  use(fn) {
    fn(this)
    return this
  }  
}