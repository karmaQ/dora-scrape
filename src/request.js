import * as request from "request-promise"
export default async (opts)=>{
  console.info("request:", opts.uri)
  opts.uri = encodeURI(opts.uri)
  // return new Promise((resolve,reject)=>{
  //   return request.get(opts.uri).then(resolve).catch(reject)
  // })
  console.log()
  return {
    text: await request.get(opts.uri)
  }
}
