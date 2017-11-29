class PPRFMarker {
  constructor (entityType, entity) {
    this.entityType = entityType
    this.build(entityType, entity)
  }

  build (entityType, entity) {
    this.id = entity.id || entity.ID
    this.lat = entity.latitude
    this.lng = entity.longitude

    this.opacity = 1
    this.size = [20, 28]

    if (entity.hasOwnProperty('within_zip_code')) {
      this.inZip = entity.within_zip_code
      // this.opacity = entity.within_zip_code ? 1 : 0.25
      this.size = entity.within_zip_code ? [20, 28] : [10, 14]
    }

    switch (entityType) {
      case 'program':
        this.color = '#2176d2'
        this.name = entity.program_name
        break

      case 'facility':
        this.color = '#9400c6'
        this.name = entity.long_name
        this.address = entity.address
        this.assetID = entity.pprassets_object_id
        break
    }
  }

  _formatAddress () {
    if (this.address) {
      return `
        <address>
          ${this.address.street},<br/>
          ${this.address.city}, ${this.address.state} ${this.address.zip}
        </address>
      `
    } else {
      return ``
    }
  }

  content () {
    return `
      <h3>${this.name}</h3>
      ${this._formatAddress()}
    `
  }
}

export default PPRFMarker