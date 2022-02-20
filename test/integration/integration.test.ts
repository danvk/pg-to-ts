import {cliTest} from './cli-test';
import {schemaGenerationTest} from './schema-generation-test';

// The integration tests are defined this way so that they run in serial.
// (This is required because there's only one DB to work with.)
// See https://stackoverflow.com/a/59487370/388951
describe('Integration tests', () => {
  describe('CLI', cliTest);
  describe('Schema generation', schemaGenerationTest);
});
