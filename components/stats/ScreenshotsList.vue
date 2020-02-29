<template>
  <div class="c-screenshots-list"
       v-infinite-scroll="loadMore"
       infinite-scroll-disabled="loadDisabled"
       infinite-scroll-distance="5">
    <div class="b-tool">
        <div class="b-left" v-if="showTool">
            <div class="b-select-day">
                <div class="b-prev" @click="prevDay">
                    <span class="e-arrow">&lt</span>
                </div>
                <div class="e-current">{{ formatDate(getDateInstance(currentDate.iso()), 'DD MMM') }}</div>
                <div class="b-next" :class="{'disabled': isNextDayDisabled}" @click="nextDay">
                    <span class="e-arrow">&gt</span>
                </div>
            </div>
            <dropdown :options="modeViewOptions"
                      :selected="modeView"
                      :onChange="val => modeView = val"></dropdown>
        </div>
        <div class="b-left" v-else>
            <div class="e-latest-screens">{{$t('stats_user.latest_screens')}}</div>
        </div>
        <div class="b-slider">
            <i class="bu-zoom-out" @click="width = (width - 5 < minWidth ? minWidth : width - 5)"></i>
            <range-slider :min="minWidth" :max="maxWidth" v-model="width"></range-slider>
            <i class="bu-zoom-in" @click="width = (width + 5 > maxWidth ? maxWidth : width + 5)"></i>
        </div>
    </div>
    <div v-for="(items, hour, index) in screensWithHours" v-if="_screens.length && modeView === 1" class="b-screens-by-hour">
      <div class="b-time">
          <i class="bu-circle-empty"></i>
          <span class="e-hours">{{formatDate(getDateInstance(hour), 'HH:00')}} - {{formatDate(getDateInstance(hour, 1), 'HH:00')}}.</span>
          <span>Time worked: {{items.minutes}}</span>
      </div>
      <div class="b-items">
        <instant-screen v-if="$store.state.webuser.user.role === 'owner' && index === 0 && isToday(getDateInstance(currentDate))" :width="width + 22" :height="height"
                      @add="s => addScreen(s)"
                      :aggregated="modeView === 1"
                      :user="user"></instant-screen>
        <div class="b-screenshot"
             v-if="renderScreenList"
             :class="{'m-new': item.is_new}" :style="{width: (width + 22) + 'px'}" v-for="(item) in items.screens"
             @mouseenter="getScreensCount(item)"
             :data-id="item.id">
                <div class="b-info">
                    <div class="b-row">
                        <div class="b-user" v-if="showUser">
                            <avatar size="25" v-if="item.user" :userId="item.user.id"></avatar>
                        </div>
                        <div class="b-task">
                            <div class="b-number" v-if="item.issue_number">
                                <a class="e-number" target="_blank"
                                   :href=" '/comments?issue=' + item.issue_number">{{ item.issue_number }}</a>
                                <span class="e-dot">.</span>
                            </div>
                            <span class="e-name" v-if="item.working_on">{{ item.working_on }}</span>
                            <span class="e-cnt" v-if="modeView === 1"><i class="bu-picture"></i> {{ item.no_activity_cnt }}</span>
                        </div>
                    </div>
                </div>
                <div class="b-img-wrap">
                    <protected-image class="js-main" @click.native.stop="$emit('screenClick', item)" :src="item.sizes.thumb.url"
                                     :height="height" :prefetchSrc="item.sizes.file.url" :slides="item.no_activity_items"></protected-image>
                </div>
                <template>
                    <div class="b-bottom">
                        <div class="b-time" v-if="modeView === 0">
                            {{ formatDate(getDateInstance(item.dta), !showDate ? 'H:mm:ss' : 'D MMM H:mm:ss') }}
                        </div>
                        <div class="b-time m-period" v-else>
                            {{ formatDate(getDateInstance(item.activity_since), showDate ? 'D MMM H:mm' : 'H:mm') }} - {{ formatDate(getDateInstance(item.dta), 'H:mm')}}
                        </div>
                        <progress-bar v-if="modeView === 1" :percent="getAvgActivity(item)" :class="getProgressClass(item)"></progress-bar>
                    </div>
                </template>
                <div class="b-select" :class="{selected: item.selected}"
                     v-if="showCheckbox && canDelete(item)">
                    <checkbox :value="item.id" :model="item.selected" @change="selectScreen(item)"></checkbox>
                </div>
            </div>
      </div>
    </div>
    <div v-if="_screens.length && modeView === 0" class="b-items">
        <instant-screen v-if="$store.state.webuser.user.role === 'owner' && isToday(getDateInstance(currentDate)) && showTool" :width="width + 22" :height="height"
                        @add="s => addScreen(s)"
                        :aggregated="modeView === 1"
                        :user="_screens[0].user || user"></instant-screen>
        <div class="b-screenshot"
             v-if="renderScreenList"
             :class="{'m-new': item.is_new}" :style="{width: (width + 22) + 'px'}" v-for="item in _screens"
             :data-id="item.id">
            <div class="b-info">
                <div class="b-row">
                    <div class="b-user" v-if="showUser">
                        <avatar size="25" v-if="item.user" :userId="item.user.id"></avatar>
                    </div>
                    <div class="b-task">
                        <div class="b-number" v-if="item.issue_number">
                            <a class="e-number" target="_blank"
                               :href=" '/comments?issue=' + item.issue_number">{{ item.issue_number }}</a>
                            <span class="e-dot">.</span>
                        </div>
                        <span class="e-name" v-if="item.working_on">{{ item.working_on }}</span>
                        <span class="e-cnt" v-if="modeView === 1"><i class="bu-picture"></i> {{ item.no_activity_cnt }}</span>
                    </div>
                </div>
            </div>
            <div class="b-img-wrap">
                <protected-image class="js-main" @click.native.stop="$emit('screenClick', item)" :src="item.sizes.thumb.url"
                                 :height="height" :prefetchSrc="item.sizes.file.url" :slides="item.no_activity_items"></protected-image>
            </div>
            <template>
                <div class="b-bottom">
                    <div class="b-time" v-if="modeView === 0">
                        {{ formatDate(getDateInstance(item.dta), !showDate ? 'H:mm:ss' : 'D MMM H:mm:ss') }}
                    </div>
                    <div class="b-time m-period" v-else>
                        {{ formatDate(getDateInstance(item.activity_since), showDate ? 'D MMM H:mm' : 'H:mm') }} - {{ formatDate(getDateInstance(item.dta), 'H:mm')}}
                    </div>
                    <progress-bar v-if="modeView === 1" :percent="getAvgActivity(item)" :class="getProgressClass(item)"></progress-bar>
                </div>
            </template>
            <div class="b-select" :class="{selected: item.selected}"
                 v-if="showCheckbox && canDelete(item)">
                <checkbox :value="item.id" :model="item.selected" @change="selectScreen(item)"></checkbox>
            </div>
        </div>
    </div>
    <div v-for="(items, hour) in periodHours" class="b-screens-by-hour" v-if="!_screens.length">
        <div class="b-time">
            <i class="bu-circle-empty"></i>
            <span class="e-hours">{{formatDate(getDateInstance(hour), 'HH:00')}} - {{formatDate(getDateInstance(hour, 1), 'HH:00')}}.</span>
            <span>Time worked: 00:00:00</span>
        </div>
        <div class="b-items"></div>
    </div>
    <div class="b-selected-row" v-if="selected.length">
      <div class="b-selected">
        <div class="e-selected">{{ $t('screenshots.selected') + ': ' + selected.length}}</div>
        <btn @click="deleteSelected" :loading="deleting" class="e-delete" :text="$t('screenshots.delete')"></btn>
        <span class="e-cancel" @click="unselect">{{ $t('screenshots.cancel') }}</span>
      </div>
    </div>
  </div>
</template>

<script>
  import ProtectedImage from '../../components/ProtectedImage'
  import Avatar from '../../components/Avatar.vue'
  import { formatDate, setPeriodFormats } from '~/utils/time'
  import moment from 'moment'
  import ScreenshotsViewer from './ScreenshotsViewer.vue'
  import ProgressBar from '../ProgressBar.vue'
  import Checkbox from '../Checkbox.vue'
  import Btn from '../Btn.vue'
  import { mapGetters, mapState } from 'vuex'
  import RangeSlider from 'vue-range-slider'
  import { debounce } from 'lodash'
  import InstantScreen from './InstantScreen.vue'
  import ContextMenu from '../ContextMenu.vue'
  import Dropdown from '../Dropdown.vue'

  setPeriodFormats(moment)
  const MAX_CAN_SELECT = 50
  const MAX_WIDTH = 270
  const MAX_HEIGHT = 152
  const MIN_WIDTH = 100

  export default {
    name: 'screenshots-list',
    props: {
      showUser: Boolean,
      showDate: {
        type: Boolean,
        default: true
      },
      showCheckbox: {
        type: Boolean,
        default: true
      },
      showTool: {
        type: Boolean,
        default: true
      },
      modeViewScreens: {
        type: Number,
        default: 1
      },
      user: null,
      screens: null
    },
    data () {
      return {
        deleting: false,
        width: 240,
        maxWidth: MAX_WIDTH,
        minWidth: MIN_WIDTH,
        timer: null,
        currentDate: null,
        loading: false,
        page: 1,
        modeView: 1,
        renderScreenList: true,
        getScreensWithHoursLoading: false
      }
    },
    methods: {
      formatDate (dta, format) {
        return formatDate(dta, format, this.$i18n.locale)
      },
      isToday (date) {
        let now = moment.utc()
        // now.utcOffset(120)
        return date.diff(now, 'days') === 0
      },
      getDateInstance (date, hour) {
        let inst = moment.utc(date)
        inst.locale(this.$i18n.locale)
        // inst.utcOffset(120)

        if (hour) {
          inst.add(hour, 'hours')
        }

        return inst
      },
      getAvgActivity (item) {
        return (+item.activity_keyboard + +item.activity_mouse) / 2
      },
      getProgressClass (item) {
        const act = this.getAvgActivity(item)
        if (act < 33.33) {
          return 'm-red'
        } else if (act < 66.66) {
          return 'm-yellow'
        }
        return 'm-green'
      },
      getPeriodLength (item) {
        const to = this.getDateInstance(item.dta)
        const from = this.getDateInstance(item.activity_since)
        return to.from(from, true)
      },
      canDelete (screen) {
        return this.modeView === 0 && (+screen.id_user === +this.$store.state.webuser.user.id || this.checkAccess('owner'))
      },
      deleteSelected () {
        if (!this.deleting && confirm(this.$t('screenshots.delete_confirm'))) {
          this.deleting = true
          this.$api.put('timers-screens/delete', {ids: this.selected}).then(() => {
            this.$emit('delete', this.selected)
            this.selected = []
          }).finally(() => {
            this.deleting = false
          })
        }
      },
      selectScreen (item) {
        const id = item.id
        if (item.selected) {
          this.$store.commit('stats/UPDATE_SCREEN', {id, selected: 0})
        } else {
          if (this.selected.length >= MAX_CAN_SELECT) {
            alert(this.$tc('screenshots.max_select_warning', MAX_CAN_SELECT, {n: MAX_CAN_SELECT}))
          } else {
            this.$store.commit('stats/UPDATE_SCREEN', {id, selected: 1})
          }
        }
      },
      setWidth (width) {
        if (!width) {
          return
        }
        if (width > MAX_WIDTH) {
          width = MAX_WIDTH
        }
        if (width < MIN_WIDTH) {
          width = MIN_WIDTH
        }
        this.width = width
      },
      updateSettings: debounce((vm, val) => {
        vm.$store.dispatch('updateUserSettings', {screens_list_zoom: val})
      }, 500),
      addScreen (s) {
        s.is_new = 1
        this.$store.commit('stats/ADD_SCREEN', s)
        this.$nextTick(() => {
          this.timer = window.setTimeout(() => {
            this.$store.commit('stats/UPDATE_SCREEN', {id: s.id, is_new: 0})
          }, 1000)
        })
      },
      unselect () {
        this.selected.forEach(el => {
          this.$store.commit('stats/UPDATE_SCREEN', {id: el.id, selected: 0})
        })
      },
      async loadMore () {
        if (!this.user) {
          return
        }

        if (+this.modeView) {
          return
        }

        this.loading = true

        let dtaFrom = this.currentDate.clone().startOf('day').iso()
        let dtaTo = this.currentDate.clone().endOf('day').iso()

        await this.$store.dispatch('stats/getScreens', {
          userId: this.user.id,
          page: ++this.page,
          filters: {
            dta_from: dtaFrom,
            dta_to: dtaTo
          }
        })

        this.loading = false
      },
      getScreensCount (screen) {
        if (screen.no_activity_items && screen.no_activity_items.length) {
          return
        }

        this.$store.dispatch('stats/getScreensCount', {
          userId: this.user ? this.user.id : screen.user.id,
          filters: {
            dta_from: this.$date(screen.activity_since).iso(),
            dta_to: this.$date(screen.dta).iso()
          }
        }).then((res) => {
          screen.no_activity_items = res.data.screens.filter((item) => item.activity_since === null)
          screen.no_activity_cnt = screen.no_activity_items.length

          this.forceRerender()
        })
      },
      forceRerender () {
        this.renderScreenList = false

        this.$nextTick(() => {
          this.renderScreenList = true
        })
      },
      prevDay () {
        if (this.getScreensWithHoursLoading) {
          return
        }

        this.currentDate = this.currentDate.clone().subtract(1, 'day')
      },
      nextDay () {
        if (this.isNextDayDisabled || this.getScreensWithHoursLoading) {
          return
        }

        this.currentDate = this.currentDate.clone().add(1, 'day')
      }
    },
    computed: {
      ...mapGetters({
        checkAccess: 'webuser/checkAccess'
      }),
      ...mapState({
        spentByHour: state => state.stats.spentByHour
      }),
      datedScreenList () {
        let datedList = {}
        this._screens.forEach((screen) => {
          let date = moment(screen.dta).locale(this.$i18n.locale).format('DD MMMM Y. dddd')
          if (!(datedList[date] instanceof Array)) {
            datedList[date] = []
          }
          datedList[date].push(screen)
        })
        return datedList
      },
      dateTitles () {
        return Object.keys(this.datedScreenList)
      },
      height () {
        return Math.floor(this.width * (MAX_HEIGHT / MAX_WIDTH))
      },
      selected () {
        return this._screens.filter(el => el.selected)
      },
      _screens () {
        if (this.screens) {
          return this.screens
        } else {
          return this.$store.state.stats.screens
        }
      },
      screensWithHours () {
        return this.$store.state.stats.screensWithHours
      },
      loadDisabled () {
        return this.loading || +this.$store.state.stats.screensHeaders['x-pagination-page-count'] <= this.page
      },
      periodHours () {
        let periodHours = {}

        for (let hour = 23; hour >= 0; hour--) {
          let dateStart = this.currentDate.toDate()
          dateStart.setHours(hour)
          dateStart.setMinutes(0)
          dateStart.setSeconds(0)

          periodHours[moment(dateStart).format('YYYY-MM-DD HH:mm:ss')] = []
        }

        return periodHours
      },
      dateOptions () {
        let ret = []
        let start = this.$date()
        switch (this.period) {
          case 'day':
            for (let i = 0; i < 7; i++) {
              ret.push(start.clone().subtract(i, 'day'))
            }
            return ret
          case 'week':
            for (let i = 0; i < 3; i++) {
              ret.push(start.clone().subtract(i * 7, 'day'))
            }
            return ret
          case 'month':
            for (let i = 0; i < 3; i++) {
              ret.push(start.clone().subtract(i, 'month'))
            }
            return ret
        }
      },
      modeViewOptions () {
        return [
          {
            id: 0,
            name: this.$t('stats_screen.all')
          },
          {
            id: 1,
            name: this.$t('stats_screen.aggregated')
          }
        ]
      },
      isNextDayDisabled () {
        return this.isToday(this.getDateInstance(this.currentDate.clone().set({hour: 0, minute: 0, second: 0})))
      }
    },
    watch: {
      width: function (val) {
        this.updateSettings(this, val)
      },
      currentDate: async function (val) {
        if (!this.user) {
          return
        }

        this.getScreensWithHoursLoading = true

        let dtaFrom = val.clone().startOf('day').iso()
        let dtaTo = val.clone().endOf('day').iso()

        this.page = 1

        await this.$store.dispatch('stats/getScreensWithHours', {
          userId: this.user.id,
          'per-page': 150,
          filters: {
            dta_from: dtaFrom,
            dta_to: dtaTo,
            has_activity: +this.modeView || null
          }
        })

        this.getScreensWithHoursLoading = false
      },
      modeView: async function (val) {
        if (!this.user) {
          return
        }

        let dtaFrom = this.currentDate.clone().startOf('day').iso()
        let dtaTo = this.currentDate.clone().endOf('day').iso()

        this.$store.dispatch(+this.modeView ? 'stats/getScreensWithHours' : 'stats/getScreens', {
          userId: this.user.id,
          'per-page': val === 0 ? 25 : 150,
          filters: {
            dta_from: dtaFrom,
            dta_to: dtaTo,
            has_activity: +this.modeView || null
          }
        })
      },
      user: function (val) {
        if (!val) {
          return
        }

        let dtaFrom = this.currentDate.clone().startOf('day').iso()
        let dtaTo = this.currentDate.clone().endOf('day').iso()

        this.page = 1

        this.$store.dispatch('stats/getScreensWithHours', {
          userId: val.id,
          'per-page': 150,
          filters: {
            dta_from: dtaFrom,
            dta_to: dtaTo,
            has_activity: +this.modeView || null
          }
        })
      }
    },
    components: {
      InstantScreen,
      Btn,
      Checkbox,
      ProgressBar,
      ScreenshotsViewer,
      Avatar,
      ProtectedImage,
      RangeSlider,
      ContextMenu,
      Dropdown
    },
    mounted () {
      window.screenList = this
    },
    created () {
      const storedWidth = this.$store.state.userSettings.screens_list_zoom
      if (storedWidth) {
        this.width = storedWidth
      }
      this.currentDate = this.$date()
      this.modeView = this.modeViewScreens
    },
    beforeDestroy () {
      this.timer && clearTimeout(this.timer)
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';
  @import '~assets/css/mixins.less';
  @import '~assets/css/libs/slider.less';

  .c-screenshots-list {
    @padding-top: 25px;
    @padding-left: 15px;
    @item-width: 220px;
    padding: @padding-top @padding-left;

    .b-tool {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
      margin-left: -15px;
      margin-right: -15px;

      .b-left {
        display: flex;
        align-items: center;
      }

      .e-latest-screens {
        margin-left: 20px;
        color: @red-color;
      }

      .b-select-day {
        display: flex;
        align-items: center;

        .e-current {
          font-weight: bold;
          padding: 0 10px;
          text-transform: uppercase;
          font-size: 0.8em;
        }

        .b-prev, .b-next {
          padding: 10px 20px;
          font-weight: bold;
          user-select: none;

          &:hover {
            background: #ececec;
            cursor: pointer;
            text-decoration: @hover-color;
          }
        }

        .b-next.disabled {
          opacity: .5;

          &:hover {
            background: transparent;
            cursor: default;
          }
        }
      }

      .b-dropdown {
        margin-left: 15px;
      }

      .b-mode-view {
        font-weight: bold;
        text-transform: uppercase;
        user-select: none;
        height: max-content;

        &:hover {
          cursor: pointer;
          text-decoration: underline;
        }

        .e-toggle {
          padding: 3px;
          font-size: 0.9em;
        }

        .b-item {
          font-size: 1rem;
          text-transform: capitalize;
          padding: 10px 15px;
          font-weight: normal;

          &.m-selected {
            color: @red-color;
          }

          &:hover {
            background: #ececec;
            cursor: pointer;
            text-decoration: @hover-color;
          }
        }
      }

      .b-slider {
        display: inline-flex;
        align-items: center;
        height: 42px;

        .range-slider {
          margin: 0 8px;
        }

        i {
          .hover-mixin();
          padding: 5px;
        }
      }
    }

    .date-title {
      margin: 0 12px 20px;
      color: #ca6631;
      font-weight: bold;
      font-size: 1.2em;
      text-transform: capitalize;
    }
    .b-items {
      display: flex;
      flex-wrap: wrap;
      .c-instant-screen {
        display: flex;
        align-items: center;
      }
      .b-screenshot {
        margin: 0 5px;
        margin-bottom: 10px;
        position: relative;
        transition: 1s linear background, border-color;
        padding: 10px;
        background: #fff;
        border-radius: 10px;
        border: 1px solid #dedede;
        &.m-new {
          background: lightyellow;
        }
        .b-img-wrap {
          position: relative;
          img {
            cursor: pointer;
            display: block;
          }

          .b-no-activity {
            display: none;
          }
        }
        .b-info {
          padding-left: 2px;
          font-size: 0.9em;
          margin-bottom: 10px;
          .b-row {
            display: flex;
            align-items: center;
            width: 100%;
            .b-task {
              flex: 1;
              display: flex;
              align-items: center;
            }
            .b-user {
              .b-avatar {
                margin-right: 7px;
              }
            }
            .b-task {
              max-width: 100%;
              overflow-x: hidden;
              white-space: nowrap;
              .b-number {
                display: inline;
                margin-right: 5px;
                .e-number {
                  color: #000;
                  font-weight: bold;
                }
              }
              .e-name {
                overflow-x: hidden;
                text-overflow: ellipsis;
              }
              .e-cnt {
                color: #b2b2b2;
                flex: 1;
                text-align: right;
                display: none;
              }
            }

            &:last-child {
              justify-content: center;
            }
          }
        }
        .b-bottom {
          display: flex;
          margin-top: 10px;
          font-size: 0.9em;
          align-items: center;
          .c-progress-bar {
            flex: 1;
            margin-left: 12px;
            .e-bar {
              width: 100%;
              height: 4px;
              &, .e-fill {
                border-radius: 2px;
              }
            }
            &.m-green {
              .e-fill {
                background: @green-color;
              }
              .e-bar {
                background: rgba(0, 128, 0, 0.2);
              }
            }
            &.m-red {
              .e-fill {
                background: @red-color;
              }
              .e-bar {
                background: rgba(187, 56, 29, 0.2);
              }
            }
            &.m-yellow {
              .e-fill {
                background: #ffd800;
              }
              .e-bar {
                background: rgba(255, 216, 0, 0.21);
              }
            }
          }
        }
        .b-select {
          position: absolute;
          top: 5px;
          right: 5px;
          &:not(.selected) {
            display: none;
          }
          .b-checkbox {
            .b-icon {
              background: #fafafa;
              border-radius: 1px;
              margin: 0;
              i {
                display: flex;
                align-items: center;
                &:before {
                  margin: 0;
                  width: 1em;
                  height: 1em;
                  line-height: normal;
                }
              }
            }
          }
        }
        &:hover {
          .b-select {
            display: block
          }
          .e-cnt {
            display: block !important
          }
        }
      }
      }
    .b-selected-row {
      position: fixed;
      bottom: 0;
      width: @layout-width - @projects-bar-width;
      margin-left: -15px;
      display: flex;
      justify-content: center;
      pointer-events: none;
      z-index: 99999;
      .b-selected {
        display: flex;
        pointer-events: all;
        background: rgba(0, 0, 0, .8);
        color: #fff;
        padding: 10px 25px;
        align-items: center;
        .e-selected, .e-delete, .e-cancel {
          margin-right: 15px;
        }
        .e-delete {
          background: @red-color;
        }
        .e-cancel {
          color: #bbb;
          &:hover {
            text-decoration: underline;
            cursor: pointer;
          }
        }
      }
    }
    .b-screens-by-hour {
      border-left: 2px solid #c3c3c3;

      & > .b-time {
        margin: 0 15px 10px;
        font-size: .9em;
        margin-left: -12.5px;
        background: #f4f4f4;
        align-items: center;
        display: flex;

        .e-hours {
          margin: 0 5px;
        }

        .bu-circle-empty {
          color: #c3c3c3;
          font-size: 1.3em;
        }
      }

      .b-items {
        margin-left: 5px;
      }
    }
  }
</style>
