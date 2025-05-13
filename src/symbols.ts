export class Parameter {
  constructor(
    public name: string,
    public type: string | null,
    public description: string | null
  ) {}
}

export class Method {
  constructor(
    public name: string,
    public description: string | null,
    public parameters: Parameter[] = []
  ) {}
}

export class Class {
  constructor(
    public name: string,
    public description: string | null,
    public methods: Method[] = []
  ) {}
}