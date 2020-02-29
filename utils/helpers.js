export const getTokensFromCookie = (req, name = 'jwt') => {
  if (!req.headers.cookie) return
  const jwtCookie = req.headers.cookie.split(';').find(c => c.trim().startsWith(name + '='))
  if (!jwtCookie) return
  let tokens = jwtCookie.split('=')[1]
  try {
    tokens = JSON.parse(decodeURIComponent(tokens))
  } catch (e) {
    tokens = null
  }
  return tokens
}

export const objectToFormData = (obj, form, namespace) => {
  let fd = form || new FormData()
  let formKey
  for (let property in obj) {
    if (obj.hasOwnProperty(property)) {
      if (namespace) {
        formKey = namespace + '[' + property + ']'
      } else {
        formKey = property
      }
      if (typeof obj[property] === 'object' && !(obj[property] instanceof File)) {
        objectToFormData(obj[property], fd, formKey)
      } else {
        fd.append(formKey, obj[property])
      }
    }
  }
  return fd
}

export const formatFileSize = (size) => {
  let i = -1
  if (size < 512) {
    return size + ' B'
  }
  const byteUnits = ['KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  do {
    size = size / 1024
    i++
  } while (size > 1024)
  let res = Math.max(size, 0.1)
  if ((res ^ 0) !== res) {
    res = res.toFixed(1)
  }
  return res + byteUnits[i]
}

export const readFile = (event, as = 'binary') => {
  return new Promise((resolve, reject) => {
    const clipboardData = event.clipboardData || event.originalEvent.clipboardData
    if (!clipboardData || !clipboardData.items.length) {
      return
    }
    const dataKind = clipboardData.items[0].kind
    if (dataKind === 'file') {
      let reader = new FileReader()
      let file = clipboardData.items[0].getAsFile()
      reader.onload = function (evt) {
        const result = evt.target.result
        if (result) {
          resolve(result)
        } else {
          reject(new Error('can not read image'))
        }
      }
      if (as === 'binary') {
        reader.readAsBinaryString(file)
      } else if (as === 'base64') {
        reader.readAsDataURL(file)
      }
    }
  })
}

export const readDataUrl = (event) => {
  return readFile(event, 'base64')
}

export const getErrorFromResponse = (err) => {
  if (err.response && err.response.data && err.response.data.first_errors) {
    return Object.values(err.response.data.first_errors)[0]
  } else if (err.message) {
    return err.message
  } else {
    return 'Some error has occurred. Please try again later'
  }
}

export const previewUploadedImage = (file) => {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onloadend = function () {
        resolve(reader.result)
      }
    } catch (e) {
      reject(e)
    }
  })
}

export const linkify = (text) => {
  if (text) {
    if (text) {
      text = text.replace(
        // eslint-disable-next-line
        /((href|src) ?= ?['"]?)?((https?:\/\/)|(\bwww\.))[a-zA-Z0-9.\-\/\\?#&+=_@!:%;\]\[]+[a-zA-Z0-9\/\\?#&+=_@!:%;\]\[]?/gi,
        function (url) {
          let fullUrl = url
          let trimmed = fullUrl.trim()
          if (trimmed.indexOf('href') === 0 || trimmed.indexOf('src') === 0) {
            return fullUrl
          }
          if (!fullUrl.match('^https?://')) {
            fullUrl = 'http://' + fullUrl
          }
          return '<a href="' + fullUrl + '" target="_blank">' + url + '</a>'
        }
      )
    }
    return text
  }
  return text
}

export const replaceMarkdown = (text) => {
  text = text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/~(.+?)~/g, '<em>$1</em>')
    .replace(/__(__+?)__/g, '<span class="e-underline">$1</span>')
  return text
}

export const escape = (text) => {
  // client side escape through createTextNode
  // http://shebang.brandonmintern.com/foolproof-html-escaping-in-javascript/
  // vue.js - decode (html)
  // server side escape through replace
  // vue/web/server/util.js - escape
  const ESC = {
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    '&': '&amp;',
    "'": '&#39;'
  }
  return text.replace(/[<>"&]/g, function escapeChar (a) {
    return ESC[a] || a
  })
}

export const debounce = (fn, time) => {
  let timeout

  return function () {
    const functionCall = () => fn.apply(this, arguments)

    clearTimeout(timeout)
    timeout = setTimeout(functionCall, time)
  }
}

export const encodeHTML = str => {
  return str.replace(/[\u00A0-\u9999<>&]/gim, function (i) {
    if (i.toLowerCase() === 's') {
      return i
    }
    return '&#' + i.charCodeAt(0) + ';'
  })
}

export const getCompanyUidFromDomain = (req) => {
  let host = null
  if (req) {
    host = req.headers['x-forwarded-host']
    if (!host) {
      host = req.headers.host
    }
  } else if (!process.server) {
    host = window.location.hostname
  }
  host = host && host.replace('.' + process.env.SITE_HOST, '')
  return host === process.env.SITE_HOST ? '' : host
}

export const cutWordWithContext = (text, word, contextLength) => {
  word = word.toLowerCase()
  const wordPos = text.toLowerCase().indexOf(word)
  let startPos = wordPos
  if (startPos === -1) {
    return false
  }
  startPos -= contextLength
  if (startPos <= 0) {
    startPos = 0
  } else {
    if (text[startPos - 1] !== ' ') {
      let shiftedPosition = text.substring(startPos, startPos + contextLength).indexOf(' ')
      if (shiftedPosition !== -1) {
        startPos += shiftedPosition + 1
      }
    }
  }
  let endPos = wordPos + word.length + contextLength
  if (endPos >= text.length) {
    endPos = text.length
  } else {
    if (text[endPos] !== ' ') {
      let shiftedPosition = text.substring(wordPos + word.length, endPos).lastIndexOf(' ')
      if (shiftedPosition !== -1) {
        endPos = wordPos + word.length + shiftedPosition
      }
    }
  }
  return text.substring(startPos, endPos)
}

export const escapeRegExp = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function clearString (string) {
  return string.split('').join('')
}

export const capitalize = str => {
  if (!str) {
    return str
  }
  return clearString(str.charAt(0).toLocaleUpperCase() + str.slice(1))
}

export const raiseError = (invokeError, e) => {
  if (e.response) {
    invokeError({statusCode: e.response.status, error: getErrorFromResponse(e)})
  } else {
    if (!process.server) {
      console.error(e)
    } else {
      invokeError({message: e.stack})
    }
  }
}
