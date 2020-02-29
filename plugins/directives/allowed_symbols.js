import Vue from 'vue'

Vue.directive('allowed', {
  bind: (el, binding, vNode) => {
    if (process.server) return
    let params = binding.value
    if (typeof params === 'string') {
      params = {value: params}
    }
    let basicTest
    if (typeof params.value === 'string') {
      basicTest = str => new RegExp(params.value).test(str)
    } else if (params.value instanceof RegExp) {
      basicTest = str => params.value.test(str)
    } else if (Array.isArray(params.value)) {
      basicTest = str => params.value.indexOf(str) !== -1
    }
    if (!basicTest) {
      return
    }
    let test = str => params.reverse ? !basicTest(str) : basicTest(str)
    const keypressHandler = e => {
      if (e.key !== 'Enter' && !test(e.key)) {
        e.preventDefault()
      }
    }
    const pasteHandler = e => {
      e.preventDefault()
      let text = (e.originalEvent || e).clipboardData.getData('text/plain')
      if (text) {
        let newText = ''
        for (let i = 0; i < text.length - 1; i++) {
          if (test(text[i])) {
            newText += text[i]
          }
        }
        if (newText) {
          document.execCommand('insertHTML', false, newText)
        }
      }
    }
    el.__vueAllowedKeypress__ = keypressHandler
    el.__vueAllowedPaste__ = pasteHandler
    el.addEventListener('keypress', keypressHandler)
    el.addEventListener('paste', pasteHandler)
  },
  unbind: (el) => {
    if (process.server) return
    el.addEventListener('keypress', el.__vueAllowedKeypress__)
    el.addEventListener('paste', el.__vueAllowedPaste__)
    el.__vueAllowedKeypress__ = null
    el.__vueAllowedPaste__ = null
  }
})
