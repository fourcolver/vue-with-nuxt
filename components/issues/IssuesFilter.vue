<template>
  <div class="c-issues-filter">
    <div class="b-filters">

      <template v-for="key in defaultFilters">
         <filter-button
           v-for="filter, index in filters[key]"
           :key="key + index"
           :filter="filter"
           :ref=" 'filter_button_' + filter.key"
         ></filter-button>
      </template>

      <template v-for="key in currentFilters" v-if="!defaultFilters.includes(key)">
        <filter-button
          v-for="filter, index in filters[key]"
          :key="key + index"
          :filter="filter"
          :ref=" 'filter_button_' + filter.key"
        ></filter-button>
      </template>

      <div class="b-add-button" v-if="availableFilters.length">
        <context-menu trigger="click" :autoClose="true">
          <div slot="content" class="b-button">
            <i class="bu-plus"></i>
          </div>
          <div slot="items" class="b-items">
            <div class="b-item" v-for="key in availableFilters" :key="key">
              <a class="e-toggle-link" @click="addFilter(filters[key][0])">
                <i :class="filters[key][0].icon" v-if="filters[key][0].icon"></i>
                {{ filters[key][0].title }}
              </a>
            </div>
          </div>
        </context-menu>
      </div>
    </div>
  </div>
</template>

<script>
  import FilterButton from '~/components/issues/FilterButton.vue'
  import ContextMenu from '~/components/ContextMenu.vue'

  export default {
    components: {
      FilterButton,
      ContextMenu
    },
    name: 'issues-filter',
    data () {
      return {
        filters: {},
        defaultFilters: [
          'is_open',
          'id_category',
          'is_bug',
          'priority_weight'
        ]
      }
    },
    computed: {
      currentFilters () {
        return this.$store.state.Issues.filters.map(el => Object.keys(el)[0])
      },
      availableFilters () {
        return Object.keys(this.filters).filter(el => !this.currentFilters.includes(el) && !this.defaultFilters.includes(el))
      }
    },
    methods: {
      addFilter (filter) {
        this.$store.commit('Issues/ADD_FILTER', {[filter.key]: filter.defaultValue || null})
        this.$store.dispatch('updateUserSettings', { issues_filters: this.$store.state.Issues.filters })
        if (filter.defaultValue !== null) {
          this.$store.dispatch('Issues/fetch')
        }
      }
    },
    created () {
      this.$issuesFilters().forEach(f => {
        if (f.showInDropdown) {
          if (!this.filters[f.key]) this.filters[f.key] = []
          this.filters[f.key].push(f)
        }
      })
    },
    mounted () {
      window.issuesFilters = this
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';
  @import '~assets/css/mixins.less';

  .c-issues-filter {
    @b-margin: 3px;
    position: relative;
    .b-filters {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      .c-filter-button, .b-add-button {
        margin: @b-margin;
      }

      .b-add-button {
        font-size: 0.9em;
        @height: 28px;
        color: #4e4e4e;
        .b-button {
          width: @height;
          height: @height;
          border-radius: @height / 2;
          border: solid 1px rgb(222, 222, 222);
          background-color: rgb(255, 255, 255);
          .hover-mixin(@hover-color);
          text-align: center;
          line-height: @height - 2;
        }
        .b-menu-items {
          min-width: 110px ;
          border-radius: 3px;
          /*margin-top: 1px;*/
          .e-toggle-link {
            padding: 0 18px 0 12px !important;
            height: @height;
            display: flex !important;
            align-items: center;
            i {
              margin-right: 10px;
            }
          }
        }
      }
    }
  }
</style>
