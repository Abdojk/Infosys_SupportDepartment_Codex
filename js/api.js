import { CONFIG } from '../config/config.js';
import { getToken } from './auth.js';

const CASE_SELECT_FIELDS = [
  'incidentid',
  'title',
  'ticketnumber',
  'statecode',
  'statuscode',
  'createdon',
  'modifiedon',
  'ownerid',
  'owneridname',
  'owningteam',
  'prioritycode',
  'casetypecode'
];

const TIME_SELECT_FIELDS = [
  'msdyn_timeentryid',
  'msdyn_description',
  'msdyn_date',
  'msdyn_duration',
  'msdyn_entrystatus',
  'ownerid',
  'owneridname',
  'msdyn_bookableresource'
];

const USER_SELECT_FIELDS = ['systemuserid', 'fullname', 'internalemailaddress', 'businessunitid', 'isdisabled'];

function buildCaseFilterQuery(filters = {}) {
  const clauses = [];

  if (filters.owner) {
    const owner = filters.owner.replace(/[{}]/g, '');
    clauses.push(`_ownerid_value eq guid'${owner}'`);
  }

  if (filters.status !== '') {
    clauses.push(`statecode eq ${Number(filters.status)}`);
  }

  if (filters.priority !== '') {
    clauses.push(`prioritycode eq ${Number(filters.priority)}`);
  }

  if (filters.dateFrom) {
    clauses.push(`createdon ge ${filters.dateFrom}T00:00:00Z`);
  }

  if (filters.dateTo) {
    clauses.push(`createdon le ${filters.dateTo}T23:59:59Z`);
  }

  return clauses.join(' and ');
}

function buildTimeEntryFilterQuery(filters = {}) {
  const clauses = [];

  if (filters.owner) {
    const owner = filters.owner.replace(/[{}]/g, '');
    clauses.push(`_ownerid_value eq guid'${owner}'`);
  }

  if (filters.dateFrom) {
    clauses.push(`msdyn_date ge ${filters.dateFrom}`);
  }

  if (filters.dateTo) {
    clauses.push(`msdyn_date le ${filters.dateTo}`);
  }

  return clauses.join(' and ');
}

async function fetchAllPages(initialUrl) {
  const token = await getToken();
  const records = [];
  let nextUrl = initialUrl;

  while (nextUrl) {
    let response;
    try {
      response = await fetch(nextUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json; charset=utf-8',
          'OData-Version': '4.0',
          'OData-MaxVersion': '4.0',
          Prefer: 'odata.include-annotations="OData.Community.Display.V1.FormattedValue"'
        }
      });
    } catch (networkError) {
      throw new Error(`Network error while calling Dataverse API: ${networkError.message}`);
    }

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Dataverse API error ${response.status}: ${detail || response.statusText}`);
    }

    const payload = await response.json();
    records.push(...(payload.value || []));
    nextUrl = payload['@odata.nextLink'] || null;
  }

  return records;
}

function buildBaseUrl(entitySet) {
  return `${CONFIG.orgUrl}/api/data/v${CONFIG.apiVersion}/${entitySet}`;
}

export async function fetchCases(filters = {}) {
  const query = new URLSearchParams();
  query.set('$select', CASE_SELECT_FIELDS.join(','));

  const filterQuery = buildCaseFilterQuery(filters);
  if (filterQuery) {
    query.set('$filter', filterQuery);
  }

  query.set('$orderby', 'createdon desc');

  const url = `${buildBaseUrl('incidents')}?${query.toString()}`;
  return fetchAllPages(url);
}

export async function fetchTimeEntries(filters = {}) {
  const query = new URLSearchParams();
  query.set('$select', TIME_SELECT_FIELDS.join(','));

  const filterQuery = buildTimeEntryFilterQuery(filters);
  if (filterQuery) {
    query.set('$filter', filterQuery);
  }

  query.set('$orderby', 'msdyn_date desc');

  const url = `${buildBaseUrl('msdyn_timeentries')}?${query.toString()}`;
  return fetchAllPages(url);
}

export async function fetchSystemUsers() {
  const query = new URLSearchParams();
  query.set('$select', USER_SELECT_FIELDS.join(','));
  query.set('$filter', 'isdisabled eq false');
  query.set('$orderby', 'fullname asc');

  const url = `${buildBaseUrl('systemusers')}?${query.toString()}`;
  return fetchAllPages(url);
}
