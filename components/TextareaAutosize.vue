<template>
  <div ref="wrapper" v-bar>
    <textarea
      @focus="resize"
      v-model="val"
      :maxlength="maxLength"
      :placeholder="placeholder"
      :rows="rows"
      :style="computedStyles"
      ref="textarea"
    ></textarea>
  </div>
</template>
<script>
  export default {
    name: 'textarea-autosize',

    created () {
      this.updateVal() // fill val with initial value passed via the same name prop
    },

    mounted () {
      this.resize() // perform initial height adjustment
    },

    props: {
      /*
       * Property to accept value from parent
       */
      value: {
        type: [String, Number],
        required: false,
        'default': ''
      },

      /*
       * Allow to enable/disable auto resizing dynamically
       */
      autosize: {
        type: Boolean,
        required: false,
        'default': true
      },

      /*
       * Min textarea height
       */
      minHeight: {
        type: [Number],
        required: false,
        'default': null
      },

      /*
       * Max textarea height
       */
      maxHeight: {
        type: [Number],
        required: false,
        'default': null
      },

      /*
       * Max textarea length
       */
      maxLength: {
        type: [Number],
        required: false,
        'default': null
      },

      placeholder: {
        type: String,
        required: false,
        'default': ''
      },

      rows: {
        type: [String, Number],
        required: false,
        default: 1
      }
    },

    data () {
      return {
        // data property for v-model binding with real textarea tag
        val: null,
        // works when content height becomes more then value of the maxHeight property
        maxHeightScroll: false
      }
    },

    computed: {
      /*
       */
      computedStyles () {
        let objStyles = {}

        if (this.autosize) {
          objStyles.resize = 'none'
          /* if (!this.maxHeightScroll) {
            objStyles.overflow = 'hidden'
          } */
        }

        return objStyles
      }
    },

    methods: {
      /*
       * Update local val with prop value
       */
      updateVal () {
        this.val = this.value
      },

      focus () {
        this.$refs.textarea.focus()
      },

      clear () {
        this.val = ''
      },

      /*
       * Auto resize textarea by height
       */
      getOverflows () {
        const arr = []
        let el = this.$refs.textarea
        while (el && el.parentNode && el.parentNode instanceof Element) {
          if (el.parentNode.scrollTop) {
            arr.push({
              node: el.parentNode,
              scrollTop: el.parentNode.scrollTop
            })
          }
          el = el.parentNode
        }
        return arr
      },
      resize: function () {
        let overflows = this.getOverflows()
        this.$el.style.height = 'auto'
        let contentHeight = this.$refs.textarea.scrollHeight + 1
        if (this.minHeight) {
          contentHeight = contentHeight < this.minHeight ? this.minHeight : contentHeight
        }
        if (this.maxHeight) {
          if (contentHeight > this.maxHeight) {
            contentHeight = this.maxHeight
            this.maxHeightScroll = true
          } else {
            this.maxHeightScroll = false
          }
        }
        this.$el.style.height = contentHeight + 'px'
        this.$emit('resize', contentHeight)

        // restore scroll positions to avoid scroll jumping
        overflows.forEach(el => {
          el.node.scrollTop = el.scrollTop
        })
        this.$vuebar.refreshScrollbar(this.$refs.wrapper, {})
        return this
      }
    },

    watch: {
      /*
       * Update val from prop when changed in parent
       */
      value () {
        this.updateVal()
      },

      /*
       * Emit input event as in https://vuejs.org/v2/guide/components.html#Form-Input-Components-using-Custom-Events
       */
      val (val) {
        this.$nextTick(() => {
          this.resize()
        })
        this.$emit('input', val)
      }
    }
  }
</script>
