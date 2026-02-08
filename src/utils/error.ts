export class UnknownOriginError extends Error {
  vulnerabilityName: string;

  constructor(vulnerabilityName: string) {
    super("Unknown origin for vulnerability");
    this.name = "UnknownOriginError";
    this.message =
      "Unable to determine origin for vulnerability, cannot retrieve upgrade guidance.";
    this.vulnerabilityName = vulnerabilityName;
  }
}
