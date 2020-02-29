<template>
  <div class="c-quwi-datepicker">
    <div class="b-view m-day js-day-view" v-show="view === 'day'">
      <div class="b-month m-selector">
        <div class="b-left" @click="currentDate = currentDate.subtract(1, 'month').clone()">
          <span>&lt;</span>
        </div>
        <div class="b-center">
          <div class="e-month" @click="openMonth">{{ currentDate.format('MMM YYYY') }}</div>
        </div>
        <div class="b-right" @click="currentDate = currentDate.add(1, 'month').clone()">
          <span>&gt;</span>
        </div>
      </div>
      <div class="b-day-names">
        <div class="e-name" v-for="name in weekDays">{{ name }}</div>
      </div>
      <div class="b-days">
        <div class="e-day m-empty" v-for="day in currentDate.clone().startOf('month').isoWeekday() - 1"></div>
        <div class="e-day" @click="isDisabled(day) ? null : select(day)"
             :class="{'m-selected': selectedDate && day.isSame(selectedDate, 'd'),
             'm-today':  today && day.isSame(today, 'd'), 'm-disabled': isDisabled(day)}"
             v-for="day in days">
          {{ day.format('D') }}
        </div>
      </div>
    </div>
    <div class="b-view m-month js-month-view" v-show="view === 'month'">
      <div class="b-year m-selector">
        <div class="b-left" @click="currentDate = currentDate.subtract(1, 'year').clone()">
          <span>&lt;</span>
        </div>
        <div class="b-center no-hover">
          <div class="e-year">{{ currentDate.format('YYYY') }}</div>
        </div>
        <div class="b-right" @click="currentDate = currentDate.add(1, 'year').clone()">
          <span>&gt;</span>
        </div>
      </div>
      <div class="b-months">
        <div class="e-month" @click="currentDate = m; view = 'day' " v-for="m in months">{{ m.format('MMMM') }}</div>
      </div>
    </div>
  </div>
</template>

<script>
  import moment from 'moment'

  export default {
    name: 'quwi-datepicker',
    data () {
      return {
        currentDate: null,
        selectedDate: null,
        view: 'day'
      }
    },
    props: {
      date: null,
      today: null,
      locale: {
        default: 'en'
      },
      disabled: null
    },
    methods: {
      select (day) {
        this.$emit('selected', day)
        this.currentDate = day
        this.selectedDate = this.currentDate.clone()
      },
      openMonth () {
        this.view = 'month'
        const day = this.$el.querySelector('.js-day-view')
        if (day) {
          const height = day.getBoundingClientRect().height
          this.$nextTick(() => {
            const month = this.$el.querySelector('.js-month-view')
            if (month) {
              month.style.height = height + 'px'
            }
          })
        }
      },
      isDisabled (d) {
        if (!this.disabled) {
          return false
        }
        if (typeof this.disabled === 'function') {
          return this.disabled(d)
        }
      }
    },
    computed: {
      days () {
        let ret = []
        const start = this.currentDate.clone().startOf('month')
        for (let i = 0; i < this.currentDate.daysInMonth(); i++) {
          ret.push(start.clone().add(i, 'd'))
        }
        return ret
      },
      weekDays () {
        moment.locale(this.locale)
        let days = moment.weekdaysShort()
        days.push(days.shift())
        return days
      },
      months () {
        let ret = []
        let start = this.currentDate.clone().startOf('year')
        for (let i = 0; i < 12; i++) {
          ret.push(start.clone().add(i, 'months'))
        }
        return ret
      }
    },
    created () {
      if (this.date) {
        this.selectedDate = this.date
        this.currentDate = this.selectedDate.clone()
      } else if (this.today) {
        this.currentDate = this.today.clone()
      }
    }
  }
</script>

<style lang="less" type="text/less">
  .c-quwi-datepicker {
    @width: 210px;
    @padding: 5px;
    @hover-color: #e0e0e0;
    font-size: .9em;
    .hover-mixin() {
      cursor: pointer;
      text-decoration: none;
      &:hover {
        background: @hover-color;
      }
    }

    background: #fff;
    padding: @padding;
    width: @width + @padding * 2;
    @day-width: @width / 7;

    .m-selector {
      display: flex;
      height: @day-width;
      align-items: center;
      > div {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        &:not(.no-hover) {
          .hover-mixin();
        }
      }
      > .b-left, .b-right {
        width: @day-width;
      }
      > .b-center {
        flex: 1;
        .e-month {
          text-transform: capitalize;
        }
      }
    }
    .b-view.m-day {
      .b-day-names {
        display: flex;
        height: @day-width;
        .e-name {
          width: @day-width;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: .75em;
          color: #777;
          text-transform: capitalize;
        }
      }
      .b-days {
        display: flex;
        flex-wrap: wrap;
        .e-day {
          width: @day-width;
          height: @day-width;
          display: flex;
          justify-content: center;
          align-items: center;
          &:not(.m-empty):not(.m-disabled) {
            .hover-mixin();
          }
          border-radius: 50%;
          &.m-selected {
            background: @hover-color;
          }
          &.m-today:not(.m-selected) {
            background: rgba(57, 83, 120, 0.15);
          }
          &.m-disabled {
            opacity: .5;
          }
        }
      }
    }
    .b-view.m-month {
      .b-months {
        display: flex;
        flex-wrap: wrap;
        .e-month {
          width: 33.3%;
          height: @day-width;
          display: flex;
          align-items: center;
          justify-content: center;
          .hover-mixin();
          text-transform: capitalize;
        }
      }
    }
  }
</style>