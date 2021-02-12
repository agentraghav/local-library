const mongoose = require('mongoose');

const { DateTime } = require('luxon');

const Schema = mongoose.Schema;

var AuthorSchema = new Schema({
  first_name: { type: String, required: true, maxlength: 200 },
  family_name: { type: String, required: true, maxlength: 200 },
  date_of_birth: { type: Date },
  date_of_death: { type: Date },
});

AuthorSchema.virtual('name').get(function () {
  return this.family_name + ', ' + this.first_name;
});

AuthorSchema.virtual('date_of_birth_format').get(function () {
  return this.date_of_birth
    ? DateTime.fromJSDate(this.date_of_birth).toLocaleString(DateTime.DATE_MED)
    : 'NA';
});

AuthorSchema.virtual('date_of_death_format').get(function () {
  return this.date_of_death
    ? DateTime.fromJSDate(this.date_of_death).toLocaleString(DateTime.DATE_MED)
    : 'Alive';
});

AuthorSchema.virtual('date_of_birth_GET').get(function () {
  return this.date_of_birth
    ? DateTime.fromJSDate(this.date_of_birth).toISODate()
    : 'NA';
});

AuthorSchema.virtual('date_of_death_GET').get(function () {
  return this.date_of_death
    ? DateTime.fromJSDate(this.date_of_death).toISODate()
    : 'Alive';
});

AuthorSchema.virtual('lifespan').get(function () {
  return `$`;
});

AuthorSchema.virtual('url').get(function () {
  return '/catalog/author/' + this._id;
});

module.exports = mongoose.model('Author', AuthorSchema);
