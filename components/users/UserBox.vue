<template>

  <div class="b-user-box" :class="{'inactive': user.status === 'deleted'}" @click="$router.push({path: '/users/edit', query: {id: user.id}})">
    <div class="b-logo">
      <avatar :src="user.avatar_url || ''"
              :name=" user.name || $t('User name')"
              :userId="user.id || null"
              size="40"></avatar>
    </div>

    <div class="b-name">
      <div class="e-name" v-if="user.name">{{ capitalize(user.name) }}</div>
      <div class="e-email">{{user.email}}</div>
      <working-info :user="user" :clickable-ticket-link="false"></working-info>
    </div>

    <div class="b-status">
      <div class="e-status" :class="user.status + ' invite-' + user.invite_status">
        {{ statusTitle }}
      </div>
      <div class="e-projects" :title="projectsTitle">
        {{$tc('user.projects', this.user.projects.length, {count: this.user.projects.length})}}
      </div>
    </div>

    <div class="b-stats">
      <div class="stats-row">
        <div class="e-titles">{{ $t('worked this week') }}</div>
        <div class="e-counts">{{ secondsToHIS(user.spent_time_week)}}</div>
      </div>
      <div class="stats-row">
        <div class="e-titles">{{ $t('this month') }}</div>
        <div class="e-counts">{{ secondsToHIS(user.spent_time_month)}}</div>
      </div>
      <div class="stats-row">
        <div class="e-titles">{{ $t('total') }}</div>
        <div class="e-counts">{{ secondsToHIS(user.spent_time_all)}}</div>
      </div>
    </div>
  </div>
</template>

<script>
  import Avatar from '~/components/Avatar'
  import WorkingInfo from '~/components/WorkingInfo'
  import { secondsToHIS } from '~/utils/time'
  import { capitalize } from '~/utils/helpers'

  export default {
    name: 'user-box',
    components: {
      Avatar,
      WorkingInfo
    },
    props: [
      'user'
    ],
    computed: {
      projectsTitle () {
        if (!this.user.projects.length) {
          return null
        }
        let ret = ''
        for (let k = 0; k < this.user.projects.length; k++) {
          ret = ret + this.user.projects[k].name + (k === this.user.projects.length - 1 ? '' : ', ')
        }
        return ret
      },
      statusTitle () {
        if (['pending', 'new'].indexOf(this.user.status) > -1 && this.user.invite_status === 'expired') {
          return this.$t('Invite expired')
        }
        return this.user.statusTitle
      }
    },
    methods: {
      secondsToHIS,
      capitalize
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/mixins.less';
  @import '~assets/css/variables.less';

  .b-user-box {
    @height: 90px;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    background-color: white;
    border-radius: 3px;
    border: 1px solid #dedede;
    padding: 18px 20px 20px 25px;
    cursor: pointer;
    font-size: 0.9em;
    height: @height;
    .hover-mixin(true);

    &.inactive {
      opacity: 0.5;
    }

    .b-logo {
      border: none;
      padding: 0;
      flex: 1;
      max-width: 65px;
    }
    .b-name {
      flex: 2;
      overflow: hidden;

      .e-name, .e-email {
        display: block;
        white-space: nowrap;
        text-overflow: ellipsis;
        overflow: hidden;
        max-width: 100%;
      }
      .e-name {
        font-weight: bold;
        margin-bottom: 5px;
      }
      .e-email {
        color: #777;
        font-size: .9em;
      }

      .c-working-info {
        padding-top: 4px;
      }
    }
    .b-status {
      flex: 2;
      display: flex;
      flex-direction: column;
      text-align: center;
      .e-status {
        color: #777;
        text-transform: capitalize;
        font-weight: bold;
        margin-bottom: 5px;
        &.deleted, &.new, &.pending {
          &:not(.invite-expired) {
            color: @red-color;
          }
        }
        &.active {
          color: @green-color;
        }
      }
      .e-projects {
        font-weight: bold;
      }
    }
    .b-stats {
      flex: 2;
      white-space: nowrap;
      margin-top: 2px;
      margin-left: 32px;
      min-width: 162px;
      max-width: 162px;
      .e-counts {
        text-align: right;
        font-weight: bold;
      }
      .e-counts, .e-titles {
        margin: 4px 0 0;
      }
      .stats-row {
        width: 100%;
        display: flex;
        justify-content: space-between;
      }
    }

  }

  .b-user-box-old {
    background: #fff;
    box-shadow: @box-shadow;
    .hover-mixin(true);
    display: flex;
    margin-bottom: 10px;
    padding: 15px;
    > div {
      display: flex;
      align-items: center;
      margin-right: 20px;
    }
    .b-avatar {
    }
    .b-name {
      flex-direction: column;
      align-items: flex-start;
      justify-content: center;
      width: 192px;
      > div {
        width: 100%;
        overflow-x: hidden;
        text-overflow: ellipsis;
      }
      .e-name {
        font-weight: bold;
        margin-bottom: 5px;
      }
      .e-email {
        color: #777;
        font-size: .9em;
      }
    }
    .b-status {
      font-weight: bold;
      justify-content: flex-start;
      width: 50px;
      color: @grey-color;
      font-size: .9em;
      .deleted, .new, .pending {
        &:not(.invite-expired) {
          color: @red-color;
        }
      }
      .active {
        color: @green-color;
      }
    }
    .b-projects {
      .e-projects {
        white-space: nowrap;
        font-weight: bold;
        font-size: .9em;
      }
    }
    .b-stats {
      font-size: .8em;
      flex-direction: column;
      align-items: flex-start;
      margin-right: 0;
      > div {
        flex-direction: row;
        display: flex;
        width: 100%;
        &:not(:last-child) {
          margin-bottom: 5px;
        }
        .e-label {
          white-space: nowrap;
          justify-content: flex-start;
          margin-right: 10px;
        }
        .e-value {
          justify-content: flex-end;
          font-weight: bold;
          flex: 1;
          display: flex;
        }
      }
    }
  }
</style>
