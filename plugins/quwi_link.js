import Vue from 'vue'

const register = ({ store }) => {
  const quwiLink = {
    name: 'quwi-link',
    functional: true,
    render (h, { data, children }) {
      if (data.attrs && data.attrs.to) {
        data.attrs.to = store.getters['company/createUrl'](data.attrs.to)
      }
      return h('router-link', data, children)
    }
  }
  Vue.component(quwiLink.name, quwiLink)
}

export default (ctx) => {
  register(ctx)
}
