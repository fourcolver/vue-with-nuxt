<template>
  <div class="b-pagination" v-if="headers && pageCount > 1">

    <ul v-if="template === '10_buttons' ">
      <li v-if="pages[0] != 1">
        <nuxt-link :to="{query: getQuery(1)}"><i class="bu-angle-double-left"></i></nuxt-link>
      </li>
      <li v-for="page in pages">
        <nuxt-link :to="{query: getQuery(page)}" :class="{'active':(page == currentPage)}">{{page}}</nuxt-link>
      </li>
      <li v-if="pages[pages.length-1] != pageCount">
        <nuxt-link :to="{query: getQuery(pageCount)}"><i class="bu-angle-double-right"></i></nuxt-link>
      </li>
    </ul>

    <div class="m-2-buttons" v-if="template === '2_buttons'">
      <div class="b-info">
        {{ currentRange.from }} - {{ currentRange.to }} of {{ totalCount }}
      </div>
      <div class="b-buttons">
        <div @click="goToPage(currentPage - 1)" class="e-button" :class="{disabled: currentPage === 1}">&lt;</div>
        <div @click="goToPage(currentPage + 1)" class="e-button"
             :class="{disabled: currentPage === pageCount}">&gt;
        </div>
      </div>
    </div>

  </div>
</template>

<script>
  export default {
    name: 'pagination',
    props: {
      'headers': {},
      'displayPages': {
        default: 5 // should be odd
      },
      'template': {
        default: '10_buttons'
      },
      pageVar: {
        default: 'page'
      }
    },
    computed: {
      currentPage () {
        return +this.headers['x-pagination-current-page'] || 1
      },
      pageCount () {
        return +this.headers['x-pagination-page-count'] || null
      },
      perPage () {
        return +this.headers['x-pagination-per-page'] || null
      },
      totalCount () {
        return +this.headers['x-pagination-total-count'] || null
      },
      currentRange () {
        let from = 0
        let to = 0
        if (this.totalCount > 0 && this.perPage > 0) {
          from = +this.perPage * (this.currentPage - 1) + 1
          to = (from + this.perPage) - 1
          if (to > this.totalCount) {
            to = this.totalCount
          }
        }
        return {from, to}
      },
      pages () {
        let cnt = parseInt(this.displayPages) || 5
        let numbers = []
        let start = this.currentPage - (cnt - 1) / 2
        if (start < 1) {
          start = 1
        }
        let end = start + cnt - 1
        if (end > this.pageCount) {
          end = this.pageCount
          start = end - cnt + 1
          if (start < 1) {
            start = 1
          }
        }
        for (let i = start; i <= end; i++) {
          numbers.push(i)
        }
        return numbers
      }
    },
    methods: {
      getQuery (page) {
        return {...this.$route.query, [this.pageVar]: page}
      },
      next () {
        this.goToPage(this.currentPage + 1)
      },
      prev () {
        this.goToPage(this.currentPage - 1)
      },
      goToPage (page) {
        if (page < 1 || page > this.pageCount) {
          return false
        }
        this.$router.push({query: this.getQuery(page)})
      }
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';

  .b-pagination {
    text-align: center;
    ul, li {
      display: inline;
      margin: 0;
      padding: 0;
    }
    li {
      list-style-type: none;
      margin: 0 2px;
      a {
        background-color: #fff;
        border: 1px solid #ddd;
        position: relative;
        float: left;
        padding: 6px 0;
        text-align: center;
        margin-left: -1px;
        color: #636363;
        width: 35px;
        &.active, &:hover {
          text-decoration: none;
          background: rgba(99, 99, 99, 0.7);
          color: #fff;
          border-color: transparent;
        }
      }
    }
    .m-2-buttons {
      display: flex;
      justify-content: flex-end;
      height: 30px;
      > div {
        display: flex;
        height: 100%;
        align-items: center;
      }
      .b-info {
        margin-right: 15px;
        font-size: .7em;
        color: #808080;
        font-weight: normal;
      }
      .b-buttons {
        display: flex;
        .e-button {
          height: 100%;
          border: 1px solid #e3e3e3;
          @radius: 4px;
          min-width: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          background: #fff;
          font-size: 1.3em;
          &.disabled {
            opacity: .5;
            cursor: not-allowed !important;
          }
          &:hover:not(.disabled ) {
            cursor: pointer;
            background: @hover-light;
          }
          &:first-child {
            border-top-left-radius: @radius;
            border-bottom-left-radius: @radius;
          }
          &:last-child {
            border-top-right-radius: @radius;
            border-bottom-right-radius: @radius;
            border-left: none;
          }
        }
      }
    }
  }
</style>
