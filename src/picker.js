import * as cheerio from "cheerio"
import { isNumber,
         isString,
         isRegExp,
         isEmpty,
         isFunction,
         isArray,
         split,
         clone,
         toNumber,
         includes,
         flattenDeep,
         castArray,
         assign,
         isPlainObject,
         omit,
         get,
         keys
       } from "lodash"
import * as object from "lodash/fp/object"
import * as pipes from "./pipes"
import { toHtml } from "./to_html"
let mapValuesWithKey = object.mapValues.convert({ 'cap': false })
import {
  isBlank
} from "./utils"

const reserved = ['follow', 'xpath', 'sels', 'keep', 
                  'attrs', 'how', 'convert', 'pipes', 
                  'flatten', 'context']

// function followLinks(ret, recipe) {
//   if(!ret) { return [] }
//   let links = []
//   let getVal = (item, path) => {
//     return path.reduce((r, k)=>{return r[k]}, item)
//   }
//   let makeLink = (link, info) => {
//     return recipe.context ? { uri: link, info: info } : link
//   }
//   if(isString(recipe.follow)) {
//     let _ret = isArray(ret) ? ret : [ret]
//     let path = split(recipe.follow, ".")
//     _ret.map((x) => {
//       try {
//         links.push(makeLink(getVal(x, path), x))
//       } catch(e) {
//         console.log(e)
//       }
//     })
//   } else if (recipe) {
//     links.push(makeLink(ret))
//   } else {
//     links.push(makeLink(ret))
//   }
//   return links
// }

function followLinks(ret, recipe, urikey) {
  if(!ret) { return [] }
  let links = []
  let makeLink = (link, info) => {
    return recipe.context ? link : { uri: link, info: info }
  }  
  if(isString(recipe.follow)) {
    let _ret = castArray(ret)
    _ret.map((item) => {
      try {
        let url = get(item, recipe.follow)
        if(url) { links.push(makeLink(url, item)) }
      } catch(e) {
        console.log(e)
      }
    })
  } else {
    links.push(makeLink(ret, {[urikey]: ret}))
  }
  return links
}

function line($, recipe) {
  if (isString(recipe) || isArray(recipe) || isRegExp(recipe)) {
    recipe = { sels:recipe }
  } else {
    recipe = clone(recipe)
  }
  let ret = null, selectors = null
  if (isString(recipe.sels)) {
    ret = html($, recipe)
  } else if (isArray(recipe.sels)) {
    let selectors = recipe.sels
    for(let sel of selectors) {
      recipe.sels = sel
      ret = html($, recipe)
      if(!isBlank(ret)) {
        break
      }
    }
  } else if (isRegExp(recipe.sels)){
    ret = $.html().match(recipe.sels)
    ret = isFunction(recipe.convert) ? recipe.convert(ret) : ret
  } else {
    ret = html($, recipe)
  }
  if(isString(recipe.pipes)) {
    recipe.pipes = recipe.pipes.replace(/\s+/g,'')
    let rpipes = recipe.pipes.split('|')
    ret = rpipes.reduce((a,b)=>{ return pipes[b](a) }, ret)
  }
  return isBlank(ret) ? recipe.default : ret
}

export function html($, recipe) {
  if(isString(recipe)) { recipe = { sels: recipe } }
  let sel = recipe.sels
  
  let subs = omit(recipe, reserved)
  // 为 cheerio 实现 eq
  if(includes(sel, '::')) {
    let eqAttr
    [sel, eqAttr] = split(sel, "::")
    eqAttr = toNumber(eqAttr) || eqAttr
    // let eqAttr = toNumber(split(sel, "::")[1])
    // sel = recipe.sels.split("::")[0]
    if (isNumber(eqAttr) || eqAttr == '0') {
      recipe.eq = eqAttr
    } else {
      recipe.attrs = includes(eqAttr, '&') ? split(eqAttr, '&') : eqAttr
    }
  }
  // 处理特殊标签的默认属性
  if (includes(sel, 'meta')) {
    recipe.attrs = recipe.attrs || "content"
  }
  // 处理属性
  if (recipe.attrs) {
    if(isString(recipe.attrs)) {
      recipe.how = ($e) => $e.attr(recipe.attrs)
    } else if(isArray(recipe.attrs)){
      recipe.how = ($e) => {
        let ret = {}
        recipe.attrs.map((x)=> {
          // 优化
          let [xa, xn] = split(x, ':')
          ret[xn || xa] = xa == "text" ? $e.text() : $e.attr(xa)
        })
        return ret
      }
    }
  }
  // 处理嵌套查询
  if(subs.length > 0 || (keys(subs)).length > 0) {
    let subHow = function($elm) {
      let ret = {}
      if($elm.find) {
        $elm = $elm.find.bind($elm)
      }
      for (var key in subs) {
        ret[key] = line($elm, subs[key])
      }
      return ret
    }
    recipe.how = subHow
  }
    // 感觉没啥太大用啊
    // if(recipe.how) {
    //   recipe.how = function($elm) {
    //     let ret = {
    //       [recipe.name || "main"] : recipe.how($elm),
    //     }
    //     let subHowRet = subHow($elm)
    //     if(isPlainObject(subHowRet)) {
    //       ret = assign(ret, subHowRet) 
    //     } else {
    //       ret = assign(ret, {[recipe.subs.name || "sub"]:subHowRet} )
    //     }
    //     return ret
    //   }
    // } else {
    //   recipe.how = subHow
    // }
  recipe.how = recipe.how || "text"
  let getElm = ($elm) => {
    let ret
    if(isFunction(recipe.how)) {
      let how = recipe.how.bind({
        get:(r)=> line($elm.find.bind($elm), r),
        sels: recipe.sels
      })
      ret = how($elm)
    } else {
      if($elm[recipe.how]) {
        ret = $elm[recipe.how]()
      }
    }
    // TODO 添加 pipe, 可以自定义 pipes 以及从默认 pipes 中选择
    
    // if(ret && isString(recipe.pipes)) {
    //   recipe.pipes = recipe.pipes.replace(/\s+/g,'')
    //   let rpipes = recipe.pipes.split('|')
    //   ret = rpipes.reduce((a,b)=>{ return pipes[b](a) }, ret)
    // }

    ret = isFunction(recipe.convert) ? recipe.convert(ret) : ret
    return ret
  }
  if (includes(sel, '**')) {
    sel = split(sel, '**')[0]
    // let $elm = sel ? $(sel) : $
    let ret = []
    if(sel.length > 0) {
      $(sel).each( (i, elm) => ret.push(getElm($(elm))))
    } else {
      $.root().children().each( (i, elm) => ret.push(getElm($(elm))))
    }
    return ret
  } else {
    let $elm = sel ? $(sel) : $
    // let $elm = $(sel)
    if(isNumber(recipe.eq) || recipe.eq == '0') {
      $elm = $elm.eq(recipe.eq)
    }
    return getElm($elm)
  }
}

export function byJson(text, recipe, opts, res) {
  // TODO 将 JSON 等价转化为 html, xml
  try {
    let json = JSON.parse(text)
    text = toHtml(json)
  } catch(error) {
    console.log(res.uri)
    console.log(error)
    return null
  }
  return byHtml(text, recipe, opts)
}

export function toXml(json) {
  
}

export function byHtml(text, recipe, opts) {
  let $, links = [], flattenLines = []
  if (isString(text)) {
    $ = cheerio.load(text, { decodeEntities: false })
  }
  let doc = mapValuesWithKey( (rcp, k) =>{
    // 全部用 line 和 subs 一样处理掉
    let ret = line($, rcp)
    if(rcp.follow) {
      links.push(followLinks(ret, rcp, k))
    }
    if(rcp.flatten) {
      flattenLines.push(k)
    }
    return ret
  }, recipe)
  
  flattenLines.map(x=>{
    assign(doc, doc[x])
    delete(doc[x])
  })

  return [doc, opts, flattenDeep(links).filter(x=>x)]
}

export function picker(res, recipe)  {
  let text = res.text || ""
  let opts = clone(recipe.options) || {}
  delete(recipe.options)

  if(isString(opts.pre)) {
    recipe.pipes = recipe.pipes.replace(/\s+/g,'')
    let rpipes = recipe.pipes.split('|')
    text = rpipes.reduce((a,b)=>{ return pipes[b](a) }, text)
  } else if (isFunction(opts.pre)) {
    text = opts.pre(text)
  }
  switch (opts.format) {
    case 'json':
      return byJson(text, recipe, opts, res)
    case 'html':
      return byHtml(text, recipe, opts)
    case 'raw':
      return [{body: text}, opts, []]
    default:
      if (text.match(/^\s*</)) {
        return byHtml(text, recipe, opts)
      } else if (text.match(/^\s*{/)) {
        return byJson(text, recipe, opts)
      } else {
        return byHtml(text, recipe, opts)
      }    
  }
}