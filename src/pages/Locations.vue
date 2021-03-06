<template>
  <main>
    <aside
      v-if="isMapVisible"
      class="sidebar">
      <div
        v-if="isLoading"
        class="pam center">
        <FontAwesomeIcon
          icon="spinner"
          spin
          size="3x"/>
      </div>
      <div
        v-else-if="error"
        data-testid="error"
        class="pam">
        <b>Error:</b> {{ error }}
      </div>
      <div
        v-else
        class="grid-y medium-grid-frame">
        <div
          class="panel-head locations cell shrink medium-cell-block-container">
          <h2 data-testid="categoryName">{{ categoryName }}</h2>
          <ItemCount :count="count"/>
        </div>
        <LocationList :locations="locations"/>
      </div>
    </aside>
    <button
      class="button toggle-map hide-for-large"
      @click.prevent="toggleMap">
      Toggle map
    </button>
    <section class="map">
      <SiteMap
        v-if="$mq === 'lg' || !isMapVisible"
        :locations="locations"/>
    </section>
  </main>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import Raven from 'raven-js'
import SiteMap from '~/components/SiteMap'
import LocationList from '~/components/LocationList'
import ItemCount from '~/components/ItemCount'
import FontAwesomeIcon from '@fortawesome/vue-fontawesome'

export default {
  components: {
    SiteMap,
    LocationList,
    ItemCount,
    FontAwesomeIcon
  },
  data () {
    return {
      error: null,
      isLoading: false,
      isMapVisible: true
    }
  },
  computed: {
    ...mapState({
      categorySlug: (state) => state.route.params.categorySlug,
      locations: (state) => state.locations,
      categoryId: (state) => state.locationCategoryDetails.id,
      categoryName: (state) => state.locationCategoryDetails.name
    }),
    count () {
      return this.locations.length
    }
  },
  watch: {
    categorySlug: 'fetch'
  },
  created () {
    this.fetch()
  },
  destroyed () {
    this.resetLocationsByCategorySlug()
  },
  methods: {
    ...mapActions([
      'getLocationsByCategorySlug',
      'resetLocationsByCategorySlug'
    ]),
    async fetch () {
      this.error = null
      this.isLoading = true
      try {
        await this.getLocationsByCategorySlug(this.categorySlug)
      } catch (err) {
        this.error = err.message
        Raven.captureException(err)
      } finally {
        this.isLoading = false
      }
    },
    toggleMap () {
      this.isMapVisible = !this.isMapVisible
    }
  },
  metaInfo () {
    return {
      title: this.categoryName
    }
  }
}
</script>

<style lang="sass" scoped>
.panel-head.locations
  +fixed-header($locations)
  position: relative
  color: white

h2
  padding: 0 1rem
</style>
