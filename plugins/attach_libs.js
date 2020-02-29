import _ from 'lodash'

export default {
  install: function (Vue) {
    Object.defineProperty(Vue.prototype, '_', {value: _})
    window._ = _
  }
}
