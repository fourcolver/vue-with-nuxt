export default {
  methods: {
    makeBold (e) {
      this.insertToken(e.target, '**')
    },
    makeUnderline (e) {
      this.insertToken(e.target, '__')
    },
    makeItalic (e) {
      this.insertToken(e.target, '~')
    },
    replaceFrom (str, repl, pos, len) {
      return (str.substring(0, pos) + repl + str.substring(pos + len)).split('').join('')
    },
    triggerInput (el) {
      const event = new Event('input', {
        bubbles: true,
        cancelable: true
      })
      el.dispatchEvent(event)
    },
    insertToken (el, token) {
      let val = el.value
      // не допускать вложенность
      // если в новое выделение полностью попадает старое - расширять
      // если попадает только часть - ничего не делать

      // если границы совпадают с границами выделения - убирать его
      if (el.selectionStart === el.selectionEnd) {
        return
      }
      const selectionPosition = el.selectionStart
      const selectionLength = el.selectionEnd - el.selectionStart
      const tlen = token.length
      let sel = val.substring(el.selectionStart, el.selectionEnd).split('').join('')

      if (!sel.trim()) {
        return
      }

      if (sel.substring(0, tlen) === token && sel.substring(sel.length - tlen) === token) {
        el.value = this.replaceFrom(val, sel.substring(tlen, sel.length - tlen), selectionPosition, selectionLength)
        this.triggerInput(el)
        return
      }

      // если первый символ перед выделением и первый после выделения - токены, то убираем выделение
      if (
        val.substring(selectionPosition - tlen, selectionPosition) === token &&
        val.substring(selectionPosition + sel.length, selectionPosition + sel.length + tlen) === token
      ) {
        el.value = this.replaceFrom(val, sel, selectionPosition - tlen, selectionLength + tlen * 2)
        this.triggerInput(el)
        return
      }
      // если внутри выделения четное число токенов (текущих), расширяем его, если нечетное - ничего не делаем
      const currentTokenRegex = new RegExp(RegExp.escape(token), 'g')
      const match = sel.match(currentTokenRegex)
      if (match && match.length % 2 === 0) {
        sel = sel.replace(currentTokenRegex, '')
      } else if (match && match.length % 2 === 1) {
        return
      }
      // если внутри выделения четное число токенов (любых), выделяем как обычно. Если нечетное - ничего не делаем
      // eslint-disable-next-line
      const allTokensRegex = new RegExp('(\*\*|__|~)')
      const matchAllTokens = sel.match(allTokensRegex)
      if (matchAllTokens && matchAllTokens.length % 2 === 1) {
        return
      }
      el.value = this.replaceFrom(val, token + sel + token, selectionPosition, selectionLength)
      this.triggerInput(el)
    }
  }
}
