<template>

  <div class="c-suggestions" v-if="visible && items.length" v-key-escape="hide">
    <div class="b-suggest" :class="{selected: selectedIndex === i}" @click.stop="select(s)"
         v-for="s, i in computedItems"
         v-html="format(s.text)"></div>
  </div>
</template>

<script>
  import { escapeRegExp } from '~/utils/helpers'

  export default {
    name: 'suggestions',
    data () {
      return {
        'items': [],
        keyword: '',
        oldKeyword: '',
        visible: false,
        selectedIndex: -1
      }
    },
    props: {
      selectOnMove: {
        default: true
      }
    },
    methods: {
      hide () {
        this.visible = false
        if (this.selectedIndex > -1) {
          let item = this.items[this.selectedIndex]
          this.selectedIndex = -1
          if (this.oldKeyword) {
            this.keyword = this.oldKeyword
            this.oldKeyword = ''
            this.$emit('select', item, this.keyword)
          }
        }
        this.items = []
      },
      show (items = null, keyword = null) {
        this.visible = true
        if (items) {
          this.items = items
          this.selectedIndex = -1
          this.keyword = keyword
        }
      },
      getSelected () {
        if (!this.items || !this.items.length) {
          return null
        }
        return this.items[this.selectedIndex]
      },
      select (s) {
        this.oldKeyword = ''
        this.hide()
        this.$emit('select', s, this.keyword)
      },
      format (text) {
        return text.replace(new RegExp(escapeRegExp(this.keyword), 'i'), m => `<span class="e-keyword">${m}</span>`)
      },
      change (e) {
        if (!this.visible) {
          return
        }
        if (['ArrowUp', 'ArrowDown'].includes(e.key)) {
          if (e.key === 'ArrowUp' && this.selectedIndex > 0) {
            this.selectedIndex--
          } else if (e.key === 'ArrowDown') {
            if (this.selectedIndex === this.items.length - 1) {
              this.selectedIndex = 0
            } else {
              if (this.selectedIndex === -1) {
                this.oldKeyword = this.keyword
              }
              this.selectedIndex++
            }
          }
        }
        if (this.selectOnMove && this.items[this.selectedIndex]) {
          this.$emit('select', this.items[this.selectedIndex])
        }
      },
      enter (e) {
        if (this.visible && this.selectedIndex !== -1) {
          this.oldKeyword = ''
          if (!this.selectOnMove) {
            this.$emit('select', this.items[this.selectedIndex])
          }
          this.hide()
          e.stopPropagation()
          e.preventDefault()
        }
      }
    },
    computed: {
      computedItems () {
        if (this.items[0] && typeof this.items[0] !== 'object') {
          let ret = []
          this.items.forEach(el => {
            ret.push({text: el})
          })
          return ret
        }
        return this.items
      }
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/mixins.less';
  @import '~assets/css/variables.less';

  .c-suggestions {
    position: absolute;
    z-index: 10;
    .white-box();
    cursor: pointer;
    width: 100%;
    left: 0;
    max-height: 365px;
    overflow-y: auto;
    overflow-x: hidden;
    .b-suggest {
      padding: 0 25px;
      height: 36px;
      display: flex;
      align-items: center;
      .hover-mixin();
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-weight: normal;
      .e-keyword {
        font-weight: bold;
      }
      &.selected {
        background-color: @hover-light;
      }
    }
  }
</style>
