import { toNumber } from "lodash"
export let numbers = (ret) => {
  return toNumber((ret || '').replace(/[^\d]/g,''))
}
export let trim = (text) => {
	text = (text || "")
	text = text.replace('&nbsp;', '')
  return text.replace(/[\s]+/g, ""); 
}