<template>
  <div class="c-chat-position" @click="position = (position == 'left' ? 'right' : 'left')">
    <i :class=" 'bu-angle-double-' + (position == 'left' ? 'right' : 'left') "></i>
  </div>
</template>

<script>
  export default {
    name: 'chat-position',
    data () {
      return {}
    },
    methods: {},
    computed: {
      position: {
        get () {
          return this.$store.state.userSettings.chat_win_position
        },
        set (val) {
          this.$store.dispatch('updateUserSettingsCookie', {chat_win_position: val})
        }
      }
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';
  @import '~assets/css/mixins.less';

  .c-chat-position {
    i {
      font-size: 1.2em;
    }
  }
</style>
