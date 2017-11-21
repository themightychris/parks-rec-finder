import * as types from '../../mutation-types'
import api from '@/sources/api'

import { normalize } from 'normalizr'
import {facilitySchema} from '@/store/modules/facilities/ppr-facility-schema'
import {programSchema} from '@/store/modules/programs/ppr-program-schema'
import {markerSchema} from '@/store/modules/markers/marker-schema'
import PPRFMarker from '@/store/modules/markers/Marker'

const state = {
  loading: false,
  error: null,
  success: false,

  fields: {
    freetext: '',
    address: '',
    zip: 0
  },
  filters: {}
}

const getters = {}

const actions = {
  submitSearch ({state, commit}, serachParams) {
    commit(types.SUBMIT_SEARCH, serachParams.fields, serachParams.filters)

    api.search(serachParams)
        .then(searchResults => {
          commit(types.RECEIVE_SEARCH_SUCCESS, searchResults)
          const totalResultsSet = searchResults[0].data.rows.concat(searchResults[1].data.rows)

          let normalizedFacilities = normalize(searchResults[0].data.rows, [facilitySchema])
          let normalizedPrograms = normalize(searchResults[1].data.rows, [programSchema])

          let markers = totalResultsSet.map(entity => new PPRFMarker(entity))
          let normailzedMarkers = normalize(markers, [markerSchema])
          console.log(normailzedMarkers)

          let normalizedResults = Object.assign({}, normalizedPrograms.entities, normalizedFacilities.entities, normailzedMarkers.entities)

          commit(types.UPDATE_FACILITIES, normalizedFacilities.result, {root: true})
          commit(types.UPDATE_PROGRAMS, normalizedPrograms.result, {root: true})

          commit(types.UPDATE_ENTITIES, { entities: normalizedResults })
        })
        .catch((err) => {
          console.log(err)
          commit(types.RECEIVE_SEARCH_FAILURE, err)
        })
  }
}

const mutations = {
  [types.SUBMIT_SEARCH] (state, fields, filters) {
    state.loading = true
    state.success = false
    state.fields = fields
    state.filters = filters
  },

  [types.RECEIVE_SEARCH_SUCCESS] (state, rawResutlsSets) {
    state.loading = false
    state.success = true
  },

  [types.RECEIVE_SEARCH_FAILURE] (state, err) {
    state.loading = false
    state.success = false
    state.error = err
  }
}

export default {
  state,
  getters,
  actions,
  mutations
}
