/**
 * Uses the arithmetic series formula: n * (n + 1) / 2
 * This is the most efficient approach as it calculates the result directly.
 */
var sum_to_n_a = function(n) {
    return (n * (n + 1)) / 2;
};

/**
 * Iterative Loop
 * Uses a simple for loop to accumulate the sum from 1 to n.
 */
var sum_to_n_b = function(n) {
    let sum = 0;
    for (let i = 1; i <= n; i++) {
        sum += i;
    }
    return sum;
};

/**
 * Recursively adds n to the sum of all numbers from 1 to n-1.
 * Base case: when n <= 0, return 0.
 */
var sum_to_n_c = function(n) {
    if (n <= 0) return 0;
    if (n === 1) return 1;
    return n + sum_to_n_c(n - 1);
};
