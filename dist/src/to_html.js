"use strict";
function escape(html) {
    return String(html)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
function span(key, str) {
    return '<span class="' + key + '">' + str + '</span>';
}
function toHtml(obj, indents) {
    indents = indents || 1;
    function indent() {
        return Array(indents).join('  ');
    }
    if ('string' == typeof obj) {
        var str = escape(obj);
        return str;
    }
    if ('number' == typeof obj) {
        return obj;
    }
    if ('boolean' == typeof obj) {
        return obj;
    }
    if (null === obj) {
        return 'null';
    }
    var buf;
    if (Array.isArray(obj)) {
        ++indents;
        buf = '<ul>\n' + obj.map(function (val) {
            return indent() + "<li>" + toHtml(val, indents) + "</li>";
        }).join('\n');
        --indents;
        buf += '\n' + indent() + '</ul>';
        return buf;
    }
    buf = '';
    var keys = Object.keys(obj);
    var len = keys.length;
    if (len)
        buf += '\n';
    ++indents;
    buf += keys.map(function (key) {
        var val = obj[key];
        return indent() + span(key, toHtml(val, indents));
    }).join('\n');
    --indents;
    if (len)
        buf += '\n' + indent();
    return buf;
}
exports.toHtml = toHtml;
//# sourceMappingURL=to_html.js.map