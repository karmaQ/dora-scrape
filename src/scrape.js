import Typheous from "typheous"
import request from "./request"
import Picker from "./picker"
import { isPlainObject,
         isFunction,
         defaultsDeep,
         includes,
         flatten,
         flattenDeep,
         isObject,
         isArray,
         toString,
         clone,
         mapKeys
       } from "lodash"
class Scrape {
  constructor(seedUri, iterators, defaultRecipe, opts) {
    this.crawledLinks = []
    this.keepedLinks = []
    // 设置默认值
    if(defaultRecipe) {
      this.defaulRecipe = defaultRecipe
    } else if (isPlainObject(iterators)) {
      this.defaulRecipe = iterators
    }
    // TODO 根据 iterators 生成 Links
    this.links = [
      "http://www.ruby-china.com"
    ]
    this.rules = {}
    this.saves = {}
    let _iterators = []
    iterators = [[4,5,6,7],[1,2,3,4,5,6]]
    for(let k in iterators) {
      _iterators.push([toString(k), iterators[k]])
    }
    let links = this.makeLinks("http://www.h.com/?asd=${0}&sad=${1}",
                               _iterators)
    let picker = new Picker
    this.picker = picker.pick.bind(picker)
    this.typheous = new Typheous()
  }

  scrape() {
    this.queue(this.links)
  }

  makeLinks(baseUri, iterators ) {
    let _makeLinks = (baseUri, iterators) => {
      let its = iterators.pop()
      let links = its[1].map( it => {
        return baseUri.replace("${" +  its[0] + "}", it)
      })
      if(iterators.length == 0 ) {
        return links
      } else {
        return links.map( link => {
          return _makeLinks(link, clone(iterators))
        })
      }
    }
    return flattenDeep(_makeLinks(baseUri, iterators))
  }

  queue(links) {
    let queueLinks = links.map((x)=>{
      return {
        uri: x,
        processor: (error, opts)=>{ return request(opts) },
        after: this.after(x)
      }
    })
    console.info("queued:", links.length, "urls")
    this.typheous.queue(queueLinks)
  }

  on(rules, recipe) {
    Array.isArray(rules) || (rules = [rules])
    rules.map(rl => {
      // TODO 当 recipe 为字符串时,从默认 recipe 列表中选取.
      this.rules[rl] = recipe
    })
    this.lastOn = rules
    if(includes(rules, "default")) {
      this.defaulRecipe = defaultsDeep(this.defaulRecipe,
                                       this.rules["default"])
    }
    return this
  }

  keep(callback) {
    this.doKeep = callback || ((x)=> {})
  }

  save(rules, callback) {
    if(isFunction(rules)) {
      callback = rules
      rules = this.lastOn || ["default"]
    }
    Array.isArray(rules) || (rules = [rules])
    rules.map(rl => this.saves[rl] = callback )
    return this
  }

  howSave(uri) {
    return this.getRules(uri,
                         this.saves,
                         recipes => flattenDeep(recipes)[0] )
  }

  howPipe(uri) {
    return this.getRules(uri, this.keeps, recipes => flatten(recipes))
  }

  howPick(uri) {
    return this.getRules(uri, this.rules, recipes => {
      return recipes.reduce((x, y) => {
        return defaultsDeep(x, y)
      }, {})
    })
  }

  getRules(uri, does, how) {
    let recipes = []
    // TODO 缓存 rules
    for(let r in does) {
      if(new RegExp(r).test(uri)) {
        recipes.push(does[r])
      }
    }
    if (does.default) {
      recipes.push(does.default)
    }
    return how(recipes)
  }

  pipe() {
    ;
  }

  processor() {
    ;
  }

  addLink(links) {
    this.queue(links)
  }

  after(uri) {
    let howPick = this.howPick(uri)
    let picker = this.picker
    let saver = this.howSave(uri)
    let linkAdder = this.addLink.bind(this)
    return function(res) {
      let [doc, $, links] = picker(res, howPick)
      if(links.length > 0)
        linkAdder(links)
      saver(doc, res, uri)
    }
  }
  
  use(fn) {
    fn(this)
    return this
  }  
}

export default Scrape
