<template>
  <LPopup>
    <h3>{{ locationName }}</h3>
    <ul>
      <li
        v-for="activity in activities"
        :key="activity.id">
        <router-link
          :to="`/activity/${activity.slug}/${activity.id}`"
          data-testid="popupLink">
          {{ activity.name }}
        </router-link>
      </li>
    </ul>
  </LPopup>
</template>

<script>
import { LPopup } from 'vue2-leaflet'

export default {
  components: {
    LPopup
  },
  props: {
    locationName: {
      type: String,
      required: true
    },
    activities: {
      type: Array,
      required: true
    }
  }
}
</script>

<style lang="sass" scoped>
.leaflet-container a
  color: #0f4d90

.leaflet-container a:hover
  color: #444

ul
  margin-left: .5rem
  font-family: "Open Sans"
  max-height: 150px
  overflow-y: auto
</style>
