<template>
  <dropdown
    class="b-priority-dropdown"
    :options="$store.state.Issues.priorities"
    :label="label"
    :selected="selected"
    :onChange="onChange"
    :direction="direction">
    <template slot="label" slot-scope="{option}">
      <div class="b-wrapper">
        <priority-label :weight="option ? option.weight : defaultWeight"></priority-label>
      </div>
    </template>
    <template slot="options" slot-scope="{option, index}">
      <priority-label :weight="option.weight"></priority-label>
      <div class="e-hint">{{ priorityHints[index] }}</div>
    </template>
  </dropdown>
</template>

<script>
  import Dropdown from '~/components/Dropdown.vue'
  import PriorityLabel from '~/components/PriorityLabel.vue'
  import Listeners from '~/utils/mixins/listeners'

  export default {
    name: 'priority-dropdown',
    components: {
      Dropdown,
      PriorityLabel
    },
    props: [
      'label',
      'selected',
      'onChange',
      'direction'
    ],
    mixins: [Listeners],
    methods: {
    },
    computed: {
      defaultWeight () {
        return this.$store.state.Issues.priorities.length &&
          this.$store.state.Issues.priorities[Math.floor(this.$store.state.Issues.priorities.length / 2)]
          ? this.$store.state.Issues.priorities[Math.floor(this.$store.state.Issues.priorities.length / 2)].id : 0
      },
      priorityHints () {
        return this.$store.state.Issues.priorities.map((item, i, arr) => 'ALT+' + (arr.length - i))
      }
    },
    mounted () {
      this.addListener(
        document,
        'keydown',
        (e) => {
          const isArrowUp = ((e.key && e.key.toLowerCase() === 'arrowup') || e.keyCode === 38) && e.ctrlKey
          const isArrowDown = ((e.key && e.key.toLowerCase() === 'arrowdown') || e.keyCode === 40) && e.ctrlKey
          const isNumber = e.key && e.key.match(/^[1-9]+$/) && (e.ctrlKey || e.altKey)

          if (isArrowUp || isArrowDown || isNumber) {
            e.preventDefault()
            if (isArrowUp || isArrowDown) {
              const newPriority = this.issue.priority_weight + (isArrowUp ? 1 : -1)
              if (this.$store.state.Issues.priorities.find(el => el.id === newPriority)) {
                if (typeof this.onChange === 'function') {
                  this.onChange(newPriority.id, newPriority.id)
                }
              }
            } else if (isNumber) {
              const newPriority = this.$store.state.Issues.priorities[this.$store.state.Issues.priorities.length - +e.key]
              if (newPriority) {
                if (typeof this.onChange === 'function') {
                  this.onChange(newPriority.id, newPriority.id)
                }
              }
            }
          }
        }
      )
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/mixins.less';

  .b-priority-dropdown {
    display: flex;
    align-items: center;

    .dropdown-toggle {
      display: flex !important;
      height: @btn-height;
      min-width: 46px;
      .b-wrapper {
        display: flex;
        align-self: center;
      }
    }
    li {
      width: 100%;
      display: inline-flex;
      align-items: center;
      .e-hint {
        font-size: 0.7em;
        color: @grey-color;
        flex-grow: 1;
        text-align: right;
      }
      &.selected {
       background: @light-background;
      }
    }
  }
</style>
