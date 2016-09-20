import { toNumber } from "lodash"
export let numbers = (ret) => {
  return toNumber(ret.replace(/[^\d]/g,''))
}
