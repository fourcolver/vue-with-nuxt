<template>
  <span class="e-link" @click.prevent="logout">
    <slot>Logout</slot>
  </span>
</template>

<script>
  import { invalidateOnesignalCache } from '~/utils/push'

  export default {
    name: 'logout-link',
    props: {
      allDevices: {
        default: false
      }
    },
    methods: {
      logout: function ({view}, e) {
        let params = {}
        if (this.allDevices) {
          params.anywhere = true
        }
        view.$nuxt.$store.commit('webuser/SET_LOGOUT_PROCESS', true)
        view.$nuxt.$store.dispatch('webuser/logout', params).then(() => {
          view.$nuxt.$router.replace('/login', () => {
            this.$socket.disconnect()
            this.$store.dispatch('reset')
          })
        })
        invalidateOnesignalCache()
      }
    }
  }
</script>
<style lang="less">
  .e-link {
    cursor: pointer !important;
  }
</style>
