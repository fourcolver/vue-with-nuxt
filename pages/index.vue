<template>
    <component :is="component" :info="$store.state.company.info"></component>
</template>

<script>
  export default {
    head () {
      if (process.env.NODE_ENV === 'production' && !this.$store.state.company.uid) {
        return {
          script: [
            { src: '//script.crazyegg.com/pages/scripts/0086/2325.js', async: 'true' }
          ]
        }
      } else {
        return {}
      }
    },
    data () {
      return {
        component: null
      }
    },
    middleware: ['guest'],
    layout: ({store}) => {
      return store.state.company.uid ? 'guest' : 'empty'
    },
    created () {
      const name = this.$store.state.company.uid ? 'Company' : 'Global'
      this.component = () => import(`~/components/index/${name}.vue`)
    }
  }
</script>
