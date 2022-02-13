/* tslint:disable */
/* eslint-disable */


export type Json = unknown;
export type format_enum = 'html' | 'markdown' | 'text';
export type user_status_enum = 'active' | 'confirmed' | 'deleted' | 'pending' | 'suspended';

// Table users
export interface Users {
  email: string;
  id: number;
  pass_crypt: string;
  creation_time: Date;
  display_name: string;
  data_public: boolean;
  description: string;
  home_lat: number | null;
  home_lon: number | null;
  home_zoom: number | null;
  nearby: number | null;
  pass_salt: string | null;
  image_file_name: string | null;
  email_valid: boolean;
  new_email: string | null;
  creation_ip: string | null;
  languages: string | null;
  status: user_status_enum;
  terms_agreed: Date | null;
  consider_pd: boolean;
  preferred_editor: string | null;
  terms_seen: boolean;
  auth_uid: string | null;
  description_format: format_enum;
  image_fingerprint: string | null;
  changesets_count: number;
  traces_count: number;
  diary_entries_count: number;
  image_use_gravatar: boolean;
  image_content_type: string | null;
  auth_provider: string | null;
  uuid_column: string | null;
  number: number | null;
  string: string | null;
  money_col: number | null;
  char_col: string | null;
  time_col: string | null;
  inet_col: string | null;
  jsonb_col: Json | null;
  numeric_col: number | null;
  bytea_col: string | null;
  bool_array_col: boolean[] | null;
  varchar_array_col: string[] | null;
  int2_array_col: number[] | null;
  int4_array_col: number[] | null;
  int8_array_col: number[] | null;
  uuid_array_col: string[] | null;
  text_array_col: string[] | null;
  bytea_array_col: string[] | null;
  real_col: number | null;
  double_col: number | null;
  time_with_tz: string | null;
  oid_col: number | null;
  interval_col: string | null;
  json_col: Json | null;
  date_col: Date | null;
  unspported_path_type: any | null;
  name_type_col: string | null;
  json_array_col: Json[] | null;
  jsonb_array_col: Json[] | null;
  timestamptz_array_col: Date[] | null;
}
export interface UsersInput {
  email: string;
  id: number;
  pass_crypt: string;
  creation_time: Date;
  display_name?: string;
  data_public?: boolean;
  description?: string;
  home_lat?: number | null;
  home_lon?: number | null;
  home_zoom?: number | null;
  nearby?: number | null;
  pass_salt?: string | null;
  image_file_name?: string | null;
  email_valid?: boolean;
  new_email?: string | null;
  creation_ip?: string | null;
  languages?: string | null;
  status?: user_status_enum;
  terms_agreed?: Date | null;
  consider_pd?: boolean;
  preferred_editor?: string | null;
  terms_seen?: boolean;
  auth_uid?: string | null;
  description_format?: format_enum;
  image_fingerprint?: string | null;
  changesets_count?: number;
  traces_count?: number;
  diary_entries_count?: number;
  image_use_gravatar?: boolean;
  image_content_type?: string | null;
  auth_provider?: string | null;
  uuid_column?: string | null;
  number?: number | null;
  string?: string | null;
  money_col?: number | null;
  char_col?: string | null;
  time_col?: string | null;
  inet_col?: string | null;
  jsonb_col?: Json | null;
  numeric_col?: number | null;
  bytea_col?: string | null;
  bool_array_col?: boolean[] | null;
  varchar_array_col?: string[] | null;
  int2_array_col?: number[] | null;
  int4_array_col?: number[] | null;
  int8_array_col?: number[] | null;
  uuid_array_col?: string[] | null;
  text_array_col?: string[] | null;
  bytea_array_col?: string[] | null;
  real_col?: number | null;
  double_col?: number | null;
  time_with_tz?: string | null;
  oid_col?: number | null;
  interval_col?: string | null;
  json_col?: Json | null;
  date_col?: Date | null;
  unspported_path_type?: any | null;
  name_type_col?: string | null;
  json_array_col?: Json[] | null;
  jsonb_array_col?: Json[] | null;
  timestamptz_array_col?: Date[] | null;
}
const users = {
  tableName: 'users',
  columns: ['email', 'id', 'pass_crypt', 'creation_time', 'display_name', 'data_public', 'description', 'home_lat', 'home_lon', 'home_zoom', 'nearby', 'pass_salt', 'image_file_name', 'email_valid', 'new_email', 'creation_ip', 'languages', 'status', 'terms_agreed', 'consider_pd', 'preferred_editor', 'terms_seen', 'auth_uid', 'description_format', 'image_fingerprint', 'changesets_count', 'traces_count', 'diary_entries_count', 'image_use_gravatar', 'image_content_type', 'auth_provider', 'uuid_column', 'number', 'string', 'money_col', 'char_col', 'time_col', 'inet_col', 'jsonb_col', 'numeric_col', 'bytea_col', 'bool_array_col', 'varchar_array_col', 'int2_array_col', 'int4_array_col', 'int8_array_col', 'uuid_array_col', 'text_array_col', 'bytea_array_col', 'real_col', 'double_col', 'time_with_tz', 'oid_col', 'interval_col', 'json_col', 'date_col', 'unspported_path_type', 'name_type_col', 'json_array_col', 'jsonb_array_col', 'timestamptz_array_col'],
  requiredForInsert: ['email', 'id', 'pass_crypt', 'creation_time'],
  primaryKey: null,
  foreignKeys: {},
} as const;


export interface TableTypes {
  users: {
    select: Users;
    input: UsersInput;
  };
}

export const tables = {
  users,
}
