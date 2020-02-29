<template>
  <div :class="{'b-dropdown':true, 'b-dropdown--scrollable':scrollable, 'direction-up':isDirectionUp}" :data-uid="_uid" @click="activate($event)" v-click-outside.tooltip="hide" v-key-escape="hide">
    <a class="dropdown-toggle">
      <slot name="label" :option="getSelectedOption()">
        {{ getSelectedName() }}
      </slot>
    </a>
    <ul class="dropdown-menu" v-show="!isMenuHidden">
      <li v-show="empty && _selected !== null" @click="select(null)">{{ empty }}</li>
      <template v-for="(option, index) in options">
        <li @click="select(option.id, option.name, option.is_active)" :class="{selected: option.id == _selected, disabled: option.is_active == false}"
            v-if="option.is_active == false && disabledTooltipContent.length"
            v-tooltip="{ content: disabledTooltipContent, placement: 'right', hideOnTargetClick: false, popperOptions: { modifiers: { preventOverflow: { escapeWithReference: true } } } }"
            >
          <slot name="options" :option="option" :index="index">
            {{ option.name }}
          </slot>
        </li>
        <li @click="select(option.id, option.name, option.is_active)" :class="{selected: option.id == _selected, disabled: option.is_active == false}"
          v-else>
          <slot name="options" :option="option" :index="index">
            {{ option.name }}
          </slot>
        </li>
      </template>
    </ul>
    <input type="hidden" :value="_selected" :name="name">
  </div>
</template>

<script>
  export default {
    name: 'dropdown',
    props: {
      name: {
      },
      label: {
      },
      selected: {
      },
      options: {
        type: Array
      },
      onChange: {
        type: Function
      },
      empty: {
      },
      direction: {
      },
      scrollable: {
        type: Boolean,
        default: false
      },
      disabledTooltipContent: {
        type: String,
        default: ''
      }
    },
    data: function () {
      return {
        isMenuHidden: true,
        isDirectionUp: false
      }
    },
    methods: {
      getSelectedOption () {
        return this.options.find(el => el.id === this._selected)
      },
      getSelectedName () {
        let selectedOption = this.getSelectedOption()
        if (selectedOption) {
          return selectedOption.name
        }
        return (this.label || this.options[0].name)
      },
      select (val, name, isActive = true) {
        if (isActive) {
          this._selected = val
          if (typeof this.onChange === 'function') {
            this.onChange(val, name)
          }
        }
      },
      hide (event) {
        this.isMenuHidden = true
      },
      activate (e) {
        if (e.target && e.target.classList && e.target.classList.contains('disabled')) {
          return
        }
        this.isMenuHidden = !this.isMenuHidden
        if (!this.isMenuHidden) {
          this.$nextTick(function () {
            this.setDirection()
            let menu = document.querySelector('.b-dropdown[data-uid="' + this._uid + '"] > .dropdown-menu')
            menu && (menu.scrollTop = 0)
          })
        }
      },
      setDirection () {
        if (this.direction === 'auto') {
          let container = document.querySelector('.b-dropdown[data-uid="' + this._uid + '"]')
          let menu = document.querySelector('.b-dropdown[data-uid="' + this._uid + '"] > .dropdown-menu')
          let top = container.getBoundingClientRect().bottom
          let height = menu.offsetHeight
          if (container && menu) {
            this.isDirectionUp = top + height > window.innerHeight
          }
        } else {
          this.isDirectionUp = this.direction === 'up'
        }
      }
    },
    computed: {
      _selected: {
        get () {
          return this.selected
        },
        set () {
          return true
        }
      }
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/mixins.less';

  .b-dropdown {
    position: relative;
    &:after {
      .after-clearfix();
    }
    .dropdown-toggle, .dropdown-menu li {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .dropdown-toggle {
      text-transform: uppercase;
      font-size: .9em;
      font-weight: bold;
      cursor: pointer;
      max-width: 200px;
      &:hover {
        text-decoration: underline;
      }
    }
    .dropdown-menu {
      max-width: 350px;
    }
    &.light-hover {
      .dropdown-toggle {
        .hover-mixin(true);
        padding: 0 8px;
        display: inline-block;
      }
    }
    &.dark-hover {
      .dropdown-toggle {
        .hover-mixin(false);
        padding: 0 8px;
        display: inline-block;
      }
    }
    .dropdown-menu {
      position: absolute;
      top: 100%;
      bottom: auto;
      left: 0;
      z-index: 1000;
      float: left;
      min-width: 160px;
      padding: 5px 0;
      margin: 2px 0 0;
      font-size: 14px;
      text-align: left;
      .dropdown-mixin();
      li {
        &.selected {
          color: @red-color;
        }
        &.disabled {
          color: @grey-color;
        }
      }
    }
    &.direction-up {
      .dropdown-menu {
        margin-bottom: 8px;
        bottom: 100%;
        left: -5px;
        top: auto;
      }
    }
    &.m-blue {
      .dropdown-toggle {
        text-transform: none;
        color: @basic-blue;
        font-size: 1em;
        font-weight: normal;
      }
    }
  }
</style>
