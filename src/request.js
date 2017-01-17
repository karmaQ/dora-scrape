import * as request from "request"
import * as charset from 'charset'
import * as jschardet from 'jschardet'
import { includes, defaultsDeep } from 'lodash'
import os from 'os'
const decode
if(os.platform() == "win32") {
  import { iconv } from "iconv-lite"
  decode = (buffer, encoding) => {
    return iconv.decode(buffer, encoding)
  }
} else {
  import { Iconv } from "iconv"
  decode = (buffer, encoding) => {
    let iconv = new Iconv(encoding, 'UTF-8//TRANSLIT//IGNORE')
    return iconv.convert(buffer).toString()
  }
}
const defaultOpts = {
  method: 'GET',
  timeout: 6000,
  encoding: null,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36'
  }
}
export default async (opts)=>{
  console.info("request:", opts.uri)
  opts.uri = encodeURI(opts.uri)
  // return new Promise((resolve,reject)=>{
  //   return request.get(opts.uri).then(resolve).catch(reject)
  // })
  
  let text = await new Promise(function(resolve, reject) {
    // console.log(defaultsDeep(opts, defaultOpts))
    request(defaultsDeep(opts, defaultOpts) , function(err, res, body)
      {
        if(err) {
          reject(err)
        } else {
          let result, buffer = body
          let encoding = charset(res, buffer)
          encoding = encoding || jschardet.detect(buffer).encoding
          // var result = iconv.decode(bufferHelper.toBuffer(),'GBK');
          if(encoding) {
            console.info("Detecd charset", encoding)
            if(includes(['ascii', 'utf', 'utf8'], encoding)) {
              res.text = buffer.toString()
            } else {
              res.text = decode(buffer, encoding)
            }
          }
          resolve(res.text)
        }
      })
  })
  // .on('response', function(res, err) {
    
  //   let buffer = []//new BufferHelper();
  //   res.on('data', function (chunk) {
  //     buffer.push(chunk);
  //   });
  //   res.on('end',function(){
  //     let result
  //     let encoding = charset(res, buffer)
  //     encoding = encoding || jschardet.detect(buffer).encoding
  //     // var result = iconv.decode(bufferHelper.toBuffer(),'GBK');
  //     if(encoding) {
  //       console.info("Detecd charset", encoding)
  //       if(includes(['ascii', 'urf'],encoding)) {
  //         res.text = buffer.toString()
  //       } else {
  //         let iconv = new Iconv(encoding, 'UTF-8//TRANSLIT//IGNORE')
  //         result = iconv.convert(buffer).toString()
  //       }
  //     }
  //     console.log('decoded chunk: ' + result)
      
  //     return result
  //   })
    // decompressed data as it is received
  // })

  return {
    text: text
  }
}
