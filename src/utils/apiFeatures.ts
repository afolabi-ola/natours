import { Query } from 'mongoose';
import { ParsedQs } from 'qs';

const SORT_ALLOWLIST = [
  'price',
  'ratingsAverage',
  'ratingsQuantity',
  'duration',
  'createdAt',
];

function sanitizeSort(sort?: string) {
  if (!sort) return '-createdAt';

  const allowed = new Set(SORT_ALLOWLIST);

  const validSort = sort
    .split(',')
    .filter((field) => allowed.has(field.replace('-', '')))
    .join(' ');

  return validSort || '-createdAt';
}

const FIELD_ALLOWLIST = [
  'name',
  'price',
  'ratingsAverage',
  'ratingsQuantity',
  'duration',
  'difficulty',
  'summary',
];

function sanitizeFields(fields?: string) {
  if (!fields) return '-__v';

  const allowed = new Set(FIELD_ALLOWLIST);

  const validFields = fields
    .split(',')
    .filter((f) => allowed.has(f))
    .join(' ');

  return validFields || '-__v';
}

export default class ApiFeatures<T> {
  query: Query<T[], T>;

  queryString: ParsedQs;

  constructor(query: Query<T[], T>, queryString: ParsedQs) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['sort', 'fields', 'page', 'limit'];
    excludedFields.forEach((field) => delete queryObj[field]);

    // 1b) Advanced Filtering
    let queryStr = JSON.stringify(queryObj);

    queryStr = queryStr.replace(/\b(gte|lte|lt|gt)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      // const sortBy = this.queryString.sort.toString().split(',').join(' ');
      const sortBy = sanitizeSort(this.queryString.sort.toString());
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      // const fields = this.queryString.fields.toString().split(',').join(' ');
      const fields = sanitizeFields(this.queryString.fields.toString());
      this.query = this.query.select(`${fields}`);
    } else {
      this.query = this.query.select('-__v');
    }

    return this;
  }

  paginate() {
    const limit = this.queryString.limit || 100;
    const page = this.queryString.page || 1;
    const skip = (Number(page) - 1) * Number(limit);

    this.query = this.query.skip(skip).limit(Number(limit));

    return this;
  }
}
