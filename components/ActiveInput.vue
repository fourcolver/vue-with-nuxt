<template>
  <div class="c-active-input" :class="{'has-error': error}">
    <div class="b-input-group">
      <slot name="before"></slot>
      <div class="b-input">
        <div ref="label" v-if="!error" v-tooltip="labelTooltip" class="e-placeholder m-top-text"
             v-show="options.placeholder && (value || value === 0)">
          {{ options.placeholder}}
        </div>
        <div ref="label" v-tooltip="labelTooltip" class="e-error m-top-text" v-else>{{ error }}</div>
        <component :is="tag" @focus="hideError" v-bind="options" :value="value"
                   @input="hideError; $emit('input', $event.target.value)" @keydown="keydown" v-on="events"></component>
      </div>
      <slot name="after"></slot>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'active-input',
    props: {
      'name': null,
      'value': null,
      'error': null,
      'pattern': null,
      'tag': {
        default: 'input'
      },
      'options': {
        type: Object,
        'default': () => {}
      },
      events: {
        type: Object,
        'default': () => {}
      }
    },
    data () {
      return {
        labelTooltip: null
      }
    },
    methods: {
      hideError () {
        this.$emit('hideError', this.name)
        this.$parent.firstErrors[this.name] = ''
      },
      setLabelTooltip () {
        let label = this.$refs.label
        if (!label || window.getComputedStyle(label).display === 'none') {
          this.labelTooltip = false
          return
        }
        const isTruncated = label.scrollWidth > label.clientWidth
        if (!isTruncated) {
          this.labelTooltip = false
        } else {
          this.labelTooltip = this.error || this.options.placeholder
        }
      },
      keydown (e) {
        if (this.pattern && !['backspace', 'enter', 'delete', 'arrowleft', 'arrowright', 'shift', 'escape'].includes(e.key.toLowerCase()) && !(new RegExp(this.pattern)).test(e.key)) {
          e.preventDefault()
        }
      }
    },
    mounted () {
      this.setLabelTooltip()
    },
    watch: {
      error: function () {
        this.$nextTick(() => this.setLabelTooltip())
      },
      'options.placeholder': function () {
        this.$nextTick(() => this.setLabelTooltip())
      }
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';

  .c-active-input {
    @error-color: #d40000;
    .b-input-group {
      .b-input {
        position: relative;
        width: 100%;
        .m-top-text {
          margin: 0 10px;
          max-width: calc(100% ~'-' 20px);
          position: absolute;
          top: -0.55em;
          background: #fff;
          display: block;
          float: left;
          padding: 0 3px;
          white-space: nowrap;
          text-overflow: ellipsis;
          overflow: hidden;
          &.e-placeholder {
            color: #4B84DA;
          }
          &.e-error {
            color: @error-color;
          }
        }
      }
    }
    &.has-error {
      input, textarea {
        border-color: @error-color !important;
      }
    }
  }
</style>
