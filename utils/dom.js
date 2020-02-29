export const findParent = (node, selector) => {
  let parent = node.parentNode
  const match = (el, selector) => {
    return el.matches ? el.matches(selector) : (el.msMatchesSelector ? el.msMatchesSelector(selector) : null)
  }
  while (parent) {
    if (match(parent, selector)) {
      return parent
    } else {
      parent = parent.parentNode
    }
  }
}

export const trimHTML = (html, options = {}) => {
  if (process.server) {
    return html
  }
  let div = document.createElement('div')
  div.innerHTML = html
  const isEmptyNode = node => {
    return node.nodeType === Node.ELEMENT_NODE &&
      node.innerText.trim() === '' &&
      (options.allowAttributes || !node.attributes.length) &&
      (!node.children.length || (node.children.length === 1 && node.children[0].tagName.toLowerCase() === 'br'))
  }
  while (div.childNodes.length > 0 && isEmptyNode(div.childNodes[0])) {
    div.removeChild(div.childNodes[0])
  }
  while (div.childNodes.length > 0 && isEmptyNode(div.childNodes[div.childNodes.length - 1])) {
    div.removeChild(div.childNodes[div.childNodes.length - 1])
  }
  return div.innerHTML
}

export const setCaretPosition = (el, caretPos) => {
  if (el.createTextRange) {
    let range = el.createTextRange()
    range.collapse(true)
    // range.move('character', caretPos)
    range.moveEnd('character', caretPos)
    range.moveStart('character', caretPos)
    range.select()
  } else {
    if (el.selectionStart) {
      el.focus()
      el.setSelectionRange(caretPos, caretPos)
    } else {
      el.focus()
    }
  }
}

export const getInputSelection = (el) => {
  let start = 0
  let end = 0
  if (el.createTextRange) {
    let range = document.selection.createRange()
    if (range && range.parentElement() === el) {
      let len = el.value.length
      let normalizedValue = el.value.replace(/\r\n/g, '\n')

      // Create a working TextRange that lives only in the input
      let textInputRange = el.createTextRange()
      textInputRange.moveToBookmark(range.getBookmark())

      // Check if the start and end of the selection are at the very end
      // of the input, since moveStart/moveEnd doesn't return what we want
      // in those cases
      let endRange = el.createTextRange()
      endRange.collapse(false)

      if (textInputRange.compareEndPoints('StartToEnd', endRange) > -1) {
        start = end = len
      } else {
        start = -textInputRange.moveStart('character', -len)
        start += normalizedValue.slice(0, start).split('\n').length - 1

        if (textInputRange.compareEndPoints('EndToEnd', endRange) > -1) {
          end = len
        } else {
          end = -textInputRange.moveEnd('character', -len)
          end += normalizedValue.slice(0, end).split('\n').length - 1
        }
      }
    }
  } else {
    start = el.selectionStart
    end = el.selectionEnd
  }
  return {
    start: start,
    end: end
  }
}

export const htmlToText = (node) => {
  const getNodeStyle = (n, p) => {
    if (!n || !n.nodeType || (n.nodeType && (n.nodeType !== Node.ELEMENT_NODE))) {
      return ''
    }
    return n.currentStyle
      ? n.currentStyle[p]
      : document.defaultView.getComputedStyle(n, null).getPropertyValue(p)
  }
  const isNodeBlock = (node) => {
    if (node.nodeType === document.TEXT_NODE) {
      return false
    }
    let d = getNodeStyle(node, 'display')
    return (
      d.match(/^block/) || d.match(/list/) || d.match(/row/) ||
      node.tagName === 'BR' || node.tagName === 'HR' ||
      node.tagName === 'DIV' // div,p,... add as needed to support non-DOM nodes
    )
  }

  let result = ''
  if (node.nodeType === document.TEXT_NODE) {
    result = node.nodeValue.replace(/\s+/g, ' ')
  } else {
    for (let i = 0, j = node.childNodes.length; i < j; i++) {
      result += htmlToText(node.childNodes[i], true)
      if (i < j - 1) {
        if (isNodeBlock(node.childNodes[i])) {
          result += '\n'
        } else if (isNodeBlock(node.childNodes[i + 1]) &&
          node.childNodes[i + 1].tagName !== 'BR' &&
          node.childNodes[i + 1].tagName !== 'HR') {
          result += '\n'
        }
      }
    }
  }
  return result
}

export const addPrefetchLink = (href, as = 'image') => {
  let link = document.createElement('link')
  link.rel = 'preload'
  link.href = href
  link.as = as
  let head = document.querySelector('head')
  head.appendChild(link)
}

export const insertAtCursor = (myField, myValue) => {
  // IE support
  if (document.selection) {
    myField.focus()
    let sel = document.selection.createRange()
    sel.text = myValue
  } else if (myField.selectionStart || myField.selectionStart === 0) {
    let startPos = myField.selectionStart
    let endPos = myField.selectionEnd
    myField.value = (myField.value.substring(0, startPos) +
      myValue + myField.value.substring(endPos, myField.value.length)).split('').join('')
  } else {
    myField.value += myValue
  }
}

export const getTextFromHTML = html => {
  if (process.server) {
    return html
  }
  let div = document.createElement('div')
  div.innerHTML = html
  return htmlToText(div)
}

export const scrollTo = (el, offset = 0) => {
  window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY + offset)
}

export const videosAutoPlay = videos => {
  videos.forEach(video => {
    if (!video.getAttribute('data-clicked')) {
      let rect = video.getBoundingClientRect()
      if (rect.bottom >= 0 && rect.top < window.scrollY + window.innerHeight) {
        video.loop = true
        video.muted = true
        video.play()
      } else {
        video.pause()
      }
    }
  })
}
