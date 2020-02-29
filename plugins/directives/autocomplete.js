import Vue from 'vue'
import jsonp from 'jsonp'
import { debounce } from 'lodash'

const formatResult = data => {
  if (!data.length || !data[1].length) {
    return []
  }
  let ret = []
  data[1].forEach(el => ret.push(el[0]))
  return ret
}

Vue.directive('autocomplete', {
  bind: (el, binding, vNode) => {
    const params = binding.value || {}
    const MIN_LENGTH = 3
    const handler = debounce(e => {
      const q = el.value.trim()
      if (q.length >= MIN_LENGTH) {
        jsonp(`https://suggestqueries.google.com/complete/search?q=${q}&client=youtube`, null, (err, data) => {
          if (err) {
            console.error(err.message)
          } else {
            const result = formatResult(data)
            params.onResult(result)
            el.suggestions = result
          }
        })
      } else {
        params.onResult([])
        el.suggestions = []
      }
    }, 300)
    el.__vueAutocompleteInput__ = handler
    el.addEventListener('input', handler)
    el.__vueAutoCompleteClick__ = e => {
      const q = el.value.trim()
      if (q.length >= MIN_LENGTH) {
        if (el.suggestions && el.suggestions.length) {
          params.onResult(el.suggestions)
        } else {
          handler(e)
        }
      }
    }
    el.addEventListener('click', el.__vueAutoCompleteClick__)
  },
  unbind: (el) => {
    el.removeEventListener('input', el.__vueAutocompleteInput__)
    el.removeEventListener('click', el.__vueAutoCompleteClick__)
    el.__vueAutocomplete__ = null
    el.suggestions = []
  }
})
