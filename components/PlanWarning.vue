<template>
  <div class="c-plan-warning m-warning-bar" v-show="type && visible && isRouteQualify">
    <transition name="slide">
      <div class="b-row" :class=" 'm-' + type ">
        {{ $t('planwarning.' + type)}}
        <nuxt-link to="/upgrade">{{ $t('plan_upgrade_link') }}</nuxt-link>
        <div class="e-close" v-if="type != 'alert'" @click="visible = false">
          &times;
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
  import NuxtLink from '../.nuxt/components/nuxt-link'
  import { mapGetters } from 'vuex'

  export default {
    components: {NuxtLink},
    name: 'plan-warning',
    data () {
      return {
        visible: false
      }
    },
    computed: {
      ...mapGetters({
        company: 'webuser/company'
      }),
      type () {
        let company = this.company
        const limits = ['disc_space', 'tracked_timer_month', 'screens_month']
        let maxPercent = 0
        limits.forEach(el => {
          if (typeof company.tariff[el] !== 'undefined' && typeof company[el] !== 'undefined' &&
            company[el] !== -1) {
            let percent = company[el] / company.tariff[el] * 100
            if (percent > maxPercent) {
              maxPercent = percent
            }
          }
        })
        if (maxPercent >= 100) {
          return 'alert'
        } else if (maxPercent >= 80) {
          return 'warning'
        }
        return null
      },
      isRouteQualify () {
        return this.$route.path.indexOf('login') === -1 && this.$route.path.indexOf('upgrade') === -1
      }
    },
    mounted () {
      window.planWarning = this
      this.$nextTick(() => {
        this.visible = true
      })
    },
    watch: {
      type () {
        this.visible = true
      }
    }
  }
</script>
<style lang="less" type="text/less">
  @import '~assets/css/warning_bar.less';

  .c-plan-warning {
  }
</style>
