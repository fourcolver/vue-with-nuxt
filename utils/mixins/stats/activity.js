export default {
  methods: {
    setYear (val, period, startDate) {
      let startDay = this.startDay ? this.startDay.clone() : this.$date()
      let newDate
      if (startDay.year() !== val) {
        newDate = startDay.year(val)
      } else {
        newDate = startDay.add(1, period).year(val)
      }
      let createDate = startDate
      if (newDate.isBefore(createDate)) {
        newDate = createDate.clone().startOf(period)
      } else if (newDate.isAfter(this.$date().endOf('day'))) {
        newDate = this.$date().startOf(period)
      }
      this.startDay = newDate
    }
  }
}
