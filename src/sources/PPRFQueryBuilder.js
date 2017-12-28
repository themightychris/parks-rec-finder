import _ from 'underscore'
import squel from 'squel'
import tables from './CartoDBTables'
import ProgramsQuery from './ProgramQueries'
import TaxonomyQuery from './TaxonomyQuery'

export default class PPRFQuery {
  constructor (build) {
    this.entityType = build.entityType
    this.queryString = build.query.toString()
    this.queryObject = build.query
  }

  get query () {
    return this.queryString
  }

  static get Builder () {
    class Builder {
      constructor (entityType, entityOptions) {
        this.entityType = entityType
        this.postgreSQL = squel.useFlavour('postgres')
        this.options = entityOptions
        switch (entityType) {
          case 'program':
          case 'programs':
          case 'activities':
          case 'activitiy':
            this.DBtable = tables.programs
            this.query = new ProgramsQuery(this)
            break
          case 'programsCategory':
          case 'activitiesCategory':
            this.DBtable = tables.programs
            this.query = new ProgramsQuery(this)
            this.fields([
              'program_name_full',
              `id`,
              'program_id',
              'activity_type',
              'program_name',
              'program_description',
              'age_low',
              'age_high',
              'fee',
              {'gender->>0': 'gender'}
            ])
            this.query
                .join(tables.programCategories, 'category', `category.id = ${this.DBtable}.activity_category->>0`)
                .field(`category`)
                .where(`category.activity_category_name = '${this.options.term}'`)

            break
          case 'programsCategories':
          case 'programCategories':
          case 'activitiesCategories':
          case 'activityCategories':
            this.entityType = 'programs'
            this.DBtable = tables.programCategories
            this.query = new TaxonomyQuery(this)
            break
          case 'locationsCategories':
          case 'locationCategories':
          case 'facilitiesCategories':
          case 'facilityCategories':
          case 'placesCategories':
            this.entityType = 'facilities'
            this.DBtable = tables.locationCategories
            this.query = new TaxonomyQuery(this)
            break
          case 'days':
            this.DBtable = tables.days
            this.query = this.postgreSQL.select().from(this.DBtable)
            break
        }
      }

      where (whereClause) {
        this.query.where(whereClause)
        return this.query
      }

      fields (fieldDefs) {
        if (_.isArray(fieldDefs)) {
          fieldDefs.forEach(field => {
            if (_.isObject(field)) {
              this.query.field(`${this.DBtable}.${Object.keys(field)[0]}`, Object.values(field)[0])
            } else {
              this.query.field(`${this.DBtable}.${field}`)
            }
          })
        }

        return this
      }

      joinPPRAssets () {
        this.query
             .join(tables.assets, null, `${tables.facilities}.website_locator_points_link_id = ${tables.assets}.linkid`)
             .field(`ST_Y(
                      ST_Centroid(${tables.assets}.the_geom)
                      ) as latitude`)
            .field(`ST_X(
              ST_Centroid(${tables.assets}.the_geom)
              ) as longitude`)
        return this
      }

      build () {
        // console.log(this.query.toString())
        return new PPRFQuery(this)
      }
    }

    return Builder
  }
}