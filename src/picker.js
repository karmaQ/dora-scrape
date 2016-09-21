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
         assign
       } from "lodash"
import * as object from "lodash/fp/object"
import * as pipes from "./pipes"
let mapValuesWithKey = object.mapValues.convert({ 'cap': false })
import {
  isBlank
} from "./utils"

function keepLinks(ret, recipe) {
    let links = []
    let getVal = (item, path) => {
      return path.reduce((r, k)=>{return r[k]}, item)
    }
    if(isString(recipe.keep)) {
      let _ret = isArray(ret) ? ret : [ret]
      let path = split(recipe.keep, ".")
      _ret.map((x) => {
        try {
          links.push(getVal(x, path))
        } catch(e) {
          //console.log(e)
        }
      })
    } else if (recipe) {
      links.push(ret)
    } else {
      links.push(ret)
    }
    return links
  }

function line($, recipe) {
  if (isString(recipe) || isArray(recipe) || isRegExp(recipe)) {
    recipe = { selector:recipe }
  } else {
    recipe = clone(recipe)
  }
  let ret = null, selectors = null
  if (isString(recipe.selector)) {
    ret = html($, recipe)
  } else if (isArray(recipe.selector)) {
    let selectors = recipe.selector
    for(let sel of selectors) {
      recipe.selector = sel
      ret = html($, recipe)
      if(!isBlank(ret)) {
        break
      }
    }
  } else if (isRegExp(recipe.selector)){
    ret = $.html().match(recipe.selector)
  } else {
    ret = null
  }
  return isBlank(ret) ? recipe.default : ret
}

export function html($, recipe) {
  let sel = recipe.selector
  if(includes(sel, '::')) {
    let eqAttr
    [sel, eqAttr] = split(sel, "::")
    eqAttr = toNumber(eqAttr)
    // let eqAttr = toNumber(split(sel, "::")[1])
    // sel = recipe.selector.split("::")[0]
    if (isNumber(eqAttr)) {
      recipe.eq = eqAttr
    } else {
      recipe.attr = eqAttr
    }
  }
  if (sel.indexOf("meta") >= 0) {
    recipe.attr = recipe.attr || "content"
  }
  if (recipe.attr) {
    recipe.how = ($e) => $e.attr(recipe.attr)
  }
  if (recipe.attrs) {
    recipe.how = ($e) => {
      let ret = {}
      recipe.attrs.map((x)=> {
        let [xa, xn] = split(x, ':')
        ret[xn || xa] = xa == "text" ? $e.text() : $e.attr(xa)
      })
      return ret
    }
  }
  recipe.how = recipe.how || "text"
  let getElm = ($elm) => {
    let ret
    if(isFunction(recipe.how)) {
      ret = recipe.how($elm)
    } else {
      if($elm[recipe.how]) {
        ret = $elm[recipe.how]()
      }
    }
    // TODO 添加 pipe, 可以自定义 pipes 以及从默认 pipes 中选择
    
    if(isString(recipe.pipes)) {
      recipe.pipes = recipe.pipes.replace(/\s+/g,'')
      let rpipes = recipe.pipes.split('|')
      ret = rpipes.reduce((a,b)=>{ return pipes[b](a) }, ret)
    }
    ret = isFunction(recipe.convert) ? recipe.convert(ret) : ret
    return ret
  }
  if (includes(sel, '**')) {
    sel = split(sel, '**')[0]
    let ret = []
    $(sel).each( (i, elm) => ret.push(getElm($(elm))))
    return ret
  } else {
    let $elm = $(sel)
    if(isNumber(recipe.eq)) {
      $elm = $elm.eq(recipe.eq)
    }
    return getElm($elm)
  }
}

export function byJson(text, opts) {
  // TODO 将 JSON 等价转化为 html
  return text
}

export function toHtml(json) {

}

export function toXml(json) {
  
}

export function byHtml(text, opts) {
  let $, links = [], flattenLines = []
  if (isString(text)) {
    $ = cheerio.load(text, { decodeEntities: false })
  }
  let doc = mapValuesWithKey( (recipe, k) =>{
    let ret = line($, recipe)
    if(recipe.keep) {
      links.push(keepLinks(ret, recipe))
    }
    if(recipe.flatten) {
      flattenLines.push(k)
    }
    return ret
  }, opts)
  // TODO object.assign 重构
  flattenLines.map(x=>{
    assign(doc, doc[x])
    delete(doc[x])
  })
  return [doc, $, flattenDeep(links).filter(x=>x)]
}

export function pick(res, opts)  {
  let text = res.text || ""
  if (text.match(/^\s*</)) {
    return byHtml(text, opts)
  } else if (text.match(/^\s*{/)) {
    return byJson(text, opts)
  } else {
    return byHtml(text, opts)
  }
}