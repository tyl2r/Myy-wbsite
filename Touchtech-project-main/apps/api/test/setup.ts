// Jest setup shared by all suites.
// BigInt is not JSON-serializable by default; make it printable so failed
// assertions involving bigint values render readable diffs.
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function () {
  return this.toString();
};
