import "@ancplua/typespec-maf";

/**
 * Local smoke / sample spec.
 *
 * PR-0 scaffold: imports the (empty) `@ancplua/typespec-maf` authoring library
 * so `npm run compile` exercises the toolchain — library load, validation, and
 * a no-op emitter run — end to end. Real sample agents and workflows arrive
 * with the emitters in PR-1+ (see `docs/PRD.md` §6).
 */
namespace Sample;
