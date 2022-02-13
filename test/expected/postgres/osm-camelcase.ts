/* tslint:disable */
/* eslint-disable */


export type Json = unknown;
export type FormatEnum = 'html' | 'markdown' | 'text';
export type UserStatusEnum = 'active' | 'confirmed' | 'deleted' | 'pending' | 'suspended';

// Table Users
export interface Users {
  email: string;
  id: number;
  passCrypt: string;
  creationTime: Date;
  displayName: string;
  dataPublic: boolean;
  description: string;
  homeLat: number | null;
  homeLon: number | null;
  homeZoom: number | null;
  nearby: number | null;
  passSalt: string | null;
  imageFileName: string | null;
  emailValid: boolean;
  newEmail: string | null;
  creationIp: string | null;
  languages: string | null;
  status: UserStatusEnum;
  termsAgreed: Date | null;
  considerPd: boolean;
  preferredEditor: string | null;
  termsSeen: boolean;
  authUid: string | null;
  descriptionFormat: FormatEnum;
  imageFingerprint: string | null;
  changesetsCount: number;
  tracesCount: number;
  diaryEntriesCount: number;
  imageUseGravatar: boolean;
  imageContentType: string | null;
  authProvider: string | null;
  uuidColumn: string | null;
  number: number | null;
  string: string | null;
  moneyCol: number | null;
  charCol: string | null;
  timeCol: string | null;
  inetCol: string | null;
  jsonbCol: Json | null;
  numericCol: number | null;
  byteaCol: string | null;
  boolArrayCol: boolean[] | null;
  varcharArrayCol: string[] | null;
  int2ArrayCol: number[] | null;
  int4ArrayCol: number[] | null;
  int8ArrayCol: number[] | null;
  uuidArrayCol: string[] | null;
  textArrayCol: string[] | null;
  byteaArrayCol: string[] | null;
  realCol: number | null;
  doubleCol: number | null;
  timeWithTz: string | null;
  oidCol: number | null;
  intervalCol: string | null;
  jsonCol: Json | null;
  dateCol: Date | null;
  unspportedPathType: any | null;
  nameTypeCol: string | null;
  jsonArrayCol: Json[] | null;
  jsonbArrayCol: Json[] | null;
  timestamptzArrayCol: Date[] | null;
}
export interface UsersInput {
  email: string;
  id: number;
  passCrypt: string;
  creationTime: Date;
  displayName?: string;
  dataPublic?: boolean;
  description?: string;
  homeLat?: number | null;
  homeLon?: number | null;
  homeZoom?: number | null;
  nearby?: number | null;
  passSalt?: string | null;
  imageFileName?: string | null;
  emailValid?: boolean;
  newEmail?: string | null;
  creationIp?: string | null;
  languages?: string | null;
  status?: UserStatusEnum;
  termsAgreed?: Date | null;
  considerPd?: boolean;
  preferredEditor?: string | null;
  termsSeen?: boolean;
  authUid?: string | null;
  descriptionFormat?: FormatEnum;
  imageFingerprint?: string | null;
  changesetsCount?: number;
  tracesCount?: number;
  diaryEntriesCount?: number;
  imageUseGravatar?: boolean;
  imageContentType?: string | null;
  authProvider?: string | null;
  uuidColumn?: string | null;
  number?: number | null;
  string?: string | null;
  moneyCol?: number | null;
  charCol?: string | null;
  timeCol?: string | null;
  inetCol?: string | null;
  jsonbCol?: Json | null;
  numericCol?: number | null;
  byteaCol?: string | null;
  boolArrayCol?: boolean[] | null;
  varcharArrayCol?: string[] | null;
  int2ArrayCol?: number[] | null;
  int4ArrayCol?: number[] | null;
  int8ArrayCol?: number[] | null;
  uuidArrayCol?: string[] | null;
  textArrayCol?: string[] | null;
  byteaArrayCol?: string[] | null;
  realCol?: number | null;
  doubleCol?: number | null;
  timeWithTz?: string | null;
  oidCol?: number | null;
  intervalCol?: string | null;
  jsonCol?: Json | null;
  dateCol?: Date | null;
  unspportedPathType?: any | null;
  nameTypeCol?: string | null;
  jsonArrayCol?: Json[] | null;
  jsonbArrayCol?: Json[] | null;
  timestamptzArrayCol?: Date[] | null;
}
const Users = {
  tableName: 'Users',
  columns: ['email', 'id', 'passCrypt', 'creationTime', 'displayName', 'dataPublic', 'description', 'homeLat', 'homeLon', 'homeZoom', 'nearby', 'passSalt', 'imageFileName', 'emailValid', 'newEmail', 'creationIp', 'languages', 'status', 'termsAgreed', 'considerPd', 'preferredEditor', 'termsSeen', 'authUid', 'descriptionFormat', 'imageFingerprint', 'changesetsCount', 'tracesCount', 'diaryEntriesCount', 'imageUseGravatar', 'imageContentType', 'authProvider', 'uuidColumn', 'number', 'string', 'moneyCol', 'charCol', 'timeCol', 'inetCol', 'jsonbCol', 'numericCol', 'byteaCol', 'boolArrayCol', 'varcharArrayCol', 'int2ArrayCol', 'int4ArrayCol', 'int8ArrayCol', 'uuidArrayCol', 'textArrayCol', 'byteaArrayCol', 'realCol', 'doubleCol', 'timeWithTz', 'oidCol', 'intervalCol', 'jsonCol', 'dateCol', 'unspportedPathType', 'nameTypeCol', 'jsonArrayCol', 'jsonbArrayCol', 'timestamptzArrayCol'],
  requiredForInsert: ['email', 'id', 'passCrypt', 'creationTime'],
  primaryKey: null,
  foreignKeys: {},
} as const;


export interface TableTypes {
  Users: {
    select: Users;
    input: UsersInput;
  };
}

export const tables = {
  Users,
}
