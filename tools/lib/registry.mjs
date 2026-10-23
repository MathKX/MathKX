// Capability registries under content/registry/: reviewed lists of what tested code provides.
// Indexes generators and validators by name@version, representations by name, visual
// components by type, and misconception codes by code; checks their internal consistency.

export const versioned = (name, version) => `${name}@${version}`;

export function indexRegistries(entries, diagnostics) {
  const index = {
    count: entries.length,
    generators: new Map(),
    validators: new Map(),
    representations: new Map(),
    components: new Map(),
    codes: new Map(),
  };
  const keyOf = {
    generators: (e) => versioned(e.name, e.version),
    validators: (e) => versioned(e.name, e.version),
    representations: (e) => e.name,
    "visual-components": (e) => e.type,
    "misconception-codes": (e) => e.code,
  };
  const target = {
    generators: index.generators,
    validators: index.validators,
    representations: index.representations,
    "visual-components": index.components,
    "misconception-codes": index.codes,
  };

  for (const { file, data } of entries) {
    const map = target[data.kind];
    data.entries.forEach((entry, i) => {
      const key = keyOf[data.kind](entry);
      if (map.has(key)) {
        diagnostics.error(file, `duplicate name ${key}; also defined in ${diagnostics.relative(map.get(key).file)}`, { field: `entries[${i}]` });
        return;
      }
      map.set(key, { file, entry, index: i });
    });
  }

  const validatorNames = new Set([...index.validators.values()].map((v) => v.entry.name));
  for (const [code, { file, entry, index: i }] of index.codes) {
    if (!validatorNames.has(entry.validator)) {
      diagnostics.error(file, `${entry.validator} is not a registered validator`, {
        field: `entries[${i}].validator`,
        expected: validatorNames.size ? `one of: ${[...validatorNames].join(", ")}` : "a validator in content/registry/validators.json",
      });
    }
    void code;
  }
  for (const { file, entry, index: i } of index.validators.values()) {
    (entry.emits ?? []).forEach((code, j) => {
      if (!index.codes.has(code)) {
        diagnostics.error(file, `code ${code} is not registered`, { field: `entries[${i}].emits[${j}]`, expected: "an entry in content/registry/misconception-codes.json" });
      }
    });
  }
  for (const { file, entry, index: i } of index.components.values()) {
    if (entry.representation && !index.representations.has(entry.representation)) {
      diagnostics.error(file, `${entry.representation} is not a registered representation`, {
        field: `entries[${i}].representation`,
        expected: `one of: ${[...index.representations.keys()].join(", ")}`,
      });
    }
  }
  return index;
}

export const listKeys = (map) => (map.size ? `one of: ${[...map.keys()].join(", ")}` : "nothing is registered yet");
