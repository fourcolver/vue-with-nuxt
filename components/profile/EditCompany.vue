<template>
  <div class="b-edit-company">
    <form class="app-form" @submit.prevent="submit">
      <div class="b-title">
        {{ $t('Company settings') }}
      </div>
      <div class="b-columns">
        <div class="b-left">
          <div class="float">
            <div class="b-row">
              <div class="b-label">
                <label for="company_name">{{ $t('Name') }}</label>
              </div>
              <div class="b-input">
                <input type="text" autofocus="autofocus" name="name" v-model="companyData.name" id="company_name" maxlength="255">
              </div>
            </div>
            <div class="b-row">
              <div class="b-label">
                <label>{{ $t('Timezone') }}</label>
              </div>
              <div class="b-input">
                <dropdown
                  name="timezone"
                  class="b-dropdown--scrollable m-blue"
                  :label="$t('Not set')"
                  :options="timezoneOptions"
                  :selected="companyData.timezone || 'UTC'"
                  :onChange="setTimezone"
                  :scrollable="true"
                  direction="auto"
                >
                </dropdown>
              </div>
            </div>
            <div class="b-row">
              <div class="b-label">
                <label>{{ $t('Screenshots quality') }}</label>
              </div>
              <div class="b-input">
                <dropdown
                  name="screens_quality"
                  :label="$t('Not set')"
                  class="m-blue"
                  :options="screenshotQualityOptions"
                  :selected="companyData.screens_quality"
                  :onChange="setScreenshotsQuality"
                  :disabled-tooltip-content="disabledTooltipContent"
                  direction="auto"
                >
                </dropdown>
              </div>
            </div>
            <div class="b-row">
              <div class="b-label">
                <label>{{ $t('Screenshots interval') }}</label>
              </div>
              <div class="b-input">
                <dropdown
                  name="screens_interval"
                  class="b-dropdown--scrollable m-blue"
                  :label="$t('Not set')"
                  :options="screenshotIntervalOptions"
                  :selected="companyData.screens_interval"
                  :onChange="setScreenshotsInterval"
                  :disabled-tooltip-content="disabledTooltipContent"
                  direction="auto"
                >
                </dropdown>
              </div>
            </div>
            <div class="b-row">
              <div class="b-label">
                <label>{{ $t('profile.company.keep_screenshots') }}</label>
              </div>
              <div class="b-input">
                <dropdown
                  name="screens_keep"
                  class="b-dropdown--scrollable m-blue"
                  :label="$t('Not set')"
                  :options="screenshotsKeepOptions"
                  :selected="companyData.screens_keep_days"
                  :onChange="setScreenshotsKeep"
                  :disabled-tooltip-content="disabledTooltipContent"
                  direction="auto"
                >
                </dropdown>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="b-row">
        <fadeout-message :class="{'error': isError, 'b-message': true}" :message="message" @hide="message=null"></fadeout-message>

        <button type="submit" v-show="false"></button>
        <btn @click="submit" :text="$t('Save')" :loading="this.sending"></btn>
      </div>
      <div class="b-row">
        <div class="b-info b-screens-warning" v-if="company.spent_sec_daily && company.screens_interval">
                <span class="e-info"
                      v-html="$tc('profile.company.screenshots_eat', 0, screenshotsEatParams) + ' ' "></span>
          <nuxt-link class="e-upgrade" v-if="company.tariff.sname !== 'gold' " to="/upgrade">
            {{ $t('profile.company.upgrade') }}
          </nuxt-link>
        </div>
      </div>
    </form>
  </div>
</template>

<script>
  import { mapGetters, mapState } from 'vuex'
  import Btn from '~/components/Btn'
  import FadeoutMessage from '~/components/FadeoutMessage'
  import { getErrorFromResponse, formatFileSize } from '~/utils/helpers'
  import Dropdown from '~/components/Dropdown.vue'
  import { secondsToHIS } from '~/utils/time'
  import moment from 'moment'
  import NuxtLink from '../../.nuxt/components/nuxt-link'

  export default {
    name: 'edit-company',
    components: {
      NuxtLink,
      Btn,
      Dropdown,
      FadeoutMessage
    },
    data () {
      return {
        companyData: {
          timezone: '',
          name: '',
          screens_quality: '',
          screens_interval: '',
          screens_keep_days: ''
        },
        sending: false,
        message: null,
        isError: null,
        disabledTooltipContent: `${this.$t('subscription.not_included_feature')} <a href="/upgrade" target="_blank">${this.$t('subscription.click_to_upgrade')}</a>`
      }
    },
    mounted () {
      this.company.id && this.setCompanyData(this.company)
      window.editCompany = this
    },
    methods: {
      setCompanyData (company) {
        Object.keys(this.companyData).forEach((k) => {
          this.companyData[k] = company[k]
        })
      },
      setMessage (msg, isError) {
        this.message = msg
        this.isError = isError || false
      },
      submit () {
        if (this.sending) {
          return
        }
        this.sending = true

        let params = { ...this.companyData }
        this.$api.put('companies/update-profile', params)
          .then((response) => {
            this.setCompanyData(response.data.company)
            this.$store.commit('webuser/SET_COMPANY', response.data.company)
            this.setMessage(this.$t('Company settings has been updated'))
          })
          .catch((err) => {
            this.setMessage(getErrorFromResponse(err), true)
          })
          .finally(() => {
            this.sending = false
          })
      },
      setTimezone (val) {
        this.$set(this.companyData, 'timezone', val)
      },
      setScreenshotsQuality (val) {
        this.$set(this.companyData, 'screens_quality', val)
      },
      setScreenshotsInterval (val) {
        this.$set(this.companyData, 'screens_interval', val)
      },
      setScreenshotsKeep (val) {
        const set = () => this.$set(this.companyData, 'screens_keep_days', val)
        if (val >= this.companyData.screens_keep_days) {
          set()
          return
        }
        this.$api.get('companies/waste-screens-count', {days: val}).then(async res => {
          if (res.data.count && res.data.count > 0) {
            this.$confirm(this.$tc('profile.company.waste_screens_warn', 0, {
              days: val,
              screens: res.data.count
            })).then(() => set())
          } else {
            set()
          }
        })
      },
      secondsToHIS
    },
    computed: {
      ...mapGetters({
        company: 'webuser/company'
      }),
      ...mapState({
        config: 'companyProfileOptions'
      }),
      timezoneOptions () {
        return this.config.timezone.map((t) => {
          return {
            id: t.value,
            name: t.name
          }
        })
      },
      screenshotQualityOptions () {
        return this.config.screens_quality.map((t) => {
          return {
            id: t.value,
            name: t.name,
            is_active: t.is_active
          }
        })
      },
      screenshotIntervalOptions () {
        return this.config.screens_interval.map((t) => {
          return {
            id: t.value,
            name: t.name,
            is_active: t.is_active
          }
        })
      },
      screenshotsEatParams () {
        let ret = {
          daily_worktime: secondsToHIS(this.company.spent_sec_daily, 'h:i'),
          diskspace: formatFileSize(this.company.tariff.disc_space, true)
        }
        const localeLang = this.$i18n.locale.split('-')[0]
        if (['en', 'ru'].includes(localeLang)) {
          moment.locale(localeLang + '-long')
        }
        moment.relativeTimeThreshold('ss', 1)
        ret.interval = moment.duration({seconds: this.company.screens_interval}).humanize()
        const qualityData = this.config.screens_quality.find(el => +el.value === +this.company.screens_quality)
        if (qualityData) {
          ret.quality = qualityData.name
          const dailySize = this.company.spent_sec_daily / this.company.screens_interval * qualityData.avg_size
          ret.daily_size = formatFileSize(dailySize)
          ret.days_left = Math.round((this.company.tariff.disc_space - this.company.disc_space) / dailySize)
        }
        return ret
      },
      screenshotsKeepOptions () {
        return this.config.screens_keep_days.map((t) => {
          return {
            id: t.value,
            name: t.name,
            is_active: t.is_actisve
          }
        })
      }
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/mixins.less';
  @import '~assets/css/variables.less';

  .b-edit-company {
    margin-bottom: 20px;
    form {
      .b-input {
        .e-errors {
          font-size: 12px;
          color: @red-color;
          margin-top: 5px;
        }
      }
      .b-text {
        padding: 9px 0;
      }

      .float {
        float: left;
        width: 100%;
      }

      .b-columns {
        margin-bottom: 20px;
        &:after { .after-clearfix; }
        @w-right: 120px;
        .b-right {
          float: right;
          width: @w-right;
          text-align: right;
         }
        .b-left {
          margin-right: @w-right;
          &:after { .after-clearfix; }
        }
      }

      .b-row {
        @w-label: 150px;
        margin-bottom: 20px;
        /*border: #ccc solid 1px;*/
        min-height: 30px;
        &:last-child {
          margin-bottom: 0;
        }
        &:after { .after-clearfix; }
        .b-label {
          width: @w-label;
          float: left;
        }
        .b-input {
          margin-left: @w-label;
          &:after { .after-clearfix; }
        }
        .b-info {
          margin-top: 5px;
          line-height: 1.4em;
          em {
            font-style: normal;
            font-weight: bold;
            white-space: nowrap;
          }
        }
        .btn {
          float: right;
          margin-left: 15px;
          min-width: 90px;
        }
        .b-message {
          float: left;
          padding-top: 8px;
          color: @green-color;
          &.error {
            color: @red-color;
          }
        }
        .b-screens-warning {
          text-align: center;
          font-size: 0.9em;
          .e-upgrade {
            white-space: nowrap;
          }
        }
      }

      @item-height: 34px;

      .dropdown-menu {
        white-space: nowrap;
      }

      .b-dropdown--scrollable {
        .dropdown-menu {
          max-height: @item-height * 8 + 12px;
          overflow-y: scroll;
        }
      }
    }
  }
</style>
