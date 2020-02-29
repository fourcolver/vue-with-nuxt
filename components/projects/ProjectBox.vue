<template>
  <div class="b-project-box" :class="{'inactive': !project.is_active}">
    <div class="b-mover">
      <i class="bu-th-list"></i>
    </div>
    <div class="b-project-content" @click="$router.push({path: '/projects/edit', query: {id: project.id}})">
      <div class="b-logo">
        <avatar :src="project.logo_url || ''"
                :size="40"
                :name="project.name"></avatar>
      </div>

      <div class="b-name">
        <div class="e-name">{{ capitalize(project.name) }}</div>
      </div>

      <div class="b-status">
        <div class="e-status" :class="{'m-active': project.is_active}">
          {{ $t(project.is_active ? 'active' : 'inactive') }}
        </div>
        <div class="e-users">{{$tc('user.counts', project.users.length, {count: project.users.length})}}</div>
      </div>

      <div class="b-stats">
        <div class="stats-row">
          <div class="e-titles">{{$t('time this week')}}</div>
          <div class="e-counts">{{secondsToHIS(project.spent_time_week)}}</div>
        </div>
        <div class="stats-row">
          <div class="e-titles">{{$t('this month')}}</div>
          <div class="e-counts">{{secondsToHIS(project.spent_time_month)}}</div>
        </div>
        <div class="stats-row">
          <div class="e-titles">{{$t('total')}}</div>
          <div class="e-counts">{{secondsToHIS(project.spent_time_all)}}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import Avatar from '~/components/Avatar.vue'
  import { secondsToHIS } from '~/utils/time'
  import { capitalize } from '~/utils/helpers'

  export default {
    name: 'project-box',
    components: {
      Avatar
    },
    props: [
      'project'
    ],
    methods: {
      secondsToHIS,
      capitalize
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/mixins.less';

  .b-project-box {
    @height: 90px;
    margin-bottom: 6px;
    width: 100%;
    align-items: center;
    position: relative;
    .b-mover {
      position: absolute;
      left: -40px;
      // top: @height / 2 - 10;
      align-content: center;
      text-align: center;
      display: flex;
      align-items: center;
      height: @height;
      width: 40px;
      i {
        color: #b4b4b4;
        cursor: move;
        visibility: hidden;
      }
    }

    &.inactive {
      opacity: 0.5;
      .b-mover {
        display: none;
      }
    }
    &:hover {
      .b-mover {
        i {
          visibility: visible;
        }
      }
    }
    .b-project-content {
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

      .b-logo {
        border: none;
        padding: 0;
        flex: 1;
        max-width: 65px;
      }
      .b-name {
        flex: 2;
        font-weight: bold;;
        overflow: hidden;

        .e-name {
          display: block;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          max-width: 100%;
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
          &.m-active {
            color: @green-color;
          }
        }
        .e-users {
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
  }
</style>
