<template>
  <div class="b-checkbox" @click="click" :class="{disabled}">
    <label v-if="label || hasSlot">
      <div class="b-icon">
        <i class="bu bu-check" v-if="checked"></i>
        <i class="bu bu-minus-squared-alt" v-else-if="someChecked"></i>
        <i class="bu bu-check-empty" v-else></i>
      </div>
      <template v-if="label"> {{ label }}</template>
      <template v-if="hasSlot">
        <slot></slot>
      </template>
    </label>
    <div class="b-icon" v-else>
      <i class="bu bu-check" v-if="checked"></i>
      <i class="bu bu-minus-squared-alt" v-else-if="someChecked"></i>
      <i class="bu bu-check-empty" v-else></i>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'checkbox',
    model: {
      prop: 'model',
      event: 'change'
    },
    computed: {
      checked () {
        if (Array.isArray(this.model)) {
          if (!this.checkAll) {
            return this.model.includes(this.value)
          } else {
            return this.model.length && !this.value.find(el => !this.model.includes(el))
          }
        } else {
          return this.model
        }
      },
      hasSlot () {
        return !!this.$slots.default
      },
      someChecked () {
        return this.checkAll && this.model.length && this.model.length < this.value.length
      }
    },
    props: [
      'model',
      'label',
      'name',
      'value',
      'disabled',
      'checkAll'
    ],
    mounted () {
    },
    methods: {
      click (e) {
        if (this.disabled) {
          return
        }
        if (Array.isArray(this.model)) {
          if (!this.checkAll) {
            let value = this.model.slice()
            if (this.checked) {
              value = value.filter(item => item !== this.value)
            } else {
              value.push(this.value)
            }
            this.$emit('change', value)
          } else {
            this.$emit('change', this.checked || this.someChecked ? [] : this.value)
          }
        } else {
          this.$emit('change', this.checked ? false : this.value)
        }
      }
    }
  }
</script>

<style lang="less" type="text/less">
  .b-checkbox {
    display: inline-block;
    &.disabled{
      opacity: .5;
    }
    .b-icon {
      display: inline-block;
      font-size: 1em;
      width: 1em;
      margin-right: 10px;
      cursor: pointer;
      position: relative;
      .bu-check {
        margin-left: 1px;
      }
    }
    label {
      cursor: pointer;
    }
  }
</style>
