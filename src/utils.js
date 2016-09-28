import { isNumber,
         isString,
         isRegExp,
         isEmpty,
         isArray,
         clone,
         uniq,
         flattenDeep,
         toString
       } from "lodash"
import * as util from 'util'

export const isBlank = (el) => {
  if (isString(el)) {
    return el.length == 0
  } else if (isNumber(el)) {
    return false
  } else {
    return isEmpty(el)
  }
}

export const iterateLinks = (baseUri, iterators) => {
  let _iterators = [], _iteratobjs = {}
  for(let i in iterators) {
    _iterators.push([toString(i), iterators[i]])
  }
  let _makeLinks = (baseUri, itras) => {
    let its = itras.pop(), links
    links = its[1].map( it => {
      return baseUri.replace("${" + its[0] + "}", it)
    })    
    if(itras.length == 0 ) {
      return links
    } else {
      return links.map( link => {
        return _makeLinks(link, clone(itras))
      })
    }
  }
  return uniq(flattenDeep(_makeLinks(baseUri, _iterators)))
}

export const debug = (obj) => {
  console.log(util.inspect(obj, true, null));
}