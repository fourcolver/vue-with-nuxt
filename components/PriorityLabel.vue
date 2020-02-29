<template>
  <div class="c-priority-label" v-if="priorities.length && weight"
       :class="{'m-high': isHigh}">
    <img height="9" :src=" '/img/priorities/' + dotsCount  + '.svg'"/>
  </div>
</template>

<script>
  import { mapState } from 'vuex'

  export default {
    name: 'priority-label',
    props: ['weight'],
    data () {
      return {}
    },
    methods: {},
    created () {
      if (!this.$store.state.Issues.priorities.length) {
        this.$store.dispatch('Issues/updatePriorities')
      }
    },
    computed: {
      ...mapState('Issues', ['priorities']),
      cntFilled () {
        return this.priorities.filter(el => this.weight >= el.weight).length
      },
      row1 () {
        let ret = []
        for (let i = 0; i < Math.floor(this.dotsCount / 2); i++) {
          ret.push(i)
        }
        return ret
      },
      row2 () {
        let ret = []
        for (let i = 0; i < Math.ceil(this.dotsCount / 2); i++) {
          ret.push(i)
        }
        return ret
      },
      dotsCount () {
        return this.priorities.filter(el => this.weight >= el.weight).length
      },
      isHigh () {
        const el = this.priorities.find(el => +el.weight === +this.weight)
        return el && this.priorities.indexOf(el) <= 1
      }
    },
    mounted () {
      window.issueTop = this
    }
  }
</script>

<style lang="less" type="text/less">
  @import '~assets/css/variables.less';

  .c-priority-label {
    display: flex;
    align-items: center;
    max-width: 40px;
  }
</style>
