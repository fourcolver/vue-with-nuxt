<template>
  <div class="c-filter-button" v-if="isButtonVisible"
       :class="{'m-invalid' : $store.state.Issues.invalidFilters.includes(filter.key)}">
    <context-menu ref="menu" trigger="click" :autoClose="!filter.component" :class="{'m-cancel-event': isCancelEvent}"
                  :disabled="!isDropVisible" :items-classes="{ 'b-items--scrollable' : filter.options.length > maxItems }" :items-style="itemsStyle">
      <div class="b-label" slot="content">
        <div class="b-icon">
          <i :class="filter.icon" v-if="filter.icon"></i>
        </div>
        <div class="b-text" v-if="selectedItem">
          <template v-if="selectedItem.component">
            <component :is="selectedItem.component.name"
                       v-bind="selectedItem.component.props"></component>
          </template>
          <template v-else>
            <div class="e-truncated">{{ selectedItem.value }}</div>
          </template>
        </div>
      </div>
      <div slot="items" class="b-items">
        <template v-if="filterComponent">
          <no-ssr>
            <component :is="filterComponent.name" v-bind="filterComponent.props"
                       v-on="filterComponent.events"></component>
          </no-ssr>
        </template>
        <template v-else>
          <div class="b-item" v-for="option in filter.options" :key="option.key">
            <a class="e-toggle-link" @click="change(option.key)" v-if="!option.hidden">
              <template v-if="option.component">
                <component :is="option.component.name" v-bind="option.component.props"></component>
              </template>
              <template v-else>
                {{ option.value }}
              </template>
            </a>
          </DIV>
        </template>
      </div>
    </context-menu>

    <div class="b-close" @click="cancel" v-if="isCancelEvent">
      <i class="bu-cancel"></i>
    </div>
  </div>
</template>

<script>
  import ContextMenu from '~/components/ContextMenu.vue'
  import PriorityLabel from '~/components/PriorityLabel.vue'

  export default {
    components: {
      ContextMenu,
      PriorityLabel,
      'date-picker': () => import('~/components/DatePicker.vue')
    },
    name: 'filter-button',
    data () {
      return {
        maxItems: 9,
        itemHeight: 28
      }
    },
    props: {
      filter: null
    },
    methods: {
      change (value) {
        // this.selected = value
        // this.$emit('change', value)
        if (this.selectedItem.key !== value) {
          this.filter.setValue(value)
        }
      },
      cancel (e) {
        if (!this.isCancelEvent) return false
        // this.$emit('cancel', true)
        this.filter.cancel()
      }
    },
    computed: {
      selectedItem () {
        let item
        if (this.filter.options.length) {
          item = this.filter.options.find(el => this.filter.value === el.key)
          if (!item && this.filter.options.length) {
            item = this.filter.options[0]
          }
        } else if (this.filter.valueFormatter) {
          item = {key: this.filter.value, value: this.filter.valueFormatter(this.filter.value)}
        }
        return item
      },
      isDropVisible () {
        return this.filter && (this.filter.component || this.filter.options.some(el => !el.hidden))
      },
      isButtonVisible () {
        const visibleOptions = this.filter.options.filter(el => !el.hidden && el.key !== null)
        return visibleOptions.length || this.filter.valueFormatter
      },
      isCancelEvent () {
        const item = this.selectedItem
        if (!item || typeof item.cancelEvent === 'undefined') {
          return this.filter.cancelEvent
        }
        return item.cancelEvent
      },
      filterComponent () {
        if (!this.filter) {
          return null
        }
        if (this.filter.component) {
          return this.filter.component instanceof Function ? this.filter.component() : this.filter.component
        }
      },
      itemsStyle () {
        return {
          maxHeight: `${this.itemHeight * this.maxItems}px`
        }
      }
    },
    mounted () {
      if (this.filter.component) {
        this.filter.parentComponent = this
      }
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';
  @import '~assets/css/mixins.less';

  .c-filter-button {
    @height: 28px;
    @width: 110px;
    @w-icon: 30px;
    border: solid 1px rgb(222, 222, 222);
    background-color: rgb(255, 255, 255);
    border-radius: @height / 2;
    font-size: 0.9em;
    color: #4e4e4e;
    height: @height;
    display: flex;
    min-width: @width;
    width: @width;
    align-items: center;

    &.m-invalid {
      .b-label {
        color: @red-color;
      }
    }

    .b-context-menu {
      width: 100%;
      &.m-cancel-event {
        width: @width - @w-icon;
        .b-menu-content {
          .b-label {
            border-top-right-radius: 0;
            border-bottom-right-radius: 0;
            padding-right: 0;
          }
        }
      }

      .b-menu-content {
        display: flex;
        align-items: center;
        .b-label {
          width: 100%;
          display: flex;
          align-items: center;
          .hover-mixin(@hover-color);
          height: @height - 2;
          border-radius: @height / 2;
          padding-right: @w-icon;
          .b-icon {
            flex: 0 0 @w-icon;
            text-align: center;
            i {
              position: relative;
              top: 1px;
            }
          }
          .b-text {
            flex: 1;
            /*width: auto;*/
            min-width: 0;
            text-align: left;

            display: flex !important;
            align-items: center;
            .e-truncated{
              .str-truncate;
            }
            .c-priority-label {

            }
          }
        }
      }
      .b-menu-items {
        // min-width: 100%;
        min-width: @width ;
        border-radius: 3px;
        max-height: 350px;
        max-width: 350px;
        margin-top: 1px;
        .b-item {
          height: @height;
          display: flex !important;
          overflow: hidden;
          align-items: center;
          .e-toggle-link {
            padding: 0 15px !important;
            white-space: nowrap;
            text-overflow: ellipsis;
            width: 100%;
            height: @height;
            display: flex;
            align-items: center;
            overflow: hidden;
          }
        }
      }
    }

    .b-items--scrollable {
      overflow-y: auto;
    }

    .b-close {
      flex: 0 0 @w-icon - 2;
      text-align: center;
      justify-content: center;
      display: flex;
      align-items: center;
      .hover-mixin(@hover-color);
      height: @height - 2;
      border-top-right-radius: @height / 2;
      border-bottom-right-radius: @height / 2;
      i {
        display: none;
      }
      &:hover {
        i {
          display: block;
        }
      }
    }
  }
</style>
