import Handlebars from "handlebars";
import { createHash, generateRandomString } from "./index.js";

// Block helper: {{#uppercase}} some text {{/uppercase}} --> SOME TEXT
Handlebars.registerHelper("uppercase", function (options) {
  const content = options.fn(this);
  return content.toUpperCase();
});

// Block helper: {{#lowercase}} SOME TEXT {{/lowercase}} --> some text
Handlebars.registerHelper("lowercase", function (options) {
  const content = options.fn(this);
  return content.toLowerCase();
});

// Block helper: {{#trim}} hello {{/trim}} --> hello
Handlebars.registerHelper("trim", function (options) {
  const content = options.fn(this);
  return content.trim();
});

// Block helper: {{#randomstring length is_special is_no_numbers is_no_letters}}{{/randomstring}}
Handlebars.registerHelper("randomstring", function (...args) {
  const length = args.length > 1 && args[0];
  const is_special = args.length > 2 && args[1];
  const is_no_numbers = args.length > 3 && args[2];
  const is_no_letters = args.length > 4 && args[3];

  return generateRandomString(length, is_special, is_no_numbers, is_no_letters);
});

// Block helper: {{#hash}} some text {{/hash}} --> SHA256 hash of "some text"
Handlebars.registerHelper("hash", function (options) {
  const content = options.fn(this);
  return createHash(content);
});
