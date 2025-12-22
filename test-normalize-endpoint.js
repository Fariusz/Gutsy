#!/usr/bin/env node

/**
 * Simple test script for the ingredient normalization endpoint
 * Tests various input scenarios and validates responses
 */

const ENDPOINT_URL = "http://localhost:3000/api/ingredients/normalize";
const AUTH_TOKEN = "test-auth-token"; // You would need a real token for testing

const testCases = [
  {
    name: "Simple ingredient",
    input: { raw_text: "tomatoes" },
    expectStatus: 200,
  },
  {
    name: "Complex ingredient phrase",
    input: { raw_text: "spicy tomato sauce with basil and oregano" },
    expectStatus: 200,
  },
  {
    name: "Empty string",
    input: { raw_text: "" },
    expectStatus: 400,
  },
  {
    name: "Too long text",
    input: { raw_text: "a".repeat(150) },
    expectStatus: 400,
  },
  {
    name: "Only whitespace",
    input: { raw_text: "   " },
    expectStatus: 400,
  },
  {
    name: "No ingredients found",
    input: { raw_text: "xyz123 nonexistent ingredient" },
    expectStatus: 422,
  },
];

async function runTest(testCase) {
  console.log(`\\n🧪 Testing: ${testCase.name}`);
  console.log(`📥 Input: ${JSON.stringify(testCase.input)}`);

  try {
    const response = await fetch(ENDPOINT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
      body: JSON.stringify(testCase.input),
    });

    const data = await response.json();

    console.log(`📊 Status: ${response.status}`);
    console.log(`📤 Response: ${JSON.stringify(data, null, 2)}`);

    if (response.status === testCase.expectStatus) {
      console.log(`✅ PASS: Status matches expected ${testCase.expectStatus}`);
    } else {
      console.log(`❌ FAIL: Expected status ${testCase.expectStatus}, got ${response.status}`);
    }

    // Additional validations for successful responses
    if (response.status === 200) {
      if (data.data && Array.isArray(data.data)) {
        console.log(`✅ PASS: Response has data array with ${data.data.length} items`);

        if (data.data.length > 0) {
          const firstMatch = data.data[0];
          const hasRequiredFields =
            firstMatch.ingredient_id &&
            firstMatch.name &&
            typeof firstMatch.match_confidence === "number" &&
            firstMatch.match_method;

          if (hasRequiredFields) {
            console.log(`✅ PASS: First match has all required fields`);
          } else {
            console.log(`❌ FAIL: First match missing required fields`);
          }
        }
      } else {
        console.log(`❌ FAIL: Response missing data array`);
      }
    }
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
  }
}

async function main() {
  console.log("🚀 Starting Ingredient Normalization API Tests");
  console.log("=".repeat(50));

  // Note: These tests require authentication
  console.log("⚠️  Warning: These tests require valid authentication");
  console.log("⚠️  Update AUTH_TOKEN with a valid session token to run");

  for (const testCase of testCases) {
    await runTest(testCase);
  }

  console.log("\\n" + "=".repeat(50));
  console.log("🏁 Tests completed");
}

// Uncomment to run tests (requires valid auth token)
// main().catch(console.error);

console.log("Test script ready. Update AUTH_TOKEN and uncomment main() to run tests.");
