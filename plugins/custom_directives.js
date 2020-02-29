import Vue from 'vue'
import VueImg from '~/libs/v-img'
import Vuebar from '~/libs/vuebar'

Vue.directive('click-outside', {
  bind: (el, binding, vNode) => {
    if (process.server) return
    const handler = (e) => {
      let condition = !el.contains(e.target) && el !== e.target
      if (binding.modifiers.tooltip) {
        const elementContainsClass = !e.target.classList.contains('tooltip-inner') && !e.target.classList.contains('tooltip-arrow')
        const parent = e.target.parentNode
        const parentContainsClass = parent && parent.classList && !parent.classList.contains('tooltip-inner') && !parent.classList.contains('tooltip-arrow')
        condition = !el.contains(e.target) && el !== e.target && elementContainsClass && parentContainsClass
      }
      if (condition) {
        binding.value(e)
      }
    }
    el.__vueClickOutside__ = handler
    document.addEventListener('click', handler)
  },
  unbind: (el) => {
    if (process.server) return
    document.removeEventListener('click', el.__vueClickOutside__)
    el.__vueClickOutside__ = null
  }
})

Vue.directive('key-escape', {
  bind: (el, binding, vNode) => {
    if (process.server) return
    const handler = (e) => {
      if (e.keyCode === 27) {
        binding.value(e)
      }
    }
    el.__vueClickEscape__ = handler
    document.addEventListener('keyup', handler)
  },
  unbind: (el) => {
    if (process.server) return
    document.removeEventListener('keyup', el.__vueClickEscape__)
    el.__vueClickEscape__ = null
  }
})
Vue.directive('event-class', {
  bind: (el, binding) => {
    if (process.server) return
    let params = binding.value
    if (typeof params !== 'object') {
      params = {event: params, 'class': params}
    }
    el.__vueEventClass__ = {event: params.event}
    el.__vueEventClass__.handler = el.addEventListener(params.event, () => {
      el.classList.add(params.class)
      if (el.__vueEventClass__.timeout) {
        window.clearTimeout(el.__vueEventClass__.timeout)
      }
      el.__vueEventClass__.timeout = window.setTimeout(() => {
        el.classList.remove(params.class)
      }, params.duration || 250)
    })
  },
  unbind: (el) => {
    if (process.server || !el.__vueEventClass__) return
    document.removeEventListener(el.__vueEventClass__.event, el.__vueEventClass__.handler)
    el.__vueEventClass__ = {}
  }
})
Vue.use(VueImg)
Vue.use(Vuebar)
