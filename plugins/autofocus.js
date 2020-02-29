import Vue from 'vue'

export default () => {
  Vue.mixin({
    mounted () {
      const el = this.$el.querySelector && this.$el.querySelector('[autofocus=autofocus]')
      el && el.focus()
    }
  })
}
