import { isNumber,
         isString,
         isRegExp,
         isEmpty,
         clone,
         uniq,
         flattenDeep,
         toString
       } from "lodash"

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
  let _iterators = []
  // iterators = [[4,5,6,7],[1,2,3,4,5,6]]
  for(let i in iterators) {
    _iterators.push([toString(i), iterators[i]])
  }
  let _makeLinks = (baseUri, iterators) => {
    let its = iterators.pop()
    let links = its[1].map( it => {
      return baseUri.replace("${" + its[0] + "}", it)
    })
    if(iterators.length == 0 ) {
      return links
    } else {
      return links.map( link => {
        return _makeLinks(link, clone(iterators))
      })
    }
  }
  return uniq(flattenDeep(_makeLinks(baseUri, _iterators)))
}