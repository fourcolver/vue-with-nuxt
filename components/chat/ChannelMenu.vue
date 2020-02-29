<template>
  <context-menu v-if="channel" trigger="click" @click.stop.native="" preload="1" class="c-channel-menu"
                direction="left" :autoClose="true" ref="menu">
    <div slot="content">
      <div class="b-settings">
        <i class="bu-gear"></i>
      </div>
    </div>
    <div slot="items">
      <div class="b-row" v-if="!channel.pin_to_top"
           @click="$emit('change', {pin_to_top: 1})">
        {{ $t('chat.pin_channel_to_top') }}
      </div>
      <div class="b-row" v-else @click="$emit('change', {pin_to_top: 0})">
        {{ $t('chat.unpin_channel_to_top') }}
      </div>
      <template v-if="channel.type === 'project'">
        <div class="b-row" v-if="!channel.is_hide_in_chats_list"
             @click="$emit('change', {is_hide_in_chats_list: 1})">
          {{ $t('chat.hide_from_list') }}
        </div>
        <div class="b-row" v-else @click="$emit('change', {is_hide_in_chats_list: 0})">
          {{ $t('chat.show_in_list') }}
        </div>
      </template>
      <template
        v-if="!channel.is_hide_in_chats_list && (!channel.id_partner || channel.id_partner != $store.state.webuser.user.id )">
        <div class="b-row" v-if="!channel.mute_until_period" @click="$emit('openMutePeriods')">
          {{ $t('chat.mute') }}
        </div>
        <div class="b-row" v-else @click="$emit('change', {mute_until_period: 0})">
          {{ $t('chat.unmute')}}
        </div>
      </template>
      <div @click="$emit('openDeleteHistory')" class="b-row">{{ $t('chat.delete_history')}}</div>
      <div @click="deleteContact(channel)" class="b-row"
           v-if="channel.type === 'pm' && channel.id_partner != $store.state.webuser.user.id">
        {{ $t('chat.remove_pm') }}
      </div>
    </div>
  </context-menu>
</template>

<script>
  import ContextMenu from '../ContextMenu.vue'

  export default {
    components: {ContextMenu},
    name: 'channel-menu',
    props: ['channel'],
    data () {
      return {}
    },
    methods: {
      hide () {
        this.$refs.menu.toggle(0)
      },
      deleteContact (channel) {
        if (window.confirm(this.$t('chat_menu.channel_delete_confirm'))) {
          this.$emit('deleteChannel')
          this.$api.delete('chat-channels/remove-contact?id=' + channel.id)
        }
      }
    },
    computed: {}
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/mixins.less';

  .c-channel-menu {
    justify-content: center;
    align-items: center;
    .b-trigger {
      height: 100%;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      i {
        font-size: 1.2em;
      }
      .b-menu-items {
        padding: 5px 0;
        .b-row {
          padding: 10px 15px;
          .hover-mixin();
        }
      }
    }
  }
</style>
