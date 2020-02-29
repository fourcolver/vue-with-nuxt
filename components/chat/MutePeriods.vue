<template>
  <div class="c-chat-mute-periods b-modal-overlay" v-if="channel" @click="$emit('cancel')">
    <div class="b-modal" @click.stop="">
      <div class="e-header">{{ $t('chat.disable_notifications')}}</div>
      <div class="e-choose-time">{{ $t('chat.choose_mute_period')}}</div>
      <div class="b-chat">
        <avatar :src="channel.avatar_url" :userId="channel.userId"
                :name="channel.name"
                size="35"></avatar>
        <div class="e-name">{{ capitalize(channel.name) }}</div>
      </div>
      <div class="b-periods">
        <div class="b-period" v-for="h in [1, 4, 18]">
          <radio-btn :label="$t('chat.for') + ' ' + formatDuration(h * 60)" :value="h * 3600"
                     v-model="period"></radio-btn>
        </div>
        <div class="b-period">
          <radio-btn :label="$t('chat.forever')" :value="-1" v-model="period"></radio-btn>
        </div>
      </div>
      <div class="b-buttons">
        <div class="b-button m-cancel" @click="$emit('cancel')">{{ $t('chat.btn_cancel')}}</div>
        <div class="b-button m-ok"
             @click="$emit('change', period)">
          {{ $t('chat.btn_ok')}}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import { capitalize } from '~/utils/helpers'
  import { formatDuration } from '~/utils/chat'
  import RadioBtn from '../RadioBtn.vue'
  import Avatar from '../Avatar.vue'

  export default {
    components: {
      Avatar,
      RadioBtn
    },
    name: 'mute-periods',
    data () {
      return {
        period: 3600
      }
    },
    props: ['channel'],
    methods: {
      formatDuration (minutes) {
        return formatDuration(this, minutes)
      },
      capitalize
    },
    computed: {}
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/chat.less';

  .c-chat-mute-periods {
    .e-header {
      font-size: 1.2em;
      font-weight: bold;
    }
    .e-choose-time {
      font-size: 1.1em;
    }
    .b-chat {
      display: flex;
      align-items: center;
      margin-top: 15px;
      margin-bottom: 15px;
      .b-avatar {
        margin-right: 10px;
        img {
          display: block;
        }
      }
      .e-name {
        font-weight: bold;
        font-size: 1.1em;
      }
    }
    .b-periods {
      .b-period {
        margin-bottom: 8px;
      }
    }
  }
</style>