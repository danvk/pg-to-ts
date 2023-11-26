/**
 * Generate typescript interface from table schema
 * Created by xiamx on 2016-08-10.
 */

//tslint:disable

import _ from 'lodash';

import {TableDefinition, ForeignKey} from './schemaInterfaces';
import Options from './options';

function nameIsReservedKeyword(name: string): boolean {
  const reservedKeywords = ['string', 'number', 'package', 'public'];
  return reservedKeywords.indexOf(name) !== -1;
}

/**
 * Returns a version of the name that can be used as a symbol name, e.g.
 * 'number' --> 'number_'.
 */
function getSafeSymbolName(name: string): string {
  if (nameIsReservedKeyword(name)) {
    return name + '_';
  } else {
    return name;
  }
}

/** Converts snake_case --> CamelCase */
function toCamelCase(name: string) {
  return name
    .split('_')
    .map(word => (word ? word[0].toUpperCase() + word.slice(1) : ''))
    .join('');
}

function quotedArray(xs: string[]) {
  return '[' + xs.map(x => `'${x}'`).join(', ') + ']';
}

function quoteNullable(x: string | null | undefined) {
  return x === null || x === undefined ? 'null' : `'${x}'`;
}

function quoteForeignKeyMap(x: {[columnName: string]: ForeignKey}): string {
  const colsTs = _.map(x, (v, k) => {
    return `${k}: { table: '${v.table}', column: '${v.column}', $type: null as unknown /* ${v.table} */ },`;
  });
  return '{' + colsTs.join('\n  ') + '}';
}

const JSDOC_TYPE_RE = /@type \{([^}]+)\}/;

function isNonNullish<T>(x: T): x is Exclude<T, null | undefined> {
  return x !== null && x !== undefined;
}

export interface TableNames {
  var: string;
  type: string;
  input: string;
}

/**
 * generateTableInterface() leaves some references to be filled in later, when a more complete
 * picture of the schema is available. This fills those references in:
 * 'null as unknown /* users *\/' --> 'null as unknown as Users'.
 */
export function attachJoinTypes(
  tableTs: string,
  tableToNames: Record<string, TableNames>,
): string {
  return tableTs.replace(
    /(\$type: null as unknown) \/\* ([^*]+) \*\//g,
    (match, g1, tableName) => {
      const names = tableToNames[tableName];
      return names ? g1 + ' as ' + names.type : match;
    },
  );
}

/** Returns [Table TypeScript, output variable name, set of TS types to import] */
export function generateTableInterface(
  tableName: string,
  tableDefinition: TableDefinition,
  schemaName: string,
  options: Options,
): [code: string, names: TableNames, typesToImport: Set<string>] {
  let selectableMembers = '';
  let insertableMembers = '';
  const columns: string[] = [];
  const requiredForInsert: string[] = [];
  const typesToImport = new Set<string>();

  for (const columnNameRaw of Object.keys(tableDefinition.columns)) {
    const columnName = options.transformColumnName(columnNameRaw),
      columnDef = tableDefinition.columns[columnNameRaw],
      comment = columnDef.comment,
      possiblyOrNull = columnDef.nullable ? ' | null' : '',
      insertablyOptional =
        columnDef.nullable || columnDef.hasDefault ? '?' : '',
      jsdoc = comment ? `/** ${comment} */\n` : '';

    let {tsType} = columnDef;
    if (options.options.jsonTypesFile && comment) {
      const m = JSDOC_TYPE_RE.exec(comment);
      if (m) {
        tsType = m[1].trim();
        typesToImport.add(tsType);
      }
    }

    selectableMembers += `${jsdoc}${columnName}: ${tsType}${possiblyOrNull};\n`;
    insertableMembers += `${jsdoc}${columnName}${insertablyOptional}: ${tsType}${possiblyOrNull};\n`;

    columns.push(columnName);
    if (!columnDef.nullable && !columnDef.hasDefault) {
      requiredForInsert.push(columnName);
    }
  }

  const {prefixWithSchemaNames} = options.options;
  let qualifiedTableName = tableName;
  let sqlTableName = tableName;
  if (prefixWithSchemaNames) {
    qualifiedTableName = schemaName + '_' + qualifiedTableName;
    sqlTableName = schemaName + '.' + sqlTableName;
  }
  const tableVarName = getSafeSymbolName(qualifiedTableName); // e.g. schema_table_name
  const camelTableName = toCamelCase(tableVarName); // e.g. SchemaTableName

  const {primaryKey, comment} = tableDefinition;
  const foreignKeys = _.pickBy(
    _.mapValues(tableDefinition.columns, c => c.foreignKey),
    isNonNullish,
  );
  const jsdoc = comment ? `/** ${comment} */\n` : '';

  const names: TableNames = {
    var: tableVarName,
    type: camelTableName,
    input: camelTableName + 'Input',
  };

  return [
    `
      // Table ${sqlTableName}
      ${jsdoc} export interface ${names.type} {
        ${selectableMembers}}
      ${jsdoc} export interface ${names.input} {
        ${insertableMembers}}
      const ${names.var} = {
        tableName: '${sqlTableName}',
        columns: ${quotedArray(columns)},
        requiredForInsert: ${quotedArray(requiredForInsert)},
        primaryKey: ${quoteNullable(primaryKey)},
        foreignKeys: ${quoteForeignKeyMap(foreignKeys)},
        $type: null as unknown as ${names.type},
        $input: null as unknown as ${names.input}
      } as const;
  `,
    names,
    typesToImport,
  ];
}

export function generateEnumType(
  enumObject: Record<string, string[]>,
  options: Options,
) {
  let enumString = '';
  for (const enumNameRaw in enumObject) {
    const enumName = options.transformTypeName(enumNameRaw);
    enumString += `export type ${enumName} = `;
    enumString += enumObject[enumNameRaw]
      .map((v: string) => `'${v}'`)
      .join(' | ');
    enumString += ';\n';
  }
  return enumString;
}
