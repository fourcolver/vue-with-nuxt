<template>

  <div class="c-plan-info app-form">
    <div class="b-title">
      {{ $t('planinfo.title') }}
    </div>
    <div class="b-body" v-if="plan">
      <div class="b-row b-name">
        <span class="e-name">{{ plan.name }}</span>
        <template v-if="!plan.is_free">
          <span class="e-dot">. </span>
          <span
            class="e-expire">{{ $t('planinfo.expires_on') + ' ' + $date(plan.end_pay).format('D MMM YYYY')}}</span>
        </template>
      </div>
      <div class="b-row b-disc">
        <span class="e-available">{{ values.disc.a + ' ' + $t('planinfo.disc_space')}}</span>
        <span class="e-used"> ({{ values.disc.u + ' ' + $t('planinfo.used') }})</span>
      </div>
      <div class="b-row b-screens">
        <span class="e-available">{{ values.screens.a + ' ' + $t('planinfo.screenshots_per_month')}}
</span>
        <span class="e-used"> ({{ values.screens.u + ' ' + $t('planinfo.used')}})</span>
      </div>
      <div class="b-row b-time">
        <span class="e-available">{{ values.time.a + ' ' + $t('planinfo.tracked_time_month')}}</span>
        <span
          class="e-used"> ({{ values.time.u + ' ' + $t('planinfo.used')}})</span>
      </div>
      <div class="b-row b-interval">
        <span class="e-interval">
          {{ '1 ' + $t('planinfo.screenshot_in') + ' ' + values.interval + ' ' + $t('planinfo.screenshot_in_limit')}}
        </span>
      </div>
      <div class="b-row">
        {{ $t('planinfo.quality') + ': ' + (plan.screens_quality ? (plan.screens_quality + 'p') : '') }}
      </div>
      <div class="b-row">
        {{ $t('planinfo.on_request') + ': ' + $t(plan.is_instant_screen ? 'Yes' : 'No') }}
      </div>
      <div class="b-row">
        {{ $t('planinfo.im') + ': ' + $t(plan.is_chat ? 'Yes' : 'No') }}
      </div>
      <div class="b-row">
        {{ $t('planinfo.videos') + ': ' + $t(plan.is_timelapse_video ? 'Yes' : 'No') }}
      </div>
      <div class="b-row b-button-row" v-if="!hideButton">
        <btn @click="$router.push('/upgrade')" :text="$t('planinfo.change')" :isSubmit="false"></btn>
      </div>
    </div>
  </div>
</template>

<script>
  import { mapGetters } from 'vuex'
  import { formatFileSize } from '~/utils/helpers'
  import { secondsToHIS } from '~/utils/time'
  import moment from 'moment'
  import Btn from '../Btn.vue'

  export default {
    components: {Btn},
    name: 'plan-info',
    props: ['hideButton'],
    data () {
      return {}
    },
    computed: {
      ...mapGetters({
        company: 'webuser/company'
      }),
      plan () {
        return this.company ? this.company.tariff : null
      },
      values () {
        let ret = {}
        const u = k => this.company[k] > this.plan[k] && this.plan[k] !== -1 ? this.plan[k] : this.company[k]
        const unlim = this.$t('planinfo.unlim')
        ret.disc = {
          a: this.formatFileSize(this.plan.disc_space),
          u: this.formatFileSize(this.company.disc_space)
        }
        ret.screens = {
          a: this.plan.screens_month > -1 ? this.plan.screens_month : unlim,
          u: u('screens_month')
        }
        ret.time = {}
        let planTime = this.plan.tracked_timer_month
        if (planTime === -1) {
          ret.time.a = unlim
        } else {
          ret.time.a = (Math.floor(planTime / 3600)) + ' ' + this.$t('planinfo.hours')
        }
        let usedTime = this.company.tracked_timer_month
        if (usedTime > 0) {
          ret.time.u = this.secondsToHIS(u('tracked_timer_month'), 'h:i')
        } else {
          ret.time.u = 0
        }
        ret.interval = ''
        let seconds = this.plan.screens_interval
        let locale = moment().locale(this.$i18n.locale)
        if (!locale) {
          locale = moment().locale('en')
        }
        const localeData = locale.localeData()._relativeTime
        const rl = (k, s) => {
          if (typeof localeData[k] === 'function') {
            return localeData[k](s, false, k)
          } else {
            if (localeData[k].indexOf('%d') === -1) {
              return localeData[k]
            } else {
              return localeData[k].replace('%d', s)
            }
          }
        }
        if (seconds < 60) {
          ret.interval = rl('ss', seconds)
        } else if (seconds === 60) {
          ret.interval = rl('m', 1)
        } else if (seconds < 3600) {
          ret.interval = rl('mm', Math.floor(seconds / 60))
        } else if (seconds === 3600) {
          ret.interval = rl('h', 1)
        }
        return ret
      }
    },
    methods: {
      formatFileSize,
      secondsToHIS
    }
  }
</script>

<style lang="less" type="text/less">
  .c-plan-info {
    margin-top: 20px;
    .b-row {
      margin-bottom: 10px;
    }
    .b-name {
      .e-name {
        font-weight: bold;
      }
    }
    .b-button-row {
      margin-top: 30px;
      text-align: center;
    }
  }
</style>
