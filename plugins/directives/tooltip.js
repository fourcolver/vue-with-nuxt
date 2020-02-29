import Vue from 'vue'
import VTooltip from 'v-tooltip'
export default () => {
  const options = {
    defaultClass: 'quwi-tooltip',
    autoHide: false
  }
  Vue.use(VTooltip, options)
}
