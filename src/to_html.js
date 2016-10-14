import { toString, lowerCase } from "lodash"
/**
 * Escape the given string of `html`.
 *
 * @param {String} html
 * @return {String}
 * @api private
 */

function escape (html) {
  return String(html)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Return a span.
 *
 * @param {String} classname
 * @param {String} str
 * @return {String}
 * @api private
 */

function span(key, str) {
  return '<span class="' + lowerCase(key).replace(/\s+/g, '-') + '">' + str + '</span>';
}

/**
 * Convert JSON Object to attr.
 *
 * @param {Object} obj
 * @return {String}
 * @api private
 */

export function toAttrs(obj) {
  let ret = ''
  for (let key in obj) {
    if(typeof(obj[key]) != 'object') {
      ret += ` ${key}='${toString(obj[key]).replace('\'', '')}'`
    }
  }
  return ret
}

/**
 * Convert JSON Object to html.
 *
 * @param {Object} obj
 * @return {String}
 * @api public
 */

function _toHtml(obj, indents) {
  indents = indents || 1

  function indent() {
    return Array(indents).join('  ');
  }

  if ('string' == typeof obj) {
    var str = escape(obj);
    // if (urlRegex().test(obj)) {
    //   str = '<a href="' + str + '">' + str + '</a>';
    // }
    return str
  }

  if ('number' == typeof obj) {
    return obj
  }

  if ('boolean' == typeof obj) {
    return obj
  }

  if (null === obj) {
    return 'null'
  }

  var buf = '';

  if (Array.isArray(obj)) {
    ++indents;

    buf += '<ul>\n' + obj.map(function(val){
      return indent() + "<li" + toAttrs(val) + ">" +_toHtml(val, indents) + "</li>"
    }).join('\n');

    --indents;
    buf += '\n' + indent() + '</ul>';
    return buf;
  }

  var keys = Object.keys(obj);
  var len = keys.length;
  if (len) buf += '\n';

  ++indents;
  buf += keys.map(function(key){
    var val = obj[key];
    return indent() + span(key, _toHtml(val, indents)); 
  }).join('\n');
  --indents;

  if (len) buf += '\n' + indent();
  return buf;
}

export function toHtml(obj, indents) {
  let buf = "<html><head></head><body>\n"
  buf += _toHtml(obj, indents)
  buf += "</body></html>"
  return buf 
}