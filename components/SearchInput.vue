<template>
  <div class="c-search-input">
    <simple-hint position="top" v-if="err" @hide="err = null">{{ err }}</simple-hint>
    <input ref="input" :value="getValue()" @input="input" @keydown="keydown"
           @keypress.enter.prevent.stop="submit" type="text" v-bind="inputProps" @keydown.esc="$emit('cancel')">
  </div>
</template>

<script>
  import SimpleHint from './SimpleHint.vue'
  import { SEARCH_MIN_LENGTH, isValidSearchKeyword } from '../utils/issues'

  export default {
    components: {SimpleHint},
    name: 'search-input',
    props: {
      delay: {
        default: 1000
      },
      minLength: {
        default: SEARCH_MIN_LENGTH
      },
      value: null,
      inputProps: {},
      wordsLength: {
        default: 0
      },
      wordsSeparator: {
        default: ' '
      }
    },
    data () {
      return {
        typingTimeout: null,
        err: null,
        mounted: false
      }
    },
    methods: {
      submit () {
        if (isValidSearchKeyword(this.$refs.input.value)) {
          this.$emit('submit', this.$refs.input.value)
          if (this.typingTimeout) {
            window.clearTimeout(this.typingTimeout)
            this.typingTimeout = null
          }
        } else {
          this.err = this.$tc('searchinput.minlength', this.minLength, {n: this.minLength})
        }
      },
      input (e) {
        this.$emit('input', e.target.value)
        this.err = null
        this.typingTimeout && window.clearTimeout(this.typingTimeout)
        this.typingTimeout = setTimeout(() => {
          this.$emit('submit', e.target.value)
        }, this.delay)
      },
      focus () {
        this.$refs.input.focus()
      },
      getValue () {
        return this.mounted ? this.$refs.input.value : this.value
      },
      keydown (e) {
        if (this.wordsLength) {
          const inputValue = e.target.value
          let wordsLength = inputValue.split(this.wordsSeparator).length
          if (e.key === this.wordsSeparator) {
            ++wordsLength
          }
          if (wordsLength > this.wordsLength) {
            e.preventDefault()
          }
        }
      }
    },
    watch: {
      value: function (val) {
        if (this.mounted) {
          this.$refs.input.value = val
        }
      }
    },
    mounted () {
      window.searchInput = this
      this.$nextTick(() => {
        this.mounted = true
      })
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';

  .c-search-input {
    input {
      height: @btn-height;
      border-radius: 14px;
      border: 1px solid #dedede;
      outline: none;
      padding: 0 14px;
      width: 100%;
    }
    .b-simple-hint.hidden {
      visibility: hidden;
    }
  }
</style>
