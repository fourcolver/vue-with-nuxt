export const trimHTML = html => {
  if (process.server) {
    return html
  }
  let div = document.createElement('div')
  div.innerHTML = html
  const isEmptyNode = node => {
    return node.nodeType === Node.ELEMENT_NODE &&
      node.textContent.trim() === '' &&
      !node.attributes.length &&
      ((!node.children.length) || (node.children.length === 1 && node.childNodes[0].nodeName === 'BR'))
  }
  const toRemove = []
  for (let k = 0; k < div.childNodes.length; k++) {
    if (isEmptyNode(div.childNodes[k])) {
      toRemove.push(div.childNodes[k])
    } else {
      break
    }
  }

  for (let k = div.childNodes.length - 1; k >= 0; k--) {
    if (isEmptyNode(div.childNodes[k])) {
      toRemove.push(div.childNodes[k])
    } else {
      break
    }
  }

  toRemove.forEach((ch) => div.contains(ch) ? div.removeChild(ch) : null)

  return div.innerHTML
}

export const editorHydrate = (node, editor) => {
  const editorSettings = editor.getSettings()
  const documentImagesWrappers = node.querySelectorAll('.bu-image-wrapper')
  const documentFileWrappers = node.querySelectorAll('.bu-file-wrapper')
  const documentVideoWrappers = node.querySelectorAll('.bu-video-wrapper')

  documentImagesWrappers.forEach((wrapper) => {
    const img = wrapper.querySelector('img')
    wrapper.className = ''

    const spanWrapper = document.createElement('span')
    const imgWidth = Number.parseInt(img.getAttribute('width'), 10)
    const imgHeight = Number.parseInt(img.getAttribute('height'), 10)
    const minCommentWidth = 200

    let commentWidth = imgWidth - 1

    if (imgWidth < minCommentWidth) {
      commentWidth = minCommentWidth
    }

    spanWrapper.setAttribute('data-id', img.getAttribute('data-id'))
    if (navigator.userAgent.toLowerCase().indexOf('firefox') > -1) {
      spanWrapper.style.display = 'block'
    } else {
      spanWrapper.style.display = 'unset'
    }

    spanWrapper.style.position = 'relative'
    spanWrapper.setAttribute('contenteditable', false)
    // data-original="${img.getAttribute('data-original')}"
    const imgComment = wrapper.querySelector('.bu-image-comment')
    spanWrapper.innerHTML = `
                  <div class="${imgComment ? editorSettings.classNames.imgWrapper + ' ' + editorSettings.classNames.imgWrapper + '--comment' : editorSettings.classNames.imgWrapper}" style="position: relative;max-width: ${imgWidth}px !important;" contenteditable="false">
                    <img src="${img.getAttribute('src')}" class="${editorSettings.classNames.img}" data-id="${img.getAttribute('data-id')}" width="${imgWidth}" height="${imgHeight}">
                  </div>
                  <div class="${editorSettings.classNames.imgCommentWrapper}" contenteditable="true" style="display: none; max-width: ${commentWidth}px !important; word-break: break-word;"></div>`

    if (imgComment) {
      const comment = imgComment.textContent
      spanWrapper.querySelector(`.${editorSettings.classNames.imgCommentWrapper}`).textContent = comment
      spanWrapper.querySelector(`.${editorSettings.classNames.imgCommentWrapper}`).style.display = 'block'
      imgComment.remove()
    }
    img.parentNode.replaceChild(spanWrapper, img)
  })

  documentFileWrappers.forEach((wrapper) => {
    const fileLink = wrapper.querySelector('.bu-file')
    const dataId = fileLink.getAttribute('data-id')
    wrapper.className = ''

    const divWrapper = document.createElement('div')
    divWrapper.setAttribute('id', dataId)
    divWrapper.setAttribute('contenteditable', false)
    divWrapper.setAttribute('class', `${editorSettings.classNames.fileDiv} ${editorSettings.classNames.noSelect}`)
    divWrapper.setAttribute('data-name', fileLink.textContent)
    divWrapper.setAttribute('data-id', dataId)
    divWrapper.style.width = '95%'
    divWrapper.innerHTML = `<a class="${editorSettings.classNames.fileLink}" href="${fileLink.getAttribute('href')}" data-id=${dataId} target="_blank">
                <span class="${editorSettings.classNames.fileSpan} ${editorSettings.classNames.noSelect}">${fileLink.textContent}</span>
            </a>
            <div class="${editorSettings.classNames.fileRemove} p-delete" contenteditable = "false">×</div>`

    fileLink.parentNode.replaceChild(divWrapper, fileLink)
  })

  documentVideoWrappers.forEach((wrapper) => {
    const divWrapper = document.createElement('div')
    const video = wrapper.querySelector('video')
    const source = wrapper.querySelector('source')
    wrapper.className = ''
    divWrapper.setAttribute('contenteditable', false)
    divWrapper.setAttribute('class', `${editorSettings.classNames.video}`)
    divWrapper.setAttribute('style', '-moz-user-select: none;')

    const maxWidth = editor.getEditorWidth()
    const ratio = 16 / 9
    const w = maxWidth
    const h = w / ratio

    divWrapper.setAttribute('data-id', video.getAttribute('data-id'))
    divWrapper.innerHTML =
    `<video width="${w}" height="${h}" data-src=${source.getAttribute('src')} autoplay loop muted volume="0">
          <source src=${source.getAttribute('src')} type="video/webm">
      </video>
      <div class="${editorSettings.classNames.fileRemove} p-delete ${editorSettings.classNames.noSelect}">×</div>`

    video.parentNode.replaceChild(divWrapper, video)
  })

  const lastChild = node.lastChild
  if (lastChild && lastChild.innerHTML !== '<br>') {
    const brDiv = document.createElement('div')
    const br = document.createElement('br')
    brDiv.append(br)
    node.append(brDiv)
  }

  return node.innerHTML
}

export const editorTransformHTML = (editorSettings, html) => {
  if (!html || !html.length) {
    return ''
  }

  html = html.replace(/<div><\/div>/g, '')

  const node = document.createElement('div')
  node.innerHTML = html

  const unwrap = (wrapper) => {
    const docFrag = document.createDocumentFragment()
    while (wrapper.firstChild) {
      const child = wrapper.removeChild(wrapper.firstChild)
      docFrag.appendChild(child)
    }

    wrapper.parentNode.replaceChild(docFrag, wrapper)
  }

  const onlyDivs = (childs) => {
    let ret = true
    childs.forEach((ch) => {
      if (ch.nodeName !== 'DIV' && ch.nodeType !== Node.COMMENT_NODE) {
        ret = false
      }
    })
    return ret
  }

  const needWrap = (child, root) => {
    if (child.parentNode === root) {
      return true
    }

    return false
  }

  const wrapWithDiv = (node) => {
    const div = document.createElement('div')
    div.appendChild(node.cloneNode(true))
    return div
  }

  let allChilds = [...node.childNodes]

  /* Wrap all unwrapped fileloaders */
  allChilds.forEach((div) => {
    if (div.classList && (div.classList.contains(editorSettings.classNames.video) || (div.nodeName === 'SPAN' && div.querySelector(`.${editorSettings.classNames.imgWrapper}`)) || div.classList.contains(editorSettings.classNames.fileDiv))) {
      const wrappedDiv = wrapWithDiv(div)
      div.parentNode.replaceChild(wrappedDiv, div)
    }
  })

  allChilds = [...node.childNodes]

  allChilds.forEach((div) => {
    if (div.tagName === 'DIV' && div.childNodes.length > 1) {
      let acc = document.createElement('div')
      const divStyle = div.getAttribute('style')
      if (divStyle && divStyle.length) {
        acc.setAttribute('style', divStyle)
      }
      let transformed = document.createElement('div')
      for (let i = 0; i < div.childNodes.length; i++) {
        const currentChild = div.childNodes[i]
        if (currentChild.nodeName !== 'BR') {
          if (i + 1 < div.childNodes.length) {
            const nextChild = div.childNodes[i + 1]
            if (nextChild.nodeName === 'BR') {
              acc.append(currentChild.cloneNode(true))
              transformed.append(acc)
              acc = document.createElement('div')
              i++
            } else {
              acc.append(currentChild.cloneNode(true))
            }
          } else {
            acc.append(currentChild.cloneNode(true))
            transformed.append(acc)
          }
        } else {
          const divWrapper = document.createElement('div')
          divWrapper.innerHTML = '<br>'
          transformed.append(divWrapper)
        }
      }

      div.innerHTML = transformed.innerHTML
      unwrap(div)
    }
  })

  allChilds = [...node.childNodes]

  allChilds.forEach((div) => {
    if (div.childNodes.length > 1) {
      const divChilds = [...div.childNodes]
      if (onlyDivs(divChilds)) {
        unwrap(div)
      }
    } else if (div.childNodes.length === 1 && div.childNodes[0].nodeType === Node.TEXT_NODE) {
      // Fix for Windows - insertText command creates div with \n text instead of div with br element
      if (div.childNodes[0].textContent === '\n') {
        div.innerHTML = '<br>'
      }
    } else if (div.childNodes.length === 0) {
      // Fix for Windows - insertText command creates empty div's instead of div with br element
      div.innerHTML = '<br>'
    }
  })

  const imagesWrappers = node.querySelectorAll(`.${editorSettings.classNames.imgWrapper}`)

  for (let k = 0; k < imagesWrappers.length; k++) {
    const imageWrapper = document.createElement('div')
    imageWrapper.className = 'bu-image-wrapper'

    const img = document.createElement('img')
    const editorImage = imagesWrappers[k].querySelector('img')
    img.className = 'bu-image'

    img.setAttribute('data-id', editorImage.getAttribute('data-id'))
    img.setAttribute('src', editorImage.getAttribute('src'))
    // img.setAttribute('data-original', editorImage.getAttribute('data-original'))

    img.setAttribute('width', editorImage.getAttribute('width').replace('px', ''))
    img.setAttribute('height', editorImage.getAttribute('height').replace('px', ''))
    img.setAttribute('alt', `Screenshot-${editorImage.getAttribute('data-id')}`)

    imageWrapper.append(img)

    let imageComment = imagesWrappers[k].nextSibling
    if (imageComment) {
      while (imageComment.nextSibling) {
        imageComment = imageComment.nextSibling
      }
    }

    if (imageComment && imageComment.textContent.trim().length) {
      const commentWrapper = document.createElement('div')
      commentWrapper.className = 'bu-image-comment'
      commentWrapper.textContent = imageComment.textContent
      imageWrapper.append(commentWrapper)
    }

    if (needWrap(imagesWrappers[k].parentNode, node)) {
      const wrapped = wrapWithDiv(imageWrapper)
      imagesWrappers[k].parentNode.replaceWith(wrapped)
    } else {
      imagesWrappers[k].parentNode.parentNode.replaceWith(imageWrapper)
    }
  }

  const filesWrappers = node.querySelectorAll(`.${editorSettings.classNames.fileDiv}`)
  for (let k = 0; k < filesWrappers.length; k++) {
    if (filesWrappers[k].classList.contains(editorSettings.classNames.fileDivWrapperError)) {
      filesWrappers[k].remove()
      continue
    }
    const div = document.createElement('div')
    const dataId = filesWrappers[k].getAttribute('data-id')
    if (!filesWrappers[k].classList.contains(editorSettings.classNames.video)) {
      div.classList.add('bu-file-wrapper')
      const fileLink = filesWrappers[k].querySelector(`.${editorSettings.classNames.fileLink}`)
      const a = document.createElement('a')
      a.classList.add('bu-file')
      a.setAttribute('data-id', dataId)
      a.textContent = filesWrappers[k].getAttribute('data-name')
      a.setAttribute('href', fileLink.getAttribute('href'))

      div.append(a)
    } else {
      div.classList.add('bu-video-wrapper')
      const fVideo = filesWrappers[k].querySelector('video')
      const fSource = filesWrappers[k].querySelector('source')

      const w = fVideo.getAttribute('width').replace('px', '')
      const h = fVideo.getAttribute('height').replace('px', '')

      const type = fSource.getAttribute('type')
      const src = fVideo.getAttribute('data-src')
      const thumb = filesWrappers[k].getAttribute('data-fallback')
      div.innerHTML = `<video class="bu-video" data-id="${dataId}" width="${w}" height="${h}"><source type="${type}" src="${src}" ><a class="bu-video-fallback-link" href="${src}"><img class="bu-video-fallback-img" src="${thumb}" alt="Poster-${dataId}" width="${w}" height="${h}"></a></video>`
    }

    filesWrappers[k].parentNode.replaceWith(div)

    if (needWrap(filesWrappers[k], node)) {
      const wrapped = wrapWithDiv(div)
      filesWrappers[k].parentNode.replaceChild(wrapped, filesWrappers[k])
    } else {
      filesWrappers[k].parentNode.replaceWith(div)
    }
  }

  const videoWrappers = [...node.querySelectorAll(`.${editorSettings.classNames.video}`)]
  videoWrappers.forEach((wrapper) => {
    if (wrapper.classList.contains(editorSettings.classNames.fileDivWrapperError)) {
      wrapper.remove()
      return
    }
    const div = document.createElement('div')
    const dataId = wrapper.getAttribute('data-id')
    div.classList.add('bu-video-wrapper')
    const fVideo = wrapper.querySelector('video')
    const fSource = wrapper.querySelector('source')

    const w = fVideo.getAttribute('width').replace('px', '')
    const h = fVideo.getAttribute('height').replace('px', '')

    const type = fSource.getAttribute('type')
    const src = fVideo.getAttribute('data-src')
    const thumb = wrapper.getAttribute('data-fallback')
    div.innerHTML = `<video class="bu-video" data-id="${dataId}" width="${w}" height="${h}"><source type="${type}" src="${src}" ><a class="bu-video-fallback-link" href="${src}"><img class="bu-video-fallback-img" src="${thumb}" alt="Poster-${dataId}" width="${w}" height="${h}"></a></video>`

    if (needWrap(wrapper, node)) {
      const wrapped = wrapWithDiv(div)
      wrapper.parentNode.replaceChild(wrapped, wrapper)
    } else {
      wrapper.parentNode.replaceWith(div)
    }
  })

  const boldElements = node.querySelectorAll('b')
  boldElements.forEach((item) => {
    const span = document.createElement('span')
    span.setAttribute('style', 'font-weight: bold;')
    span.innerHTML = item.innerHTML
    item.parentNode.replaceChild(span, item)
  })

  const lastChild = node.lastChild
  if (lastChild && lastChild.nodeType !== Node.TEXT_NODE && lastChild.innerHTML === '<br>') {
    lastChild.remove()
  }

  const fontElements = node.querySelectorAll('font')
  fontElements.forEach((item) => {
    if (!item.hasAttribute('style')) {
      unwrap(item)
    }
  })

  let result = trimHTML(node.innerHTML)

  const divIdx = result.indexOf('<div')
  if (divIdx === -1) {
    result = `<div>${result}</div>`
  } else if (divIdx > 0) {
    result = `<div>${result.substring(0, divIdx).split('').join('')}</div>${result.substring(divIdx, result.length).split('').join('')}`
  }

  result = result.replace(/<font/g, '<span')
  result = result.replace(/<\/font/g, '</span')
  result = result.replace(/text-decoration-line/g, 'text-decoration')

  return result
}
