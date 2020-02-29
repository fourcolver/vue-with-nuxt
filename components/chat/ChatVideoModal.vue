<template>
  <video-modal :url="file.info.file.url" :mime="file.mime_type" :onClose="onClose" @close="$emit('close')"
               :waitLoad="true">
    <div class="b-bottom" slot="bottom">
      <div class="b-left">
        <div class="b-info">
          <div class="e-file">{{ file.base_name }}</div>
          <div class="e-name">{{ getAuthorName(message) }} {{ formatDate(message.dta_create) }}</div>
        </div>
      </div>
      <div class="b-right"></div>
    </div>
  </video-modal>
</template>

<script>
  import VideoModal from '../VideoModal.vue'
  import moment from 'moment'

  export default {
    components: {VideoModal},
    name: 'chat-video-modal',
    data () {
      return {}
    },
    props: ['message', 'onClose'],
    methods: {
      getAuthorName (message) {
        const user = this.$store.state.companyUsers.find(el => +el.id === +message.id_user)
        if (user) {
          return user.name
        }
      },
      formatDate (date) {
        return moment(date).format('DD MMM HH:mm')
      }
    },
    computed: {
      file () {
        return this.message.file
      }
    }
  }
</script>

<style lang="less" type="text/less">

</style>
