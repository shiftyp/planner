export function parseCode(maybeCodeString: string) {
  // eslint-disable-next-line no-new-func
  return Function('"use strict";return (' + maybeCodeString + ")")();
}

export function stringifyObject(objectOrArray: Record<string, any> | any[]) {
  const string = JSON.stringify(objectOrArray, null, 2);
  // eslint-disable-next-line no-regex-spaces
  return string.replace(/  "([^"]+)"/g, "  $1");
}
