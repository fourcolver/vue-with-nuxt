const debug = false

export const updateCursorOnKeyup = (e) => {
  let node
  let prevNode
  let nextNode
  log('updateCursorOnKeyup', null, true)
  switch (e.keyCode) {
    case 38: // up
      node = getCursor(true)
      if (!node || isEditableNode(node)) {
        return
      }
      prevNode = getClosestSibling(node, true)
      while (prevNode && !isEditableNode(prevNode)) {
        prevNode = getClosestSibling(prevNode, true)
      }
      if (prevNode) {
        setCursor(prevNode, false)
        log('cursor is set')
      } else {
        insertExtremeLine(true)
        log('extreme line inserted')
      }
      e.preventDefault()
      break
    case 40: // down
      node = getCursor(false)
      if (!node || isEditableNode(node)) {
        return
      }
      nextNode = getClosestSibling(node, false)
      while (nextNode && !isEditableNode(nextNode)) {
        nextNode = getClosestSibling(nextNode, false)
      }
      if (nextNode) {
        setCursor(nextNode, true)
        log('cursor is set')
      } else {
        insertExtremeLine(false)
        log('extreme line inserted')
      }
      e.preventDefault()
      break
  }
}

export const updateCursorOnKeydown = (e) => {
  let selection = document.getSelection()
  let range = selection ? selection.getRangeAt(0) : false
  if (!range) {
    return
  }
  let node
  let prevNode
  let nextNode
  log('updateCursorOnKeydown', null, true)
  switch (e.keyCode) {
    case 8: // backspace
      node = getCursor(true)
      if (!node || (node.nodeType === Node.TEXT_NODE && range.startOffset > 0)) {
        return
      }
      prevNode = isEditableNode(node) ? getClosestSibling(node, true) : node
      if (prevNode && !isEditableNode(prevNode)) {
        let container = getTopNotEditableContainer(prevNode)
        if (container) {
          container.remove()
          log('node removed')
          scrollToView()
          e.preventDefault()
        }
      }
      break

    case 37: // left
      node = getCursor(true)
      if (!node || (node.nodeType === Node.TEXT_NODE && range.startOffset > 0)) {
        return
      }
      prevNode = getClosestSibling(node, true)
      if (!prevNode || isEditableNode(prevNode)) {
        return
      }
      while (prevNode && !isEditableNode(prevNode)) {
        prevNode = getClosestSibling(prevNode, true)
      }
      if (prevNode) {
        setCursor(prevNode, false)
        log('cursor is set')
      } else {
        insertExtremeLine(true)
        log('extreme line inserted')
      }
      e.preventDefault()
      break

    case 46: // delete
      node = getCursor(false)
      if (!node || (node.nodeType === Node.TEXT_NODE && range.endOffset < node.length)) {
        return
      }
      nextNode = isEditableNode(node) ? getClosestSibling(node, false) : node
      // nextNode = getClosestSibling(node, false)
      if (nextNode && !isEditableNode(nextNode)) { // || nextNode.nodeName.toLowerCase() === 'br'
        let container = getTopNotEditableContainer(nextNode)
        if (container) {
          container.remove()
          log('node removed')
          e.preventDefault()
        }
      }
      break

    case 39: // right
      node = getCursor(false)
      if (!node || (node.nodeType === Node.TEXT_NODE && range.endOffset < node.length)) {
        return
      }
      nextNode = getClosestSibling(node, false)
      if (!nextNode || isEditableNode(nextNode)) {
        return
      }
      while (nextNode && !isEditableNode(nextNode)) {
        nextNode = getClosestSibling(nextNode, false)
      }
      if (nextNode) {
        setCursor(nextNode, true)
        log('cursor is set')
      } else {
        insertExtremeLine(false)
        log('extreme line inserted')
      }
      e.preventDefault()
      break
  }
}

const getClosestChild = (node, isPrev) => {
  log('getClosestChild', node, true)
  // ignore br on the end of div container
  if (node.nodeName &&
    node.nodeName.toLowerCase() === 'br' &&
    node.parentNode &&
    node.parentNode.hasChildNodes() &&
    node.parentNode.childNodes.length > 1 &&
    node.parentNode.lastChild.isSameNode(node)) {
    log('ignore br on the end')
    return false
  } else if (node.nodeType === Node.TEXT_NODE) {
    log('sibling is text. return')
    return node
  } else if (node.nodeType === Node.ELEMENT_NODE && node.contentEditable === 'false') {
    log('sibling is not editable. return')
    return node
  } else if (node.nodeType === Node.ELEMENT_NODE && !node.hasChildNodes()) {
    log('sibling is element without children. return')
    return node
  } else if (node.nodeType === Node.ELEMENT_NODE && node.hasChildNodes()) {
    log('sibling is element with children')
    let children = node.childNodes
    if (isPrev) {
      for (let i = children.length - 1; i >= 0; --i) {
        let child = getClosestChild(children[i], isPrev)
        if (child) {
          return child
        }
      }
    } else {
      for (let i = 0; i < children.length; ++i) {
        let child = getClosestChild(children[i], isPrev)
        if (child) {
          return child
        }
      }
    }
    log('nothing found in children')
    return node
  }
  return false
}

const getClosestSibling = (node, isPrev) => {
  let sibling = isPrev ? node.previousSibling : node.nextSibling
  log('getClosestSibling', sibling, true)
  if (sibling) {
    // search in siblings
    let child = getClosestChild(sibling, isPrev)
    if (child) {
      log('found child', child)
      return child
    }
    log('nothing found, search in next sibling')
    return getClosestSibling(sibling, isPrev)
  } else {
    // search in parents
    let parent = node.parentNode
    let container = getContainer()
    if (parent && !parent.isSameNode(container)) {
      log('nothing found, search in parent')
      return getClosestSibling(parent, isPrev)
    }
    log('nothing found')
    return false
  }
}

const isEditableNode = (node) => {
  let element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement
  let container = getContainer()
  // check parents
  log('isEditableNode', node, true)
  while (!element.isSameNode(container)) {
    if (element.contentEditable === 'false') {
      log('node not editable 1')
      return false
    }
    element = element.parentElement
  }
  // check children, if element is editable, but ALL children are nonEditable
  if (node.nodeType === Node.ELEMENT_NODE && node.hasChildNodes() && node.childNodes.length > 0) {
    log('node has childNodes')
    let children = node.childNodes
    for (let i = 0; i < children.length; ++i) {
      if (!children[i].contentEditable || children[i].contentEditable !== 'false') {
        log('node editable 2')
        return true
      }
    }
    log('node not editable 3')
    return false
  }
  log('node editable 4')
  return true
}

const getTopNotEditableContainer = (node) => {
  let container = getContainer()
  while (!node.isSameNode(container) && (!node.contentEditable || node.contentEditable !== 'false')) {
    node = node.parentElement
  }
  return node
}

export const setCursor = (node, toStart) => {
  log('setCursor', node, true)
  let range = document.createRange()
  if (node.nodeName.toLowerCase() === 'br') {
    range.selectNode(node)
    range.collapse(true)
  } else if (node.nodeType === Node.TEXT_NODE) {
    range.setStart(node, toStart ? 0 : node.length)
    range.setEnd(node, toStart ? 0 : node.length)
  } else {
    range.collapse(toStart)
    range.collapse(true)
  }
  window.getSelection().removeAllRanges()
  window.getSelection().addRange(range)
  scrollToView()
}

const getCursor = (isPrev) => {
  let selection = document.getSelection()
  let range = selection ? selection.getRangeAt(0) : false
  let node = range && range.collapsed ? range.commonAncestorContainer : false
  log('getCursor', null, true)
  log('isPrev: ' + isPrev)
  log('range.startOffset: ' + range.startOffset)
  log('range.collapsed: ' + range.collapsed)
  log('range.commonAncestorContainer:', range.commonAncestorContainer)
  // if offset is set
  if (node && node.nodeType === Node.ELEMENT_NODE && range.startOffset > 0) {
    if (!node.hasChildNodes()) {
      log('nothing found. return false')
      return false
    }
    log('node.childNodes')
    log('childElementCount: ' + node.childElementCount, node.childNodes[range.startOffset - 1])
    node = node.childNodes[range.startOffset - 1] ? node.childNodes[range.startOffset - 1] : false
  }
  // if there is child text nodes
  let child = getClosestChild(node, isPrev)
  if (child) {
    node = child
  }
  if (node && node.isSameNode(getContainer())) {
    log('nothing found. return false')
    return false
  }
  log('found node', node)
  return node
}

const getContainer = () => {
  let selection = document.getSelection()
  let range = selection ? selection.getRangeAt(0) : false
  let node = range ? range.commonAncestorContainer : false
  while (node && (!node.classList || !node.classList.contains('js-editable-area'))) {
    node = node.parentNode
  }
  return node
}

const scrollToView = () => {
  let node = getCursor(false)
  if (node && node.nodeType !== Node.ELEMENT_NODE) {
    node = node.parentElement
  }
  let rect = node ? node.getBoundingClientRect() : false
  if (!rect) {
    return
  }
  if (rect.bottom && rect.bottom > window.innerHeight) {
    let scroll = rect.bottom + window.scrollY - window.innerHeight + 100
    window.scrollTo(0, scroll)
  } else if (rect.top && rect.top < 60) {
    let scroll = rect.top + window.scrollY - 60
    window.scrollTo(0, scroll)
  }
}

const log = (msg, node, isStart) => {
  if (!debug) return
  const prefix = isStart ? ' ------ ' : ' - '
  if (msg) {
    console.log(prefix + msg, node)
  } else if (node) {
    console.log(node)
  }
}

const insertExtremeLine = (isPrev) => {
  let container = getContainer()
  let p = document.createElement('div')
  p.innerHTML = '<br>'
  if (isPrev) {
    container.insertBefore(p, container.firstElementChild)
  } else {
    container.insertBefore(p, container.lastElementChild.nextElementSibling)
  }
  let range = document.createRange()
  range.setStart(p, 0)
  range.setEnd(p, 0)
  window.getSelection().removeAllRanges()
  window.getSelection().addRange(range)
}
