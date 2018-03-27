<template>
  <main>
    <aside class="list">
      <h2>{{ name }}</h2>

      <div v-if="fullAddress">
        <h4>Location</h4>
        <p>{{ fullAddress }}</p>
        <p><a :href="directionsUrl" class="external">Get directions</a></p>
      </div>

      <div v-if="phone">
        <h4>Contact</h4>
        <a :href="phoneUrl">{{ phone }}</a>
      </div>

      <div v-if="description">
        <h4>About this location</h4>
        <p>{{ description }}</p>
      </div>
    </aside>
    <section class="map">
      <SiteMap :location-details="locationDetails"/>
    </section>
  </main>
</template>

<script>
import { mapState, mapActions, mapMutations } from 'vuex'
import SiteMap from '~/components/SiteMap'
import { concatAddress } from '~/util'

export default {
  props: {
    id: String
  },
  components: {
    SiteMap
  },
  computed: {
    ...mapState({
      locationDetails: (state) => state.locationDetails,
      name: (state) => state.locationDetails.name,
      description: (state) => state.locationDetails.description,
      fullAddress: (state) => concatAddress(state.locationDetails.address),
      phone: (state) => state.locationDetails.phone
    }),
    directionsUrl () {
      return `https://www.google.com/maps/dir/?api=1&query=${this.fullAddress}`
    },
    phoneUrl () {
      return `tel:${this.phone}`
    }
  },
  created () {
    this.getLocationDetails(this.id)
  },
  destroyed () {
    this.resetLocationDetails()
  },
  watch: {
    id (newId) {
      this.getLocationDetails(this.id)
    }
  },
  methods: {
    ...mapActions([
      'getLocationDetails'
    ]),
    ...mapMutations({
      resetLocationDetails: 'RESET_LOCATION_DETAILS'
    })
  }
}
</script>