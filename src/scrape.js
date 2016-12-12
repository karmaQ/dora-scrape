import { picker } from "./picker"
import Typheous from "typheous"
// import request from "./superagent"
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
         omit,
         keys,
         startsWith
       } from "lodash"

import {
  iterateLinks
} from "./utils"

class Scrape {
  constructor(seedUri, iterators, defaultRecipe, opts = {}) {
    this.crawledLinks = []
    this.keepedLinks = []
    this.rules = {}
    this.thens = {}
    // 设置默认值
    // if(defaultRecipe) {
    //   this.defaulRecipe = defaultRecipe
    // } else if (isPlainObject(iterators)) {
    //   this.defaulRecipe = iterators
    //   iterators = undefined
    // }

    if(iterators) {
      this.links = iterateLinks(seedUri, iterators)
    } else if(seedUri) {
      this.links = castArray(seedUri)
    } else {
      this.links = []
    }
    // console.log(opts)
    this.typheous = new Typheous({
      concurrency: opts.concurrency || 10,
      gap: opts.gap || null,
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
    let linkLength = links.length
    let rets = []
    return Promise.resolve(new Promise((resolve, reject)=>{
      try {      
        let queueLinks = links.map((x)=>{
          let uri = x.uri ? x.uri : x
          if(!includes(uri, 'http')){
            if(--linkLength == 0) { resolve() }
            return null
          }
          return {
            uri: uri,
            priority: x.priority || 5,
            gap: x.gap || null
            processor: (error, opts)=> request(opts) ,
            // after: this.after(x, x.info, ctxIn),
            release: async(retval) =>{
              let ret
              try{
                ret = await this.after(x, x.info, ctxIn)(retval)
              }catch (error) {
                console.log(error)
              }
              rets.push(ret)
              // await this.after(x, x.info, ctxIn)(retval)
              if(--linkLength == 0) { 
                resolve(rets) 
              }
            },
            onError: (err)=>{
              console.log(err)
            }
          }
        })//.filter(x=>x)
        if(queueLinks.length == 0) {
          resolve([])
        }
        console.info("queued:", links.length, "urls")
        this.typheous.queue(queueLinks)
      } catch (error) {
        console.log('rejected')
        console.log(error)
        return reject(error)
      }
    }))   
  }

  on(rules, recipes) {
    rules = castArray(rules)
    rules.map(rl => {
      // TODO 当 recipes 为字符串时,从默认 recipes 列表中选取.
      if(isFunction(rl)) {
        let $rl = "$func$_" + keys(this.rules).length
        this.rules[$rl] = {
          on: rl,
          does: recipes
        }
      // else if(isRegExp(rl)) {
      //   let $rl = "$reg$_" + keys(this.rules).length
      //   this.rules[$rl] = {
      //     on: rl,
      //     does: recipes
      } else {
        this.rules[rl] = recipes
      }
    })
    this.lastOn = rules
    if(includes(rules, "default")) {
      this.defaulRecipe = defaultsDeep(this.defaulRecipe,
                                       this.rules["default"])
    }
    return this
  }

  then(rules, callback) {
    if(isFunction(rules)) {
      callback = rules
      rules = this.lastOn || ["default"]
    }
    rules = castArray(rules)
    rules.map(rl => {
      if(isFunction(rl)) {
        let $rl = "$func$_" + keys(this.rules).length
        if(this.thens[$rl]) {
          this.thens[$rl].does.push(callback)
        } else {
          this.thens[$rl] = {
            on: rl, does: [callback]
          }
        }
      } else {
        if(!this.thens[rl]) {this.thens[rl] = []}
        this.thens[rl].push(callback) 
      }
    })
    return this
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
      let isMatch, _do, uri = link.uri ? link.uri : link
      if (startsWith(r, "$func$_")) {
        isMatch = does[r].on(uri, link)
        _do = does[r].does
      } else if (startsWith(r, "$reg$_")){
        isMatch = r.test(uri)
        _do = does[r]
      } else  {
        isMatch = includes(uri, r)
        _do = does[r]
      }
      if(isMatch) {
        recipes.push(_do)
      }
    }
    if (does.default) {
      recipes.push(does.default)
    }
    return how(recipes)
  }

  processor() {
    ;
  }


  howThen(uri) {
    let theners = this.getRules(uri,
                                this.thens,
                                recipes => flattenDeep(recipes) )
    return async (doc, res, uri)=> {
      try {
        return await theners.reduce( async (ret, thener) => {
          if(ret && ret.doc) {
            return await thener(ret.doc, ret.res, ret.uri)
          } else {
            return await thener(ret, doc, res, uri)
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
      try{
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
        if(thener) { return await thener(assign(ctx, doc), res, uri) }
      } catch(error) {
        console.log(error)
      }
    }
  }
  
  use(fn) {
    fn(this)
    return this
  }  
}

export default Scrape
