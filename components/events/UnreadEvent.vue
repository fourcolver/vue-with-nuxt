<template>
  <div class="c-unread-event" :class="{ 'm-comment': event.type === 'create_comment_issue' }">
    <div class="b-main" :class="{inactive: !active}"
         @click="e => active ? $emit('click', e) : null">
      <div class="b-info">
        <avatar :userId="event.id_user" size="20"></avatar>
        <div class="e-name">{{ getCompanyUser(event.id_user).name }}</div>
        <div class="e-title">{{ event.type === 'create_comment_issue' ? event.description : event.title }}</div>
      </div>
      <div class="e-time">{{ $dateAgo(event.dta_create || event.dta) }}</div>
    </div>
    <div class="b-read" @click="read(event)" v-if="showRead">
      <i class="bu-ok-circle"></i>
    </div>
  </div>
</template>

<script>
  import { mapGetters } from 'vuex'
  import Avatar from '../Avatar.vue'

  export default {
    components: {Avatar},
    name: 'unread-event',
    props: {
      event: null,
      active: {
        type: Boolean,
        default: false
      },
      showRead: {
        default: true
      }
    },
    data () {
      return {}
    },
    methods: {
      read () {
        this.$store.commit('REMOVE_UNREAD_EVENT', this.event.id)
        this.$api.put('events/read-by-id', {id: this.event.id}).then(() => {
          this.$store.dispatch('updateUnreadEvents')
        })
      }
    },
    computed: {
      ...mapGetters(['getCompanyUser'])
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';
  @import '~assets/css/mixins.less';

  .c-unread-event {
    height: 42px;
    &.m-comment {
      height: auto;
      min-height: 42px;
      .b-main {
        padding-top: 8px !important;
        .b-info {
          display: block;
          max-height: 120px;
          overflow: hidden;
          .e-title {
            white-space: normal;
            color: #000;
            font-style: normal;
          }
          .b-avatar {
            display: inline-block;
          }
          .e-name, .e-title {
            display: inline;
            vertical-align: middle;
            line-height: 24px;
          }
        }
        .e-time {
          align-self: flex-start;
        }
      }
    }
    .b-main {
      display: flex;
      height: 100%;
      align-items: center;
      &:not(.inactive) {
        .hover-mixin();
      }
      padding: 0 10px;
      flex: 1;
      overflow: hidden;
      &.inactive {
        opacity: .5;
      }
      .b-info {
        flex: 1;
        display: flex;
        height: 100%;
        align-items: center;
        overflow: hidden;
        > div {
          &:not(:last-child) {
            margin-right: 7px;
          }
          &.b-avatar {
            margin-right: 10px;
          }
        }
        .e-name {
          color: @basic-blue;
        }
        .e-title {
          font-style: italic;
          color: @green-color;
          font-size: 0.9em;
        }
        .e-name, .e-title {
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
        }
      }
      .e-time {
        margin-left: 5px;
        font-size: .8em;
        white-space: nowrap;
        color: #6f6f6f;
      }
    }
  }
</style>
