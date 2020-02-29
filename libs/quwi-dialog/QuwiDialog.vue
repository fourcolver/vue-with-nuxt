<template>
  <component @close="currentComponent = null" v-if="currentComponent" :is="currentComponent" v-bind="props"></component>
</template>

<script>
  import ConfirmDialog from './ConfirmDialog.vue'
  import ChatVideoModal from '~/components/chat/ChatVideoModal.vue'
  import VideoModal from '~/components/VideoModal.vue'
  import ImageModal from '~/components/ImageModal.vue'
  import TextModal from '~/components/TextModal.vue'

  export default {
    components: {
      ConfirmDialog,
      ChatVideoModal,
      VideoModal,
      ImageModal,
      TextModal
    },
    name: 'quwi-dialog',
    data () {
      return {
        currentComponent: null,
        props: {}
      }
    },
    methods: {
      confirm (props) {
        this.activate('confirm-dialog', props)
      },
      activate (component, props) {
        this.props = props
        this.currentComponent = component
      }
    },
    computed: {}
  }
</script>

<style lang="less" type="text/less">

</style>