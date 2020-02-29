<template>
  <div class="c-remove-history b-modal-overlay" v-if="channel" @click="$emit('cancel')">
    <div class="b-modal" @click.stop="">
      <template v-if="$store.getters['webuser/checkAccess']('owner') && channel.type !== 'pm' ">
        <div class="b-row">
          <radio-btn :label="$t('chat.delete_my_only')" v-model="isAll" :value="false"></radio-btn>
        </div>
        <div class="b-row">
          <radio-btn :label="$t('chat.delete_all_members')" v-model="isAll" :value="true"></radio-btn>
        </div>
      </template>
      <template v-else>
        <template v-if="channel.type === 'pm' ">
          <div class="b-row" v-if="!isMyPm" v-html="$tc('chat.pm_delete_confirm', 0, {name: pmUserName || ''})"></div>
          <div class="b-row" v-else>{{ $t('chat.my_pm_delete_confirm')}}</div>
        </template>
        <template v-else>
          <div class="b-row" v-html="$tc('chat.channel_delete_confirm', 0, {channel: capitalize(channel.name)})"></div>
        </template>
        <div class="b-row">{{ $t('chat.cant_undone')}}</div>
      </template>
      <div class="b-buttons">
        <div class="b-button m-cancel" @click="$emit('cancel')">{{ $t('chat.btn_cancel')}}</div>
        <div class="b-button m-ok" @click="removeHistory">
          {{ $t('chat.btn_delete')}}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import RadioBtn from '../RadioBtn.vue'
  import { capitalize } from '~/utils/helpers'

  export default {
    components: {RadioBtn},
    name: 'remove-history',
    data () {
      return {
        isAll: false
      }
    },
    props: ['channel'],
    methods: {
      removeHistory () {
        this.$api.post('chat-messages/remove-all?id_channel=' + this.channel.id, {is_for_all: this.isAll}).then(() => this.$emit('done'))
      },
      capitalize
    },
    computed: {
      partner () {
        if (!this.channel.id_partner) {
          return
        }
        return this.$store.state.companyUsers.find(el => +el.id === +this.channel.id_partner)
      },
      pmUserName () {
        if (this.partner) {
          return capitalize(this.partner.name)
        }
      },
      isMyPm () {
        return +this.channel.id_partner === this.$store.state.webuser.user.id
      }
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/chat.less';

  .c-remove-history {
    .b-row {
      em {
        font-weight: bold;
        font-style: normal;
      }
    }
  }
</style>