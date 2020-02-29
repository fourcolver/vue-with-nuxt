<template>
  <div class="c-working-info">
    <div class="e-task str-truncate" v-if="+user.is_timer_online">
      <span v-if="user.timer_last">
        <template v-if=" mode == 'stats'">
            <nuxt-link v-if="user.timer_last" :to="issueLink">{{ $t('stats_user.working') }}</nuxt-link>
            <span class="e-issue"> {{ $t('stats_user.on') }} {{ workingText }}</span>
            <slot name="workingSeconds"></slot>
        </template>
        <template v-else>
          <span v-if="showWorkingOn">{{ $t('working_info.working_on')}} </span>
          <quwi-link :to="issueLink" v-if="user.timer_last.issue_number && clickableTicketLink">
            {{ '#' + user.timer_last.issue_number + '. ' + user.timer_last.working_on }}
          </quwi-link>
          <span
            v-else-if="user.timer_last.issue_number">{{ '#' + user.timer_last.issue_number + '. ' + user.timer_last.working_on
            }}</span>
          <span v-else>{{ user.timer_last.working_on }}</span>
        </template>
      </span>
    </div>
    <div class="e-worked" v-else>
      <span class="e-online" v-if="user.is_online">online</span>
      <span class="e-comma" v-if="user.is_online">,</span>
      <span class="e-ago" v-if="user.dta_timer_activity">
        {{ $tc('user.worked.ago', true, {date: $dateAgo(user.dta_timer_activity)}) }}
      </span>
      <span v-else>
        {{ $t('never worked') }}
      </span>
    </div>
  </div>
</template>

<script>
  import { getIssueLinkFromTimer } from '~/utils/stats'

  export default {
    name: 'working-info',
    props: {
      user: Object,
      clickableTicketLink: {
        type: Boolean,
        default: true
      },
      showWorkingOn: false,
      mode: null
    },
    data () {
      return {}
    },
    computed: {
      issueLink () {
        return getIssueLinkFromTimer(this, this.user.timer_last)
      },
      workingText () {
        const timer = this.user.timer_last
        let text = timer.working_on
        if (timer.issue_number) {
          text = timer.issue_number + '. ' + text
        }
        return text
      }
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';

  .c-working-info {
    .e-worked {
      font-size: .9em;
      color: #bbb;
      .e-online {
        color: @green-color;
      }
      .e-ago {
        text-transform: lowercase;
      }
    }
  }
</style>
