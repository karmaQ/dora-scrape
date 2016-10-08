import { picker } from "./picker"
import Typheous from "typheous"
import request from "./request"

import { isPlainObject,
         isFunction,
         defaultsDeep,
         includes,
         flatten,
         flattenDeep,
         isObject,
         isArray,
         isString,
         isRegExp,
         toString,
         clone,
         mapKeys,
         uniq,
         castArray,
         assign,
         pick,
         omit
       } from "lodash"

import {
  iterateLinks
} from "./utils"

class Scrape {
  constructor(seedUri, iterators, defaultRecipe, opts) {
    this.crawledLinks = []
    this.keepedLinks = []
    this.rules = {}
    this.thens = {}
    // 设置默认值
    if(defaultRecipe) {
      this.defaulRecipe = defaultRecipe
    } else if (isPlainObject(iterators)) {
      this.defaulRecipe = iterators
      iterators = undefined
    }

    if(iterators) {
      this.links = iterateLinks(seedUri, iterators)
    } else if(seedUri) {
      this.links = castArray(seedUri)
    } else {
      this.links = []
    }
    // console.log(this.links)
    this.typheous = new Typheous({
      onDrain: ()=> {
        console.log("resolved & drained")
      }
    })
    this.request = request
  }

  concat(links) {
    return this.links = this.links.concat(links)
  }

  scrape() {
    return this.queue(this.links)
  }

  // queue(links, ctxIn) {
  //   return new Promise((resolve, reject)=>{
  //     try {
  //       let queueLinks = links.map((x)=>{
  //         let uri = x.uri ? x.uri : x
  //         return {
  //           uri: uri,
  //           processor: (error, opts)=> request(opts),
  //           after: this.after(x, x.info, ctxIn),
  //           onDrain: ()=> {
  //             resolve()
  //             console.log("resolved & drained")
  //           }
  //         }
  //       })
  //       console.info("queued:", links.length, "urls")
  //       this.typheous.queue(queueLinks)
  //     } catch (error) {
  //       console.log('rejected')
  //       return reject(error)
  //     }
  //   })
  // }

  queue(links, ctxIn) {
    let queueLinks = links.map((x)=>{
      let uri = x.uri ? x.uri : x
      if(!includes(uri, 'http')){return null}
      return {
        uri: uri,
        priority: x.priority || 5,
        processor: (error, opts)=> request(opts),
        after: this.after(x, x.info, ctxIn),
      }
    }).filter(x=>x)
    console.info("queued:", links.length, "urls")
    this.typheous.queue(queueLinks)
  }

  on(rules, recipes) {
    rules = castArray(rules)
    rules.map(rl => {
      // TODO 当 recipes 为字符串时,从默认 recipes 列表中选取.
      this.rules[rl] = recipes
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

  getRules(link, does, how) {
    let recipes = []
    // TODO 缓存 rules
    for(let r in does) {
      let isMatch, uri = link.uri ? link.uri : link
      if (isString(r)) {
        isMatch = includes(uri, r)
      } else if (isRegExp(r)){
        isMatch = r.test(uri)
      }
      if(isMatch) {
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

  then(rules, callback) {
    if(isFunction(rules)) {
      callback = rules
      rules = this.lastOn || ["default"]
    }
    Array.isArray(rules) || (rules = [rules])
    rules.map(rl => {
      if(this.thens[rl]) {
        this.thens[rl].push(callback) 
      } else {
        this.thens[rl] = castArray(callback)
      }
    })
    return this
  }

  howThen(uri) {
    let theners = this.getRules(uri,
                                this.thens,
                                recipes => flattenDeep(recipes) )
    return async (doc, res, uri)=> {
      try {
        await theners.reduce( async (ret, thener) => {
          if(ret && ret.doc) {
            await thener(ret.doc, ret.res, ret.uri)
          } else {
            await thener(ret, doc, res, uri)
          }
        }, {doc, res, uri})
      } catch (error) {
        console.log(error) 
      }
    }
  }

  save(rules, callback) {
    return this.then(rules, callback)
  }
  // ctx 是 uri 中附带的 info
  after(uri, ctx, ctxIh) {
    let howPick = this.howPick(uri)
    let thener = this.howThen(uri)
    return async (res) => {
      let [doc, opts, follows] = picker(res, howPick)
      // doc = assign(ctxIh, ctx, doc)
      if(follows.length > 0) {
        if (opts.context) {
          await this.queue(follows, assign(ctxIh, doc))
        } else {
          await this.queue(follows)
        }
      }
      if(opts.fields) {
        doc = pick(doc, opts.fields)
      }
      if(opts.except) {
        doc = omit(doc, opts.except);
      }      
      thener && thener(assign(ctx, doc), res, uri)
    }
  }
  
  use(fn) {
    fn(this)
    return this
  }  
}

export default Scrape
