import axios from 'axios'
import resolveEntityType from '@/utilities/entity-type-resolver'
import PPRFQuery from './PPRFQueryBuilder'
import tables from './CartoDBTables'
import LocalCacheManager from './LocalCacheManager'

const LOG_QUERIES = process.env.NODE_ENV === 'development'
const CACHE_QUERIES = process.env.CARTO_API.CACHE_QUERIES

/**
 * API abstracton layer for querying the City of Philadelphia's CARTO ( Location Intelligence Software) Database
 * @docs https://cityofphiladelphia.github.io/carto-api-explorer/#<table-name>
 * Since CARTO only has one endpoint (read-only) that you pass a postgresSQL statemnt strings to
 * this constructos those statements and provides a REST-like API to be used by PPRF internally.p
 *
 * @since 0.1.0
 */
class CartoAPI {
  constructor (httpClient) {
    this.LOG_QUERIES = LOG_QUERIES
    // set our api base url for all requests
    this.http = httpClient.create({baseURL: process.env.CARTO_API.BASE})
    this.programFields = ['id', 'program_name', 'program_description', 'age_low', 'age_high', 'fee', {'gender->>0': 'gender'}]
  }

  /**
   * GET SQL query results from the Cart API
   * @param  {string} sqlString - SQL Query Statement
   * @return {object}           Prmoise Object with raw results
   *
   * @since 0.1.0
   */
  runQuery (sqlQuery) {
    let sqlString = sqlQuery.build()
    let cachedQuery = LocalCacheManager.getRow(sqlString)
    if (cachedQuery) {
      if (this.LOG_QUERIES) {
        console.log(`Carto API::runQuery:fromLocalCache \n ${sqlString}`)
      }
      return new Promise((resolve) => {
        resolve(cachedQuery)
      })
    }

    if (this.LOG_QUERIES) {
      console.log(`Carto API::runQuery:fromDB \n ${sqlString}`)
    }

    return this.http.get(`sql?q=${encodeURIComponent(sqlString)}`)
                    .then(results => {
                      if (CACHE_QUERIES) {
                        LocalCacheManager.store(sqlString, results)
                      }
                      return results
                    })
  }

  /**
   * given search parameters and/or coords search the CartoAPI
   * for both Facilities and Programs.
   * This provides a nice aggregate dataset for the front-end to consume.
   *
   * @param  {object} searchParams search fields and filter object {definition: value}
   * @param  {??} coords       coordinates to sort by
   * @return {object} Promise with facilities = data[0].data.rows
   *                                programs =  data[1].data.rows
   *
   * @since 0.1.0
 */
  search (searchParams, coords) {
    let facilitiesSearchQuery = this.getFacilities(searchParams.fields.freetext, coords)
    let programsSearchQuery = this.getPrograms(searchParams.fields.freetext, coords, searchParams.filters)
    return Promise.all([facilitiesSearchQuery, programsSearchQuery])
  }

  /**
   * get all results from the ppr_days table
   * @return {object} Promise
   *
   * @since 0.1.0
   */
  getDays () {
    return this.runQuery(new PPRFQuery.Builder('days'))
  }

  /**
   * Given freetext and coordniates values
   * return a SQL query string to search the PPR_Programs tables
   * @param  {object} serachParams - UI serach field key values paris
   * @param  {string} coords - comma separated latitude and longitude  of address search field value
   * @return {string}              SQL query
   *
   * @since 0.1.0
   */
  getPrograms (freetextValue, coords = null, filters = null) {
    this.programs = new PPRFQuery.Builder('programs')
                                   .fields(this.programFields)
                                   .joinPPRAssets()

    // get facilites and assets with latitude and longitude values
    if (coords) {
      this.programs.addDistanceFieldFromCoordinates(coords)
      this.programs.order('distance, lower(program_name)')
    } else {
      this.programs.order('lower(program_name)')
    }

    if (freetextValue) {
      // search via user input text value
      this.programs.searchFieldsFor(['program_name', 'program_description'], freetextValue)
    }

    if (filters) {
      this.programs.addFilters(filters)
    }

    return this.runQuery(this.programs)
  }

  /**
   * get a program entity by id
   * @param  {string} programID program.program_id
   *
   * @return {object}           Promise
   *
   * @since 0.1.0
   */
  getProgramByID (programID) {
    let programQuery = new PPRFQuery.Builder('program', {id: programID})
                                    .fields([{'fee_frequency->>0': 'fee_frequency'}, ...this.programFields])
                                    .joinPPRAssets()
    return this.runQuery(programQuery)
  }

  /**
   * given a program_id get all associated
   * schedule days for that program
   * @param  {string} programID program.program_id
   * @return {object}           Promise
   */

  getProgramSchedules (programID) {
    return this.runQuery(new PPRFQuery.Builder('programSchedules', {id: programID}))
  }

  /**
   * given a facility_id get all associated
   * schedule days for that facility
   * @param  {string} facilityID facility.facility_id
   * @return {object}           Promise
   */

  getFacilitySchedules (facilityID) {
    return this.runQuery(new PPRFQuery.Builder('facilitySchedules', {id: facilityID}))
  }
  /**
   * Given a `facility_id` get all programs associated
   * with that facility
   * @param  {string} facilityID facility.facility_id
   * @return {object}            Promise
   *
   * @since 0.1.0
   */
  getProgramsByFacilityID (facilityID) {
    return this.runQuery(
       new PPRFQuery.Builder('program').fields(['id', 'program_name']).where(`ppr_programs.facility->>0 = '${facilityID}'`)
    )
  }

  /**
   * Given freetext and coordniates values
   * return a SQL query string to serach the PPR_Facilites and PPR_Assets tables
   * @param  {object} serachParams - UI serach field key values paris
   * @param  {string} coords - comma separated latitude and longitude  of address search field value
   * @return {object}              Promise
   *
   * @since 0.1.0
   */
  getFacilities (freetextValue, coords = null) {
    this.facilities = new PPRFQuery.Builder('facilities')
                                   .joinPPRAssets()

    if (coords) {
      this.facilities.addDistanceFieldFromCoordinates(coords)
      this.facilities.order('distance, lower(facility_name)')
    } else {
      this.facilities.order('lower(facility_name)')
    }

    if (freetextValue) {
      // search facilites via user input text value
      this.facilities.searchFieldsFor(['facility_description', 'facility_name', 'long_name'], freetextValue)
    }

    return this.runQuery(this.facilities)
  }

  /**
   * Get facility by facility_id
   * @param  {string} facilityID facility_id, not the id column
   * @return {object}            Promise
   *
   * @since 0.1.0
   */
  getFacilityByID (facilityID) {
    return this.runQuery(
      new PPRFQuery.Builder('facility', {id: facilityID})
                   .joinPPRAssets()
    )
  }

  /**
   * given an entity type get a list of entity categories
   * @param  {string} entityType name of entity
   * @return {void}
   *
   * @since 0.1.0
   */
  getEntityTaxonomy ({entityType, taxonomy}) {
    if (taxonomy === 'category') { taxonomy = 'Categories' }
    let taxonomyQuery = new PPRFQuery.Builder(`${entityType}${taxonomy}`)
    return this.runQuery(taxonomyQuery)
  }

  /**
   * given an entity object retrieve all entites with given taxonomyTerm
   * @param  {object} entity {entityType: String, taxonomyTerm: String}
   * @return {void}
   *
   * @since 0.1.0
   */
  getTaxonomyTermEntities (entity, filters) {
    let _entity = resolveEntityType(entity.type)

    let categoryEntityQuery = new PPRFQuery.Builder(`${_entity.name}Category`)

    if (_entity.name === 'program') {
      categoryEntityQuery
        .fields(['program_name_full', `id`, 'program_id', 'activity_type', 'program_name', 'program_description', 'age_low', 'age_high', 'fee', {'gender->>0': 'gender'}], _entity.DBTable)
        .field('lower(activity_category_name) as activity_category_name')
        .join(tables.programCategories, 'category', `category.id = ${_entity.DBTable}.activity_category->>0`)
        .where(`activity_category ? '${entity.termId}'`)

      if (filters) {
        categoryEntityQuery
          .addFilters(filters)
      }
    } else if (_entity.name === 'facility') {
      categoryEntityQuery
        .where(`location_type ? '${entity.termId}'`)
    }

    return this.runQuery(categoryEntityQuery.joinPPRAssets())
  }

  getTaxonomyTermId (entityType, entityTerm) {
    const query = new PPRFQuery.Builder(`${entityType}CategoryId`, {entityTerm})
    return this.runQuery(query)
  }

  getZipCentroid (zip) {
    return this.runQuery(new PPRFQuery.Builder('zip', {zip}))
      .then((response) => {
        const rows = response.data.rows
        if (rows.length < 1) {
          throw new Error('No zipcode found')
        }
        return rows[0].centroid.coordinates
      })
  }
}

export let cartoAPI = new CartoAPI(axios)
