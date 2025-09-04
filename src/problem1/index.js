"use strict";
/**
 * Sum of first n natural numbers (1..n).
 *
 * Notes/assumptions:
 * - Treats non-positive `n` as 0 (i.e. no terms to add).
 * - Assumes the resulting sum fits within Number.MAX_SAFE_INTEGER.
 * - Uses a closed-form formula and avoids intermediate overflow by halving
 *   one factor before multiplying.
 *
 * @param {number} n Any integer
 * @returns {number} The summation 1 + 2 + ... + n (or 0 if n <= 0)
 */
var sum_to_n_a = function (n) {
  n = Math.trunc(Number(n));
  if (!Number.isFinite(n)) throw new TypeError("n must be a finite number");
  if (n <= 0) return 0;
  // Use Gauss's formula: n * (n + 1) / 2
  // To reduce risk of intermediate overflow, divide the even factor first.
  if ((n & 1) === 0) {
    // n is even: (n/2) * (n + 1)
    return (n / 2) * (n + 1);
  }
  // n is odd: n * ((n + 1)/2)
  return n * ((n + 1) / 2);
};
/**
 * Iterative summation using a simple for-loop.
 * This is easy to read and does not allocate extra arrays.
 *
 * @param {number} n Any integer
 * @returns {number} The summation 1 + 2 + ... + n (or 0 if n <= 0)
 */
var sum_to_n_b = function (n) {
  n = Math.trunc(Number(n));
  if (!Number.isFinite(n)) throw new TypeError("n must be a finite number");
  if (n <= 0) return 0;
  let sum = 0;
  for (let i = 1; i <= n; i++) sum += i;
  return sum;
};
/**
 * Pairing method (Gauss-style) without using the direct formula.
 * Adds pairs from the ends inward: (1 + n) + (2 + n-1) + ...
 * If n is odd, the middle term is added once at the end.
 *
 * @param {number} n Any integer
 * @returns {number} The summation 1 + 2 + ... + n (or 0 if n <= 0)
 */
var sum_to_n_c = function (n) {
  n = Math.trunc(Number(n));
  if (!Number.isFinite(n)) throw new TypeError("n must be a finite number");
  if (n <= 0) return 0;
  let left = 1;
  let right = n;
  let sum = 0;
  while (left < right) {
    sum += left + right;
    left++;
    right--;
  }
  // If n is odd, there is a middle element left === right
  if (left === right) sum += left;
  return sum;
};
