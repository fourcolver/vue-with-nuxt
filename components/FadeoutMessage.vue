<template>
  <transition name="fade-default">
    <span v-if="message" v-html="message"></span>
  </transition>
</template>

<script>
  export default {
    name: 'fadeout-message',
    data () {
      return {
        timeoutHandler: null
      }
    },
    watch: {
      message () {
        this.clear()
      }
    },
    methods: {
      clear () {
        if (this.message) {
          clearTimeout(this.timeoutHandler)
          this.timeoutHandler = setTimeout(() => this.$emit('hide'), this.delay || 3000)
        }
      }
    },
    props: [
      'message',
      'delay'
    ],
    mounted () {
      this.clear()
    }
  }
</script>
