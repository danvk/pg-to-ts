export {};

type T = undefined extends 'str' ? true : false;
// true for me, but false on the Playground. What gives?
