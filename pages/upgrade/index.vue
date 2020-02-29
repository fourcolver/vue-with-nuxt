<template>
  <div class="b-pricing-page">
    <h1>{{$t('tariffs.pricing')}}</h1>
    <div class="b-desc">
      {{$t('tariffs.description')}}
    </div>

    <div class="b-blocks">

      <div class="b-block m-free" v-if="tariffs.free">
        <div class="b-top-row">
          <h2>{{$t('tariffs.free')}}</h2>
          <div class="e-plan-desc">
            {{$t('tariffs.free_description')}}
          </div>
          <div class="b-button">
            <btn v-if="currentTariff.sname === 'free'" :text="$t('tariffs.continue_as_free')" @click="$router.push(createUrl('/dashboard'))" :isSubmit="false"></btn>
            <btn v-else :text="$t('tariffs.downgrade')" :isSubmit="false" @click="select('free')"></btn>
          </div>
        </div>
        <div class="b-features-row">
          <div class="e-caption">{{$t('tariffs.free_features')}}</div>

          <div class="b-features">
            <div class="b-feature">
              <i class="bu-check-single"></i>
              <div class="e-text">
                {{$t('tariffs.unlim')}} {{$t('tariffs.members')}}
              </div>
            </div>
            <div class="b-feature">
              <i class="bu-check-single"></i>
              <div class="e-text">
                {{$t('tariffs.unlim')}} {{$t('tariffs.tasks')}}
              </div>
            </div>
            <div class="b-feature">
              <i class="bu-check-single"></i>
              <div class="e-text">
                {{$t('tariffs.unlim')}} {{$t('tariffs.projects')}}
              </div>
            </div>
            <div class="b-feature">
              <i class="bu-check-single"></i>
              <div class="e-text">
                {{$t('tariffs.unlim')}} {{$t('tariffs.conversations')}}
              </div>
            </div>
            <div class="b-feature">
              <i class="bu-check-single"></i>
              <div class="e-text">
                {{$t('tariffs.mobile_app')}}
              </div>
            </div>
            <div class="b-feature">
              <i class="bu-check-single"></i>
              <div class="e-text">
                {{$t('tariffs.desktop_app')}}
              </div>
            </div>
            <div class="b-feature">
              <i class="bu-check-single"></i>
              <div class="e-text">
                {{tariffs.free.limits.screens_month}} {{$t('tariffs.screenshots_per_month')}}
              </div>
            </div>
            <div class="b-feature">
              <i class="bu-check-single"></i>
              <div class="e-text">
                {{getScreensInterval(tariffs.free.limits.screens_interval)}}
              </div>
            </div>
            <div class="b-feature">
              <i class="bu-check-single"></i>
              <div class="e-text">
                {{getQuality(tariffs.free.limits.screens_quality)}}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="b-block m-silver" v-if="tariffs.silver">
        <div class="b-top-row">
          <h2>Silver</h2>
          <div class="e-plan-desc m-bold">
            ${{tariffs.silver.periods[1].toFixed(2)}} {{$t('tariffs.monthly')}}
          </div>
          <div class="b-button">
            <btn v-if="currentTariff.sname === 'free'" :text="$t('tariffs.upgrade')" :isSubmit="false" @click="select('silver')"></btn>
            <btn v-if="currentTariff.sname === 'silver'" :text="$t('tariffs.continue_as_silver')" @click="$router.push('/')" :isSubmit="false"></btn>
            <btn v-if="currentTariff.sname === 'gold'" :text="$t('tariffs.downgrade')" :isSubmit="false" @click="select('silver')"></btn>
          </div>
        </div>
        <div class="b-features-row">
          <div class="e-caption">{{$t('tariffs.silver_features')}}</div>
          <div class="b-features">
            <div class="b-feature">
              <i class="bu-check-single"></i>
              <div class="e-text">
                {{$t('tariffs.file_cloud').replace('{s}', getCloudSize(tariffs.silver.limits.disc_space))}}
              </div>
            </div>
            <div class="b-feature">
              <i class="bu-check-single"></i>
              <div class="e-text">
                {{getScreensInterval(tariffs.silver.limits.screens_interval)}}
              </div>
            </div>
            <div class="b-feature" v-if="tariffs.silver.limits.is_chat">
              <i class="bu-check-single"></i>
              <div class="e-text">
                {{$t('tariffs.im')}}
              </div>
            </div>
            <div class="b-feature">
              <i class="bu-check-single"></i>
              <div class="e-text">
                <template v-if="tariffs.silver.limits.screens_month > 0">
                  {{tariffs.silver.limits.screens_month}} {{$t('tariffs.screenshots_per_month')}}
                </template>
                <template v-else>
                  {{$t('tariffs.unlim')}} {{$t('tariffs.screenshots')}}
                </template>
              </div>
            </div>
            <div class="b-feature">
              <i class="bu-check-single"></i>
              <div class="e-text">
                {{$t('tariffs.unlim')}} {{$t('tariffs.conversations')}}
              </div>
            </div>
            <div class="b-feature">
              <i class="bu-check-single"></i>
              <div class="e-text">
                {{getQuality(tariffs.silver.limits.screens_quality)}}
              </div>
            </div>
            <div class="b-feature" v-if="tariffs.silver.limits.is_timelapse_video">
              <i class="bu-check-single"></i>
              <div class="e-text">
                {{$t('tariffs.video')}}
              </div>
            </div>
            <div class="b-feature" v-if="tariffs.silver.limits.is_instant_screen">
              <i class="bu-check-single"></i>
              <div class="e-text">
                {{$t('tariffs.screenshot_on_request')}}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="b-block m-gold" v-if="tariffs.gold">
        <div class="b-top-row">
          <h2>Gold</h2>
          <div class="e-plan-desc m-bold">
            ${{tariffs.gold.periods[1].toFixed(2)}} {{$t('tariffs.monthly')}}
          </div>
          <div class="b-button">
            <btn v-if="currentTariff.sname === 'free' || currentTariff.sname === 'silver'" :text="$t('tariffs.upgrade')" :isSubmit="false" @click="select('gold')"></btn>
            <btn v-if="currentTariff.sname === 'gold'" :text="$t('tariffs.continue_as_gold')" @click="$router.push('/')" :isSubmit="false"></btn>
          </div>
        </div>
        <div class="b-features-row">
          <div class="e-caption">{{$t('tariffs.gold_features')}}</div>
          <div class="b-features">
            <div class="b-feature">
              <i class="bu-check-single"></i>
              <div class="e-text">
                {{$t('tariffs.file_cloud').replace('{s}', getCloudSize(tariffs.gold.limits.disc_space))}}
              </div>
            </div>
            <div class="b-feature">
              <i class="bu-check-single"></i>
              <div class="e-text">
                {{getScreensInterval(tariffs.gold.limits.screens_interval)}}
              </div>
            </div>
            <div class="b-feature" v-if="tariffs.silver.limits.is_chat">
              <i class="bu-check-single"></i>
              <div class="e-text">
                {{$t('tariffs.im')}}
              </div>
            </div>
            <div class="b-feature">
              <i class="bu-check-single"></i>
              <div class="e-text">
                <template v-if="tariffs.gold.limits.screens_month > 0">
                  {{tariffs.gold.limits.screens_month}} {{$t('tariffs.screenshots_per_month')}}
                </template>
                <template v-else>
                  {{$t('tariffs.unlim')}} {{$t('tariffs.screenshots')}}
                </template>
              </div>
            </div>
            <div class="b-feature">
              <i class="bu-check-single"></i>
              <div class="e-text">
                {{$t('tariffs.unlim')}} {{$t('tariffs.conversations')}}
              </div>
            </div>
            <div class="b-feature">
              <i class="bu-check-single"></i>
              <div class="e-text">
                {{getQuality(tariffs.gold.limits.screens_quality)}}
              </div>
            </div>
            <div class="b-feature" v-if="tariffs.gold.limits.is_timelapse_video">
              <i class="bu-check-single"></i>
              <div class="e-text">
                {{$t('tariffs.video')}}
              </div>
            </div>
            <div class="b-feature" v-if="tariffs.gold.limits.is_instant_screen">
              <i class="bu-check-single"></i>
              <div class="e-text">
                {{$t('tariffs.screenshot_on_request')}}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <select-payment-type
      v-if="selectedTariff"
      @hide="selectedTariff = null"
      :tariff="selectedTariff">
    </select-payment-type>
  </div>
</template>

<script>
  import Btn from '~/components/Btn'
  import SelectPaymentType from '~/components/upgrade/SelectPaymentType'
  import { mapGetters } from 'vuex'
  import { formatFileSize, raiseError } from '@/utils/helpers'

  export default {
    middleware: ['member', 'owner'],
    components: {
      Btn,
      SelectPaymentType
    },
    head: {
      title: 'Upgrade'
    },
    data: () => ({
      period: 1,
      selectedTariff: null,
      tariffs: {}
    }),
    computed: {
      ...mapGetters({
        company: 'webuser/company',
        createUrl: 'company/createUrl'
      }),
      currentTariff () {
        return this.company ? this.company.tariff : null
      }
    },
    methods: {
      select (sname) {
        this.selectedTariff = this.tariffs[sname]
      },
      getCloudSize (size) {
        let fileSize = formatFileSize(size)
        if (this.$store.state.locale === 'ru-RU') {
          fileSize = fileSize.replace('GB', ' Гб')
          fileSize = fileSize.replace('TB', ' Тб')
        } else {
          fileSize = fileSize.replace('GB', ' Gb')
          fileSize = fileSize.replace('TB', ' Tb')
        }
        return fileSize
      },
      getQuality (q) {
        return this.$t('tariffs.screens_quality').replace('{q}', q + 'p')
      },
      getScreensInterval (i) {
        let count = i / 60
        if (count < 1) {
          count *= 60
          return this.$t('tariffs.screen_per_seconds').replace('{n}', count)
        } else {
          return this.$t('tariffs.screen_per_minutes').replace('{n}', count)
        }
      }
    },
    asyncData ({app, error}) {
      return app.$api.get('payment/tariffs')
        .then(res => ({tariffs: res.data.tariffs}))
        .catch((e) => raiseError(error, e))
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';
  .b-pricing-page {
    max-width: 1100px;
    margin-left: auto;
    margin-right: auto;
    @font-face {
      font-family: gordita;
      src: url(~assets/fonts/Gordita-Light.woff2) format("woff2");
      font-weight: 300;
    }

    @font-face {
      font-family: gordita;
      src: url(~assets/fonts/Gordita-Regular.woff2) format("woff2");
      font-weight: 400;
    }
    @font-face {
      font-family: gordita;
      src: url(~assets/fonts/Gordita-Medium.woff2) format("woff2");
      font-weight: 500;
    }
    font-family: gordita, "Helvetica Neue", sans-serif;
    padding-bottom: 50px;
    > h1 {
      margin-top: 50px;
      margin-bottom: 15px;
      text-align: center;
      font-weight: 400;
      font-size: 2.5em;
    }
    > .b-desc {
      color: rgb(100, 111, 121);
      max-width: 55%;
      margin: 0 auto 35px auto;
      text-align: center;
      font-size: 1.2em;
    }
    > .b-blocks {
      display: flex;
      justify-content: space-evenly;

      .b-block {
        @padding: 20px;
        background: #fff;
        color: rgb(100, 111, 121);
        box-shadow: 0 20px 30px 0 rgba(36, 50, 66, .14);
        width: 28%;
        padding: 15px @padding;
        .b-top-row {
          > h2 {
            font-weight: 400;
            font-size: 1.8em;
            text-align: center;
            margin-bottom: 15px;
            color: #000;
          }
          .e-plan-desc {
            height: 50px;
            text-align: center;
            justify-content: center;
            display: flex;
            align-items: center;
            &.m-bold {
              font-size: 1.5em;
              /*font-weight: bold;*/
            }
          }
          .b-button {
            height: 80px;
            text-align: center;
            justify-content: center;
            display: flex;
            align-items: center;
          }
        }
        .b-features-row {
          margin: 0 -@padding;
          padding: 25px @padding;
          border-top: 1px solid rgb(237, 241, 242);
          .e-caption {
            font-size: 1.1em;
            margin-bottom: 25px;
          }

          .b-feature {
            margin-bottom: 15px;
            display: flex;
            i {
              color: @green-color;
              margin-right: 7px;
              font-size: 1.2em;
            }
            .e-text {
              padding-top: .2em;
            }
          }
        }
      }
    }
  }
</style>
